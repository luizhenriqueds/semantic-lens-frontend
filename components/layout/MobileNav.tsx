"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import NavLink from "@/components/layout/NavLink";
import { NAV } from "@/components/layout/navItems";
import { IconClose, IconMenu } from "@/lib/icons";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? path === "/dashboard" : path.startsWith(href);

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
      {/* Closed only slides off-screen, so `inert` is what keeps its links out of the tab order. */}
      <aside className={`drawer${open ? " open" : ""}`} inert={!open}>
        <div className="drawer-head">
          <Link href="/dashboard" className="brand" onClick={() => setOpen(false)}>
            <div className="mark">
              <BrandLogo size={30} />
            </div>
            <div>
              <b>
                Leilão <span>Index</span>
              </b>
            </div>
          </Link>
          <button className="iconbtn" aria-label="Fechar menu" onClick={() => setOpen(false)}>
            <IconClose width={20} height={20} strokeWidth={1.9} />
          </button>
        </div>
        <nav>
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
