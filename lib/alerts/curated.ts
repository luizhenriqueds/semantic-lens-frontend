import type { Role } from "@/lib/entitlements";
import type { CuratedSlug } from "@/lib/types";

export type CuratedAlert = {
  slug: CuratedSlug;
  title: string;
  why: string;
  href: string;
  /** Resolved from the user's carteira, so it sends nothing while the carteira is empty. */
  perUser?: boolean;
  /** Digests built on a paid surface are reserved for the plan that includes it. */
  minRole: Role;
};

// Copy and minRole mirror `pipeline/alerts/curated/types.py:CATALOGUE` in the batch repo, by hand.
const CATALOGUE = [
  {
    slug: "closing",
    minRole: "investor",
    title: "Seus imóveis favoritos que encerram em breve",
    why: "imóveis que você salvou e cujo prazo está estourando",
    href: "/portfolio",
    perUser: true,
  },
  {
    slug: "highlights",
    minRole: "investor",
    title: "Destaques da rodada",
    why: "nota alta de investimento e fachada bem avaliada",
    href: "/properties?min_investment=74&min_visual_score=75&sort=investment",
  },
  {
    slug: "discount",
    minRole: "professional",
    title: "Deságios que chamam atenção",
    why: "58% ou mais abaixo da avaliação oficial",
    href: "/properties?min_discount=58&min_investment=60&sort=investment",
  },
  {
    slug: "modality-change",
    minRole: "professional",
    title: "Imóveis que mudaram de modalidade ofertada",
    why: "mudaram de modalidade nos últimos 30 dias - a maioria com redução de preço",
    href: "/properties?change_kinds=modality&changed_within_days=30&min_investment=60&sort=investment",
  },
  {
    slug: "price-drop",
    minRole: "professional",
    title: "Imóveis que tiveram redução de preço",
    why: "imóveis que você salvou e cujo valor de venda caiu nos últimos 30 dias",
    href: "/portfolio",
    perUser: true,
  },
  {
    slug: "group",
    minRole: "professional",
    title: "Coleções em alta",
    why: "coleções de imóveis semelhantes, ordenadas pela melhor nota média da rodada",
    href: "/groups",
  },
  {
    slug: "region",
    minRole: "professional",
    title: "A região em destaque",
    why: "o bairro com a melhor nota média de investimento nesta rodada",
    href: "/regions",
  },
  {
    slug: "goal",
    minRole: "investor",
    title: "Para o seu objetivo",
    why: "alinhados ao perfil que você mais salva na carteira",
    href: "/properties",
    perUser: true,
  },
  {
    slug: "saved",
    minRole: "investor",
    title: "Imóveis recomendados para o seu perfil de investimento",
    why: "semelhantes aos imóveis que você salvou",
    href: "/portfolio",
    perUser: true,
  },
] as const satisfies readonly CuratedAlert[];

// Fails to compile when the batch catalogue gains a slug and this list is not updated.
type Unlisted = Exclude<CuratedSlug, (typeof CATALOGUE)[number]["slug"]>;
const _allSlugsListed: Unlisted extends never ? true : never = true;
void _allSlugsListed;

export const CURATED_ALERTS: readonly CuratedAlert[] = CATALOGUE;
