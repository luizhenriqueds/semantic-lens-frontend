import CollectionCard from "@/components/groups/CollectionCard";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import RailSection from "@/components/discovery/RailSection";
import SectionHead from "@/components/discovery/SectionHead";
import {
  clusterStatsFor,
  getClusters,
  getClusterStatsAll,
  getMarketDashboard,
  getPropertiesByIds,
  getPropertiesPage,
  getRecommendations,
  getUpcomingAuctions,
  isListable,
} from "@/lib/data";
import {
  BUDGET,
  CLOSING_HREF,
  DISCOUNT,
  FINANCING,
  MODALITY_CHANGE,
  PAYMENT_CHANGE,
  RAIL_SIZE,
  VACANT,
  byInvestment,
  goalPool,
  isVacant,
  railSeed,
  seededPick,
  seededShuffle,
  type Pool,
} from "@/lib/discovery";
import type { ProfileKey, Property } from "@/lib/types";
import CityGrid from "./CityGrid";
import InsightStrip from "./InsightStrip";

// Each section owns its query and streams in independently, so the slowest rail never
// holds up the document.

type SlotProps = { seed: number; now: Date };

async function fetchPool(pool: Pool): Promise<Property[]> {
  const { items } = await getPropertiesPage({
    filters: pool.filters,
    sort: pool.sort,
    pageSize: pool.pageSize,
  });
  return items;
}

const railItems = (pool: readonly Property[], rail: string, seed: number): Property[] =>
  byInvestment(seededPick(pool, RAIL_SIZE, rail, seed));

export async function MarketSlot() {
  const d = await getMarketDashboard();
  return d ? <InsightStrip d={d} /> : null;
}

export async function CitiesSlot({ seed }: { seed: number }) {
  const d = await getMarketDashboard();
  if (!d) return null;
  return <CityGrid cities={seededShuffle(d.cities, railSeed(seed, "cities")).slice(0, 8)} />;
}

export async function ClosingRailSlot({ seed, now }: SlotProps) {
  const items = railItems(await getUpcomingAuctions(now), "closing", seed);
  return (
    <RailSection
      title="Termina em breve"
      why="leilões e vendas online com prazo estourando — ordenados por nota"
      pill="urgente"
      pillTone="warn"
      moreHref={CLOSING_HREF}
      moreLabel="Ver agenda"
      items={items}
      ctx={{ rail: "closing", now }}
    />
  );
}

export async function DiscountRailSlot({ seed, now }: SlotProps) {
  const items = railItems(await fetchPool(DISCOUNT), "discount", seed);
  return (
    <RailSection
      title="Deságios que chamam atenção"
      why="58% ou mais abaixo da avaliação oficial — ordenados por nota"
      moreHref={DISCOUNT.href}
      moreLabel="Ver todos os deságios"
      items={items}
      ctx={{ rail: "discount", now }}
    />
  );
}

export async function BudgetRailSlot({ seed, now }: SlotProps) {
  const items = railItems(await fetchPool(BUDGET), "budget", seed);
  return (
    <RailSection
      title="Imóveis de até R$ 100 mil"
      why="porta de entrada — nota alta com o menor cheque possível"
      moreHref={BUDGET.href}
      moreLabel="Ver por faixa de preço"
      items={items}
      ctx={{ rail: "budget", now }}
    />
  );
}

export async function VacantRailSlot({ seed, now }: SlotProps) {
  const pool = (await fetchPool(VACANT)).filter((p) => isVacant(p.occupancyStatus));
  const items = railItems(pool, "vacant", seed);
  return (
    <RailSection
      title="Sem dor de cabeça: desocupados"
      why="entrega imediata, sem custo nem prazo de desocupação"
      pill="raro"
      items={items}
      ctx={{ rail: "vacant", now }}
    />
  );
}

export async function FinancingRailSlot({ seed, now }: SlotProps) {
  const items = railItems(await fetchPool(FINANCING), "financing", seed);
  return (
    <RailSection
      title="Aceitam financiamento bancário"
      why="uma fatia pequena da base aceita — dá para entrar sem o caixa todo"
      pill="raro"
      moreHref={FINANCING.href}
      moreLabel="Ver com financiamento"
      items={items}
      ctx={{ rail: "financing", now }}
    />
  );
}

export async function ModalityChangeRailSlot({ seed, now }: SlotProps) {
  const items = railItems(await fetchPool(MODALITY_CHANGE), "modality-change", seed);
  return (
    <RailSection
      title="Mudaram de modalidade"
      why="avançaram de fase ou foram para venda direta nos últimos 30 dias — a maioria com corte de preço"
      pill="novo"
      moreHref={MODALITY_CHANGE.href}
      moreLabel="Ver todos"
      items={items}
      ctx={{ rail: "modality-change", now }}
    />
  );
}

export async function PaymentChangeRailSlot({ seed, now }: SlotProps) {
  // The log records the start, not a later stop: ~4% dropped it again inside the window.
  const pool = (await fetchPool(PAYMENT_CHANGE)).filter((p) => p.acceptsFinancing || p.acceptsFgts);
  const items = railItems(pool, "payment-change", seed);
  return (
    <RailSection
      title="Passaram a aceitar financiamento ou FGTS"
      why="não aceitavam há 30 dias e passaram a aceitar — dá para entrar sem o caixa todo"
      pill="novo"
      moreHref={PAYMENT_CHANGE.href}
      moreLabel="Ver todos"
      items={items}
      ctx={{ rail: "payment-change", now }}
    />
  );
}

export async function GoalRailSlot({ goal, seed, now }: SlotProps & { goal: ProfileKey }) {
  const items = railItems(await fetchPool(goalPool(goal)), `goal-${goal}`, seed);
  return (
    <RailSection
      hideHead
      title="Para o seu objetivo"
      items={items}
      ctx={{ rail: "goal", goal, now }}
    />
  );
}

export async function SavedRailSlot({ ids, seed, now }: SlotProps & { ids: string[] }) {
  if (!ids.length) return null;

  // A saved property can go inactive or lose its photo, and the chip shows its thumbnail.
  const saved = (await getPropertiesByIds(ids)).filter(isListable);
  const withPhoto = saved.filter((p) => p.image);
  const anchor = seededShuffle(withPhoto.length ? withPhoto : saved, railSeed(seed, "anchor"))[0];
  if (!anchor) return null;

  const recs = await getRecommendations(anchor.id);

  const recIds = [...new Set(recs.filter((r) => (r.similarity ?? 0) >= 0.75).map((r) => r.recId))];

  // Not every property has recommendations computed; same city + same type is the fallback.
  let pool = recIds.length ? await getPropertiesByIds(recIds) : [];
  if (pool.length < 6) {
    const { items } = await getPropertiesPage({
      filters: { city: anchor.city, type: anchor.propertyType },
      sort: "score",
      pageSize: 20,
    });
    pool = [...pool, ...items];
  }

  const byId = new Map(pool.filter(isListable).map((p) => [p.id, p]));
  byId.delete(anchor.id);
  const items = railItems([...byId.values()], "saved", seed);

  return (
    <RailSection
      title="Porque você salvou este imóvel"
      why={`mesma cidade e mesmo tipo de ${anchor.propertyType.toLowerCase()} — ordenados por nota`}
      moreHref="/portfolio"
      moreLabel="Ver a carteira"
      aside={
        <span className="anchorchip">
          <span className="th">
            <PropertyPhoto src={anchor.image} alt="" sizes="30px" />
          </span>
          salvo: <b>{anchor.title}</b>
        </span>
      }
      items={items}
      ctx={{ rail: "saved", anchorCity: anchor.city, now }}
    />
  );
}

// Ranked by the group's average investment score - /groups keeps its own ordering.
export async function CollectionsSlot() {
  const [clusters, stats] = await Promise.all([getClusters(), getClusterStatsAll()]);
  const picked = [...clusters]
    .sort(
      (a, b) =>
        (clusterStatsFor(stats, b.clusterId).avgScore ?? -1) -
        (clusterStatsFor(stats, a.clusterId).avgScore ?? -1),
    )
    .slice(0, 3);
  if (picked.length < 3) return null;
  return (
    <section className="railsec">
      <SectionHead
        title="Coleções de imóveis que você pode gostar"
        why="grupos de imóveis semelhantes, reunidos por perfil — ordenados por nota média"
        moreHref="/groups"
        moreLabel="Ver todas"
      />
      <div className="plgrid">
        {picked.map((c) => (
          <CollectionCard key={c.clusterId} c={c} stats={clusterStatsFor(stats, c.clusterId)} />
        ))}
      </div>
    </section>
  );
}
