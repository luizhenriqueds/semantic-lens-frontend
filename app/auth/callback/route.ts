import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { safeRedirect } from "@/lib/auth/redirect";
import { sendEmail } from "@/lib/email/send";
import { welcome } from "@/lib/email/templates";
import { createClient } from "@/lib/supabase/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** The provider does not say whether the account is new. On the first sign-in Supabase stamps both
 *  columns in the same insert; every later one widens the gap, so the welcome goes out once. */
function isFirstSignIn(user: User) {
  if (!user.last_sign_in_at) return true;
  return Date.parse(user.last_sign_in_at) - Date.parse(user.created_at) < 5000;
}

/** OAuth return leg. The PKCE verifier travels in a cookie the browser client wrote, so the
 *  exchange needs nothing from the query beyond the code. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const next = safeRedirect(params.get("next"));

  // Dismissing Google's consent screen comes back as ?error=access_denied, with no code.
  if (params.get("error")) redirect("/login?error=oauth-cancelled");
  if (!code) redirect("/login?error=oauth-failed");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) redirect("/login?error=oauth-failed");

  if (data.user?.email && isFirstSignIn(data.user)) {
    await sendEmail({
      to: data.user.email,
      ...welcome({ name: data.user.user_metadata?.full_name, url: `${SITE}/dashboard` }),
    }).catch(() => {});
  }

  redirect(next);
}
