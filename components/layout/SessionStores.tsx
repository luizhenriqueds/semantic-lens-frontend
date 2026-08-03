"use client";

import { useEffect } from "react";
import { refreshClientStores, resetClientStores } from "@/lib/clientStore";
import { createClient } from "@/lib/supabase/client";

// Driving this off auth state rather than the sign-out handler also covers token expiry
// and sign-out from another tab.
export default function SessionStores() {
  useEffect(() => {
    let userId: string | null = null;
    const { data } = createClient().auth.onAuthStateChange((event, session) => {
      const next = session?.user.id ?? null;
      if (event === "SIGNED_OUT" || (userId != null && next !== userId)) resetClientStores();
      else if (event === "SIGNED_IN") refreshClientStores();
      userId = next;
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshClientStores();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return null;
}
