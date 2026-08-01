"use server";

import { mailFailure, registerError } from "@/lib/auth/messages";
import { TRIAL_ROLE } from "@/lib/entitlements";
import { withTrialParam } from "@/lib/entitlements/trialFlag";
import { sendEmail } from "@/lib/email/send";
import { passwordReset, signin, signupVerification } from "@/lib/email/templates";
import { supabase as admin } from "@/lib/supabase";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function confirmUrl(tokenHash: string, type: string, next: string) {
  const params = new URLSearchParams({ token_hash: tokenHash, type, next });
  return `${SITE}/auth/confirm?${params}`;
}

/** Only registered addresses reach a send, so a surfaced failure would leak which ones exist. */
async function sendQuietly(kind: string, message: Parameters<typeof sendEmail>[0]) {
  try {
    await sendEmail(message);
  } catch (e) {
    console.error(`[auth] ${kind} e-mail failed`, e);
  }
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  plan?: string;
}) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: input.email,
    password: input.password,
    options: { data: { full_name: input.name } },
  });

  if (error || !data.properties) {
    return { error: registerError(error) };
  }

  // Only the trial plan is self-serve, so it is the only one worth carrying through confirmation.
  const next = input.plan === TRIAL_ROLE ? withTrialParam("/dashboard", "") : "/dashboard";
  const url = confirmUrl(data.properties.hashed_token, "signup", next);
  try {
    await sendEmail({ to: input.email, ...signupVerification({ name: input.name, url }) });
  } catch (e) {
    // generateLink already created the user, so throwing here would crash the form and leave an
    // address that cannot be signed up again. The account is real; only the link is missing.
    console.error("[auth] signup e-mail failed", e);
    return { error: mailFailure };
  }
  return { ok: true };
}

export async function requestPasswordReset(email: string) {
  const { data } = await admin.auth.admin.generateLink({ type: "recovery", email });
  if (data?.properties) {
    const url = confirmUrl(data.properties.hashed_token, "recovery", "/auth/update-password");
    await sendQuietly("recovery", {
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
    await sendQuietly("magiclink", {
      to: email,
      ...signin({ name: data.user?.user_metadata?.full_name, url }),
    });
  }
  return { ok: true };
}
