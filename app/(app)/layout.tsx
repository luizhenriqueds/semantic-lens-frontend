import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import ToastProvider from "@/components/ui/Toaster";
import { accountFrom } from "@/lib/account";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Lavra — Painel de leilões",
  description:
    "Compare milhares de imóveis de leilão e encontre a melhor oportunidade para o seu objetivo.",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getUser();
  const account = accountFrom(user);

  return (
    <ToastProvider>
      <div className="app">
        <Sidebar />
        <div className="main">
          <Topbar account={account} />
          <div className="content">{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}
