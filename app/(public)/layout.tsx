import { Suspense } from "react";
import ClientSession from "@/components/auth/ClientSession";
import SessionStores from "@/components/layout/SessionStores";
import ThemeInit from "@/components/layout/ThemeInit";
import ClientTopbar from "@/components/layout/ClientTopbar";
import OutageBanner from "@/components/layout/OutageBanner";
import Sidebar from "@/components/layout/Sidebar";
import CheckoutReturnDialog from "@/components/plan/CheckoutReturnDialog";
import TrialStartedDialog from "@/components/plan/TrialStartedDialog";
import ToastProvider from "@/components/ui/Toaster";

// The indexable routes. Nothing here may read cookies(): without PPR a single cookie read makes the
// whole route dynamic, and these are the ones that have to stay cacheable. ClientSession resolves
// the auth chrome in the browser instead. Every page states its own robots rule.

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ClientSession>
        <SessionStores />
        <ThemeInit />
        {/* Read the ?trial and ?checkout flags, so they need a boundary of their own. */}
        <Suspense fallback={null}>
          <TrialStartedDialog />
          <CheckoutReturnDialog />
        </Suspense>
        <OutageBanner />
        <div className="app">
          <Sidebar />
          <div className="main">
            <ClientTopbar />
            <div className="content">{children}</div>
          </div>
        </div>
      </ClientSession>
    </ToastProvider>
  );
}
