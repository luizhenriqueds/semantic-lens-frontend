"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LavraLogo from "@/components/brand/LavraLogo";
import NavLink from "@/components/layout/NavLink";
import { NAV } from "@/components/layout/navItems";

export default function Sidebar() {
  const path = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? path === "/dashboard" : path.startsWith(href);

  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="brand">
        <div className="mark">
          <LavraLogo size={26} />
        </div>
        <div>
          <b>Lavra</b>
          <small>Leilões inteligentes</small>
        </div>
      </Link>

      <div className="navlabel">Menu</div>
      {/* title + aria-label carry the name when the tablet rail hides .txt */}
      {NAV.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(item.href)} />
      ))}

      <div className="spacer" />
    </aside>
  );
}
