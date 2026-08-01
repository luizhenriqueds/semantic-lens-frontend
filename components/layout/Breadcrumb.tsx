"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

type Crumb = { label: string; href?: string };

const SECTION: Record<string, string> = {
  search: "Explorar imóveis",
  properties: "Imóveis",
  market: "Painel de mercado",
  groups: "Coleções",
  regions: "Regiões",
  alerts: "Meus alertas",
  portfolio: "Minha carteira",
  settings: "Configurações",
};

function trail(path: string): Crumb[] {
  const home: Crumb = { label: "Início", href: "/dashboard" };
  if (path === "/dashboard") return [{ label: "Início" }];

  const [, first] = path.split("/");
  if (first === "property") {
    return [home, { label: "Imóveis", href: "/properties" }, { label: "Detalhes do imóvel" }];
  }
  if (first === "regions" && path.split("/").length > 2) {
    return [home, { label: "Regiões", href: "/regions" }, { label: "Detalhes da região" }];
  }
  return [home, { label: SECTION[first] ?? "Início" }];
}

export default function Breadcrumb() {
  const path = usePathname();
  const crumbs = trail(path);

  return (
    <nav className="breadcrumb" aria-label="Trilha de navegação">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <Fragment key={i}>
            {i > 0 && (
              <span className="bc-sep" aria-hidden>
                ›
              </span>
            )}
            {c.href && !last ? (
              <Link href={c.href}>{c.label}</Link>
            ) : (
              <span className="bc-current" aria-current="page">
                {c.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
