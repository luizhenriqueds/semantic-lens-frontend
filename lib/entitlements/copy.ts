import { PLANS, requiredPlan, TRIAL_DAYS, TRIAL_ROLE } from "./plans";
import type { Feature, Role, Trial } from "./plans";

// No "use client" here on purpose: the server walls and the client dialog share this copy, and a
// directive would turn these into client references that throw when called during SSR.
export const FEATURE_COPY: Record<Feature, { label: string; blurb: string; quotaNoun?: string }> = {
  favorites: {
    label: "Carteira de favoritos",
    blurb: "Salve imóveis na sua carteira e acompanhe cada leilão de perto.",
    quotaNoun: "os favoritos da sua carteira",
  },
  savedSearches: {
    label: "Alertas salvos",
    blurb: "Receba por e-mail os imóveis novos que combinam com a sua busca.",
    quotaNoun: "os alertas salvos",
  },
  curatedAlerts: {
    label: "Alertas automáticos semanais",
    blurb: "Resumos automáticos com as melhores oportunidades de cada rodada.",
  },
  groups: {
    label: "Coleções de imóveis parecidos",
    blurb: "Imóveis parecidos entre si, reunidos automaticamente para comparar de uma vez só.",
  },
  recommendations: {
    label: "Recomendações de imóveis",
    blurb: "Sugestões de imóveis semelhantes aos que você já salvou.",
  },
  advancedFilters: {
    label: "Filtros avançados",
    blurb: "Filtre por deságio, notas de investimento, avaliação da fachada e lugares próximos.",
  },
  analysisView: {
    label: "Análise de imóveis",
    blurb: "Distribuições de preço, deságio, área e nota do resultado atual.",
  },
  marketCompare: {
    label: "Comparativo de mercado",
    blurb: "Compare o lance com anúncios reais do bairro e veja o potencial de ganho.",
  },
  calendarView: {
    label: "Calendário de leilões",
    blurb: "A agenda dos leilões, dia a dia.",
  },
  market: {
    label: "Painel de mercado",
    blurb: "Preço por m², tendências e comparáveis de cada cidade.",
  },
  regions: {
    label: "Regiões",
    blurb: "Perfil e DNA de cada bairro, preços de mercado e regiões semelhantes.",
  },
  export: {
    label: "Exportação CSV/PDF",
    blurb: "Exporte buscas, filtros e análises em CSV ou PDF.",
  },
};

// Not Feature flags: these are free on every property page, so they cannot be derived from the
// plan matrix. Keyed by Role so another tier can gain a block later.
export const PLAN_INCLUDES: Partial<Record<Role, { heading: string; items: readonly string[] }>> = {
  basic: {
    heading: "Em cada imóvel você vê:",
    items: [
      "Histórico de preços",
      "Análise de fachada usando IA",
      "Mudança de modalidade",
      "Lugares próximos e distância do centro",
      "Perfil da região",
      "Score de investimento",
      "Tese de investimento recomendada",
      // Deliberately not "análises comparativas de porte e preço": that reads as the
      // marketCompare block, which is paid. This is PropertyRanks, which is free.
      "Porte e preço comparados à base",
    ],
  },
};

export const canTrial = (plan: { role: Role }, trial: Trial): boolean =>
  plan.role === TRIAL_ROLE && trial.eligible;

export function upsellTitle(
  feature: Feature,
  role: Role,
  trial: Trial,
  propertyLabel?: string,
): string {
  const plan = requiredPlan(feature);
  if (role === "anon") {
    if (feature === "favorites" && propertyLabel)
      return `Salve ${propertyLabel} antes que o leilão termine`;
    return "Crie sua conta grátis";
  }
  if (trial.expired) return "Seu teste grátis terminou";
  if (canTrial(plan, trial)) return `Teste o plano ${plan.label} por ${TRIAL_DAYS} dias`;
  return `Disponível no plano ${plan.label}`;
}

export function upsellBody(feature: Feature, role: Role, trial: Trial): string {
  const plan = requiredPlan(feature);
  const { blurb } = FEATURE_COPY[feature];
  if (role === "anon") return blurb;
  if (trial.expired) return `${blurb} Assine o plano ${plan.label} para voltar a usar.`;
  if (canTrial(plan, trial)) return `${blurb} Sem cartão - é só ativar.`;
  return blurb;
}

/** Copy for a quota that ran out, where the blocker is the limit rather than the gate. */
export const quotaUpsell = (feature: Feature, role: Role) => ({
  title: `Você atingiu o limite do plano ${PLANS[role].label}`,
  body: `O plano ${PLANS[TRIAL_ROLE].label} libera ${FEATURE_COPY[feature].quotaNoun ?? "mais"} sem limite.`,
});
