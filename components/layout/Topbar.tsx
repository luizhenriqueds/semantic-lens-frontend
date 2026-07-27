import AlertsBell from "@/components/alerts/AlertsBell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import MobileNav from "@/components/layout/MobileNav";
import ThemeToggle from "@/components/layout/ThemeToggle";
import TopSearch from "@/components/layout/TopSearch";
import UserMenu from "@/components/layout/UserMenu";
import type { Account } from "@/lib/account";

export default function Topbar({ account }: { account: Account }) {
  return (
    <div className="topbar">
      <MobileNav />
      <Breadcrumb />
      <TopSearch />
      <ThemeToggle />
      <AlertsBell />
      <UserMenu account={account} />
    </div>
  );
}
