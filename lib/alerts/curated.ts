import type { CuratedSlug } from "@/lib/types";

export type CuratedAlert = {
  slug: CuratedSlug;
  title: string;
  why: string;
  href: string;
  /** Resolved from the user's carteira, so it sends nothing while the carteira is empty. */
  perUser?: boolean;
};

// Copy mirrors `pipeline/alerts/curated/types.py:CATALOGUE` in the batch repo, by hand.
const CATALOGUE = [
  {
    slug: "closing",
    title: "Seus favoritos terminam em breve",
    why: "imóveis que você salvou e cujo prazo está estourando",
    href: "/portfolio",
    perUser: true,
  },
  {
    slug: "highlights",
    title: "Destaques da rodada",
    why: "nota alta de investimento e fachada bem avaliada",
    href: "/properties?min_investment=74&min_visual_score=75&sort=investment",
  },
  {
    slug: "discount",
    title: "Deságios que chamam atenção",
    why: "58% ou mais abaixo da avaliação oficial",
    href: "/properties?min_discount=58&min_investment=60&sort=investment",
  },
  {
    slug: "modality-change",
    title: "Mudaram de modalidade",
    why: "mudaram de modalidade nos últimos 30 dias — a maioria com redução de preço",
    href: "/properties?change_kind=modality&changed_within_days=30&min_investment=60&sort=investment",
  },
  {
    slug: "group",
    title: "Coleções em alta",
    why: "grupos de imóveis semelhantes, ordenados pela melhor nota média da rodada",
    href: "/groups",
  },
  {
    slug: "region",
    title: "A região em destaque",
    why: "o bairro com a melhor nota média de investimento nesta rodada",
    href: "/regions",
  },
  {
    slug: "goal",
    title: "Para o seu objetivo",
    why: "alinhados ao perfil que você mais salva na carteira",
    href: "/properties",
    perUser: true,
  },
  {
    slug: "saved",
    title: "Parecidos com a sua carteira",
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
