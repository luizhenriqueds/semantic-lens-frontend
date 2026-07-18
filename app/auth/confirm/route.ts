import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { welcome } from "@/lib/email/templates";
import { createClient } from "@/lib/supabase/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const next = params.get("next") || "/dashboard";

  if (!tokenHash || !type) redirect("/login?erro=link-invalido");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) redirect("/login?erro=link-expirado");

  if (type === "signup" && data.user?.email) {
    await sendEmail({
      to: data.user.email,
      ...welcome({ name: data.user.user_metadata?.full_name, url: `${SITE}/dashboard` }),
    }).catch(() => {});
  }

  redirect(next);
}
