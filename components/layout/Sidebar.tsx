"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/components/layout/navItems";

export default function Sidebar() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <div className="mark">M</div>
        <div>
          <b>Matrícula</b>
          <small>Leilões inteligentes</small>
        </div>
      </Link>

      <div className="navlabel">Menu</div>
      {NAV.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className={`navbtn${isActive(href) ? " active" : ""}`}>
          <Icon />
          <span className="txt">{label}</span>
        </Link>
      ))}

      <div className="spacer" />

      <div className="acct">
        <div className="av">LQ</div>
        <div>
          <div className="nm">Luiz Quevedo</div>
          <div className="pl">Plano investidor</div>
        </div>
      </div>
    </aside>
  );
}
