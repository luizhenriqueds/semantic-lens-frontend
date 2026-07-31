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

import type { Feature } from "@/lib/entitlements";

// No `feature` means the entry is open to everyone, anon included.
export const NAV: { href: string; label: string; Icon: typeof IconHome; feature?: Feature }[] = [
  { href: "/dashboard", label: "Início", Icon: IconHome },
  { href: "/search", label: "Explorar imóveis", Icon: IconSearch },
  { href: "/properties", label: "Imóveis", Icon: IconBuilding },
  { href: "/market", label: "Mercado", Icon: IconChart, feature: "market" },
  { href: "/groups", label: "Grupos", Icon: IconGroups, feature: "groups" },
  { href: "/regions", label: "Regiões", Icon: IconPin, feature: "regions" },
  { href: "/alerts", label: "Alertas", Icon: IconBell },
  { href: "/portfolio", label: "Minha carteira", Icon: IconStar },
];
