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
    blurb: "Sugestões de imóveis semelhantes ao que você está vendo.",
  },
  advancedFilters: {
    label: "Filtros avançados",
    blurb: "Filtre por desconto, notas de investimento, avaliação da fachada e lugares próximos.",
  },
  analysisView: {
    label: "Análise de imóveis",
    blurb: "Distribuições de preço, desconto, área e Nota de Investimento atual.",
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
  nearbyPois: {
    label: "Lugares próximos",
    blurb:
      "Escolas, mercados, transporte e serviços num raio de 5 km, do mais próximo ao mais distante.",
  },
  export: {
    label: "Exportação CSV/PDF",
    blurb: "Exporte buscas, filtros e análises em CSV ou PDF.",
  },
};

/** Checkout/trial-dialog highlights per sellable Role. Full comparison is PLAN_CARDS on the marketing page. */
export const PLAN_PITCH: Partial<Record<Role, readonly { lead: string; text: string }[]>> = {
  investor: [
    { lead: "Favoritos e alertas ilimitados", text: "sem limite de carteira nem de buscas salvas" },
    { lead: "Filtros avançados", text: "desconto, notas, financiamento, FGTS e lugares próximos" },
    {
      lead: "Análise de imóveis",
      text: "distribuição de preço, desconto, área e Nota de Investimento",
    },
    {
      lead: "Recomendações",
      text: "sugestões de imóveis semelhantes ao que você está vendo",
    },
  ],
  professional: [
    { lead: "Alertas em primeira mão", text: "seus alertas saem antes dos demais planos" },
    { lead: "Painel de mercado", text: "preço por m², tendências e comparáveis por cidade" },
    {
      lead: "Calendário de leilões",
      text: "a agenda completa dos leilões, atualizada diariamente",
    },
    { lead: "Relatórios e exportação", text: "buscas, filtros e análises em CSV ou PDF" },
  ],
};

// Not Feature flags: these are free on every property page, so they cannot be derived from the
// plan matrix. Keyed by Role so another tier can gain a block later.
export const PLAN_INCLUDES: Partial<Record<Role, { heading: string; items: readonly string[] }>> = {
  basic: {
    heading: "Em cada imóvel você vê:",
    items: [
      "Histórico de preços",
      "Análise de fachada usando IA, incluindo estado aparente de conservação e idade estimada do imóvel",
      "Avisos quando o imóvel muda de modalidade/oferta no leilão",
      "Perfil da região e distância do centro",
      "Nota de Investimento",
      "Tese de investimento recomendada",
      // Deliberately not "análises comparativas de porte e preço": that reads as the
      // marketCompare block, which is paid. This is PropertyRanks, which is free.
      "Tamanho e preço comparados à base",
    ],
  },
};

/** What a plan adds over Básico. Derived rather than listed, so a feature that moves between
 *  plans can never leave the celebration dialogs stale. */
export const unlockedFeatures = (role: Role): Feature[] =>
  (Object.keys(PLANS[role].features) as Feature[]).filter(
    (f) => PLANS[role].features[f] && !PLANS.basic.features[f],
  );

export const canTrial = (plan: { role: Role }, trial: Trial): boolean =>
  plan.role === TRIAL_ROLE && trial.eligible;

/** One string, so the three checkout surfaces cannot drift apart. */
export const PAYMENT_NOTE = "Pagamento seguro via AbacatePay. Cancele quando quiser.";

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
