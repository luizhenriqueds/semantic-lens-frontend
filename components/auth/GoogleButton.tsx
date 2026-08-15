"use client";

import { useState } from "react";
import { OAUTH_START_FAILED } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.3z"
      />
      <path
        fill="#34A853"
        d="M24 46c6 0 11-2 14.5-5.2l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.6-3.9-12.3-9.1H4.3v5.7C7.8 41.1 15.3 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.7 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-3 .7-4.3v-5.7H4.3A22 22 0 0 0 2 24c0 3.6.9 6.9 2.3 9.9l7.4-5.6z"
      />
      <path
        fill="#EA4335"
        d="M24 10.6c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4 29.9 2 24 2 15.3 2 7.8 6.9 4.3 14.1l7.4 5.7c1.7-5.3 6.6-9.2 12.3-9.2z"
      />
    </svg>
  );
}

/** Social sign-in for both auth forms, with the divider above the e-mail fields. */
export default function GoogleButton({
  next,
  onError,
}: {
  next: string;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    onError("");
    // The origin, not NEXT_PUBLIC_SITE_URL: that one is unset on previews and would land the
    // browser on localhost.
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", next);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });
    if (error) {
      onError(OAUTH_START_FAILED);
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn ghost au-oauth" onClick={start} disabled={busy}>
        <GoogleMark />
        {busy ? "Redirecionando…" : "Continuar com Google"}
      </button>
      <div className="au-or">
        <span>ou</span>
      </div>
    </>
  );
}
