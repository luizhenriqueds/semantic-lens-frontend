import {
  IconBell,
  IconBuilding,
  IconGroups,
  IconHome,
  IconPin,
  IconSearch,
  IconStar,
} from "@/lib/icons";

export const NAV = [
  { href: "/dashboard", label: "Início", Icon: IconHome },
  { href: "/search", label: "Buscar imóveis", Icon: IconSearch },
  { href: "/properties", label: "Imóveis", Icon: IconBuilding },
  { href: "/groups", label: "Grupos", Icon: IconGroups },
  { href: "/regions", label: "Regiões", Icon: IconPin },
  { href: "/alerts", label: "Alertas", Icon: IconBell },
  { href: "/portfolio", label: "Minha carteira", Icon: IconStar },
];
