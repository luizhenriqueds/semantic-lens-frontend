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
    </div>
  );
}
