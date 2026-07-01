"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/components/layout/navItems";
import { IconClose, IconMenu } from "@/lib/icons";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button className="hamburger" aria-label="Abrir menu" onClick={() => setOpen(true)}>
        <IconMenu width={22} height={22} strokeWidth={1.9} />
      </button>

      <div
        className={`drawer-backdrop${open ? " open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside className={`drawer${open ? " open" : ""}`} aria-hidden={!open}>
        <div className="drawer-head">
          <Link href="/" className="brand" onClick={() => setOpen(false)}>
            <div className="mark">M</div>
            <div>
              <b>Matrícula</b>
              <small>Leilões inteligentes</small>
            </div>
          </Link>
          <button className="iconbtn" aria-label="Fechar menu" onClick={() => setOpen(false)}>
            <IconClose width={20} height={20} strokeWidth={1.9} />
          </button>
        </div>
        <nav>
          {NAV.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className={`navbtn${isActive(href) ? " active" : ""}`}>
              <Icon />
              <span className="txt">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="acct">
          <div className="av">LQ</div>
          <div>
            <div className="nm">Luiz Quevedo</div>
            <div className="pl">Plano investidor</div>
          </div>
        </div>
      </aside>
    </>
  );
}
