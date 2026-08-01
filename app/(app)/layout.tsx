import type { Metadata } from "next";
import { Suspense } from "react";
import SessionStores from "@/components/layout/SessionStores";
import ThemeInit from "@/components/layout/ThemeInit";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import PlanProvider from "@/components/plan/PlanProvider";
import TrialStartedDialog from "@/components/plan/TrialStartedDialog";
import ToastProvider from "@/components/ui/Toaster";
import { accountFrom } from "@/lib/account";
import { getEntitlements } from "@/lib/entitlements/server";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Lavra - Painel de leilões",
  description:
    "Compare milhares de imóveis de leilão e encontre a melhor oportunidade para o seu objetivo.",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [{ user }, ent] = await Promise.all([getUser(), getEntitlements()]);
  const account = accountFrom(user);

  return (
    <ToastProvider>
      <PlanProvider role={ent.role} isAdmin={ent.isAdmin} trial={ent.trial}>
        <SessionStores />
        <ThemeInit />
        {/* Reads the ?trial flag, so it needs a boundary of its own rather than opting every
            page under this layout out of static rendering. */}
        <Suspense fallback={null}>
          <TrialStartedDialog />
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
