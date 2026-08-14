import Link from "next/link";
import AlertsBell from "@/components/alerts/AlertsBell";
import SignInLink from "@/components/auth/SignInLink";
import Breadcrumb from "@/components/layout/Breadcrumb";
import MobileNav from "@/components/layout/MobileNav";
import TopSearch from "@/components/layout/TopSearch";
import UserMenu from "@/components/layout/UserMenu";
import type { Account } from "@/lib/account";

export default function Topbar({ account }: { account: Account | null }) {
  return (
    <div className="topbar">
      <MobileNav />
      <Breadcrumb />
      <TopSearch />
      {account && <AlertsBell />}
      {account ? (
        <UserMenu account={account} />
      ) : (
        <div className="topbar-auth">
          <SignInLink className="btn ghost">Entrar</SignInLink>
          <Link className="btn solid" href="/register">
            Criar conta
          </Link>
        </div>
      )}
    </div>
  );
}
