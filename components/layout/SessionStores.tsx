"use client";

import { useEffect } from "react";
import { resetClientStores } from "@/lib/clientStore";
import { createClient } from "@/lib/supabase/client";

// Driving this off auth state rather than the sign-out handler also covers token expiry
// and sign-out from another tab.
export default function SessionStores() {
  useEffect(() => {
    let userId: string | null = null;
    const { data } = createClient().auth.onAuthStateChange((event, session) => {
      const next = session?.user.id ?? null;
      if (event === "SIGNED_OUT" || (userId != null && next !== userId)) resetClientStores();
      userId = next;
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}
