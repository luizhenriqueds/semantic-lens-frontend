import {
  IconBell,
  IconBuilding,
  IconChart,
  IconGroups,
  IconHome,
  IconPin,
  IconSearch,
  IconStar,
} from "@/lib/icons";

import { PATH_FEATURE } from "@/lib/entitlements";
import type { Feature } from "@/lib/entitlements";

// The gate comes from PATH_FEATURE, so the sidebar and every outbound link agree.
export const NAV: { href: string; label: string; Icon: typeof IconHome; feature?: Feature }[] = [
  { href: "/dashboard", label: "Início", Icon: IconHome },
  { href: "/search", label: "Buscar", Icon: IconSearch },
  { href: "/properties", label: "Imóveis", Icon: IconBuilding },
  { href: "/market", label: "Mercado", Icon: IconChart },
  { href: "/groups", label: "Coleções", Icon: IconGroups },
  { href: "/regions", label: "Regiões", Icon: IconPin },
  { href: "/alerts", label: "Alertas", Icon: IconBell },
  { href: "/portfolio", label: "Carteira", Icon: IconStar },
].map((item) => ({ ...item, feature: PATH_FEATURE[item.href] }));

// Detail routes that sit outside their section's path and would otherwise light up nothing.
const ALIASES: Record<string, string[]> = {
  "/properties": ["/property", "/leilao-de-imoveis"],
};

// Segment-wise, like middleware's isPublic, so a later /search-admin does not match /search.
const under = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

export const isNavActive = (path: string, href: string): boolean =>
  href === "/dashboard"
    ? path === "/dashboard"
    : under(path, href) || (ALIASES[href] ?? []).some((a) => under(path, a));
