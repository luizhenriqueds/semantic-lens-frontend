import type { Metadata } from "next";
import { Suspense } from "react";
import SessionStores from "@/components/layout/SessionStores";
import ThemeInit from "@/components/layout/ThemeInit";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import CheckoutReturnDialog from "@/components/plan/CheckoutReturnDialog";
import PlanProvider from "@/components/plan/PlanProvider";
import TrialStartedDialog from "@/components/plan/TrialStartedDialog";
import ToastProvider from "@/components/ui/Toaster";
import { accountFrom } from "@/lib/account";
import { getEntitlements } from "@/lib/entitlements/server";
import { getUser } from "@/lib/supabase/server";

// noindex covers every faceted permutation of /properties, /search and the rest in one stroke, so
// the /leilao-de-imoveis landings are the only indexable representation. follow keeps link equity
// flowing. The indexable pages moved out to (public) rather than re-asserting index:true here.
export const metadata: Metadata = {
  title: { default: "Painel de leilões", template: "%s | Leilão Index" },
  description:
    "Compare milhares de imóveis de leilão e encontre a melhor oportunidade para o seu objetivo.",
  robots: { index: false, follow: true },
};

// These two cookie reads make every route in this group dynamic, which is fine: they are all behind
// a session or faceted anyway. The indexable routes live in (public) so they do not inherit it.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [{ user }, ent] = await Promise.all([getUser(), getEntitlements()]);
  const account = accountFrom(user);

  return (
    <ToastProvider>
      <PlanProvider role={ent.role} isAdmin={ent.isAdmin} trial={ent.trial}>
        <SessionStores />
        <ThemeInit />
        {/* Read the ?trial and ?checkout flags, so they need a boundary of their own rather than
            opting every page under this layout out of static rendering. */}
        <Suspense fallback={null}>
          <TrialStartedDialog />
          <CheckoutReturnDialog />
        </Suspense>
        <div className="app">
          <Sidebar />
          <div className="main">
            <Topbar account={user ? account : null} />
            <div className="content">{children}</div>
          </div>
        </div>
      </PlanProvider>
    </ToastProvider>
  );
}
