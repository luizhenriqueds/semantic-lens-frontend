"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/brand/BrandLogo";
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
          <BrandLogo size={30} />
        </div>
        <div>
          <b>
            Leilão <span>Index</span>
          </b>
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
