import AlertsBell from "@/components/alerts/AlertsBell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import MobileNav from "@/components/layout/MobileNav";
import ThemeToggle from "@/components/layout/ThemeToggle";
import UserMenu from "@/components/layout/UserMenu";
import type { Account } from "@/lib/account";
import { IconSearch } from "@/lib/icons";

export default function Topbar({ account }: { account: Account }) {
  return (
    <div className="topbar">
      <MobileNav />
      <Breadcrumb />
      <form className="topsearch" action="/search" method="get">
        <IconSearch width={18} height={18} strokeWidth={1.7} />
        <input
          name="q"
          placeholder="Buscar imóveis — descreva o que procura"
          aria-label="Buscar imóveis"
          autoComplete="off"
        />
      </form>
      <ThemeToggle />
      <AlertsBell />
      <UserMenu account={account} />
    </div>
  );
}
