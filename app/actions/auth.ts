"use server";

import { sendEmail } from "@/lib/email/send";
import { passwordReset, signin, signupVerification } from "@/lib/email/templates";
import { supabase as admin } from "@/lib/supabase";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function confirmUrl(tokenHash: string, type: string, next: string) {
  const params = new URLSearchParams({ token_hash: tokenHash, type, next });
  return `${SITE}/auth/confirm?${params}`;
}

export async function registerAccount(input: { name: string; email: string; password: string }) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: input.email,
    password: input.password,
    options: { data: { full_name: input.name } },
  });

  if (error || !data.properties) {
    return { error: error?.message ?? "Não foi possível criar a conta." };
  }

  const url = confirmUrl(data.properties.hashed_token, "signup", "/dashboard");
  await sendEmail({ to: input.email, ...signupVerification({ name: input.name, url }) });
  return { ok: true };
}

export async function requestPasswordReset(email: string) {
  const { data } = await admin.auth.admin.generateLink({ type: "recovery", email });
  if (data?.properties) {
    const url = confirmUrl(data.properties.hashed_token, "recovery", "/auth/update-password");
    await sendEmail({
      to: email,
      ...passwordReset({ name: data.user?.user_metadata?.full_name, url }),
    });
  }
  return { ok: true };
}

export async function requestSigninLink(email: string) {
  const { data } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (data?.properties) {
    const url = confirmUrl(data.properties.hashed_token, "magiclink", "/dashboard");
    await sendEmail({ to: email, ...signin({ name: data.user?.user_metadata?.full_name, url }) });
  }
  return { ok: true };
}
