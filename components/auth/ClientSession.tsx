"use client";

import { createContext, useContext, useEffect, useState } from "react";
import PlanProvider from "@/components/plan/PlanProvider";
import { accountFrom, type Account } from "@/lib/account";
import { entitlementsFromRow, USER_COLS } from "@/lib/entitlements/fromRow";
import { entitlementsFor, type Role, type Trial } from "@/lib/entitlements";
import { createClient } from "@/lib/supabase/client";

type SessionState = {
  account: Account | null;
  role: Role;
  isAdmin: boolean;
  trial: Trial;
  /** "we do not know yet", which the anon defaults alone cannot express. */
  loading: boolean;
};

const SIGNED_OUT: SessionState = {
  account: null,
  role: "anon",
  isAdmin: false,
  trial: entitlementsFor("anon", false).trial,
  loading: false,
};

const SessionContext = createContext<SessionState>({ ...SIGNED_OUT, loading: true });

export const useClientSession = () => useContext(SessionContext);

/** Auth chrome for the cached routes, whose HTML is shared by every visitor and so cannot be
 *  personalised on the server. Reads Supabase directly rather than through a function invocation,
 *  which is the point of caching them. Crawlers never run it and index the anonymous shell. */
export default function ClientSession({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ ...SIGNED_OUT, loading: true });

  useEffect(() => {
    const supabase = createClient();
    let alive = true;

    async function resolve() {
      // getSession reads the stored token instead of round-tripping to /auth/v1/user. It only
      // picks the chrome; the users read below is RLS-scoped either way.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!alive) return;
      if (!session?.user) return setState(SIGNED_OUT);

      const { data, error } = await supabase.from("users").select(USER_COLS).maybeSingle();
      if (!alive) return;
      if (error) console.error(`[entitlements] role load failed: ${error.message}`);

      const ent = entitlementsFromRow(data);
      setState({
        account: accountFrom(session.user),
        role: ent.role,
        isAdmin: ent.isAdmin,
        trial: ent.trial,
        loading: false,
      });
    }

    resolve();

    const { data } = supabase.auth.onAuthStateChange((event) => {
      // Awaiting a supabase call inside this callback deadlocks against the auth lock it holds.
      if (event !== "INITIAL_SESSION") setTimeout(resolve, 0);
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={state}>
      <PlanProvider
        role={state.role}
        isAdmin={state.isAdmin}
        trial={state.trial}
        loading={state.loading}
      >
        {children}
      </PlanProvider>
    </SessionContext.Provider>
  );
}
