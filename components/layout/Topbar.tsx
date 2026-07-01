import AlertsBell from "@/components/alerts/AlertsBell";
import Breadcrumb from "@/components/layout/Breadcrumb";
import MobileNav from "@/components/layout/MobileNav";
import { IconSearch } from "@/lib/icons";
import ThemeToggle from "@/components/layout/ThemeToggle";

export default function Topbar() {
  return (
    <div className="topbar">
      <MobileNav />
      <Breadcrumb />
      <div className="topsearch is-soon" aria-disabled>
        <IconSearch width={18} height={18} strokeWidth={1.7} />
        <input disabled aria-disabled placeholder="Busca inteligente — em breve" />
        <span className="soon soon-sm">Em breve</span>
      </div>
      <ThemeToggle />
      <AlertsBell />
    </div>
  );
}
