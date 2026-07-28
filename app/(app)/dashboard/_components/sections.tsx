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
  RAIL_SIZE,
  VACANT,
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
// holds up the document. Every pool filter is a user-independent constant, so the reads
// underneath are shared across all visitors by unstable_cache.

type SlotProps = { seed: number; now: Date };

async function fetchPool(pool: Pool): Promise<Property[]> {
  const { items } = await getPropertiesPage({
    filters: pool.filters,
    sort: pool.sort,
    pageSize: pool.pageSize,
  });
  return items;
}

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
  const pool = await getUpcomingAuctions(now);
  const items = seededPick(pool, RAIL_SIZE, "closing", seed).sort(
    (a, b) => new Date(a.auctionDate!).getTime() - new Date(b.auctionDate!).getTime(),
  );
  return (
    <RailSection
      title="Termina em breve"
      why="leilões e vendas online com prazo estourando — do mais urgente ao menos"
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
  const items = seededPick(await fetchPool(DISCOUNT), RAIL_SIZE, "discount", seed);
  return (
    <RailSection
      title="Deságios que chamam atenção"
      why="58% ou mais abaixo da avaliação oficial, com nota mínima de 60"
      moreHref={DISCOUNT.href}
      moreLabel="Ver todos os deságios"
      items={items}
      ctx={{ rail: "discount", now }}
    />
  );
}

export async function BudgetRailSlot({ seed, now }: SlotProps) {
  const items = seededPick(await fetchPool(BUDGET), RAIL_SIZE, "budget", seed);
  return (
    <RailSection
      title="Cabe em até R$ 90 mil"
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
  const items = seededPick(pool, RAIL_SIZE, "vacant", seed);
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
  const items = seededPick(await fetchPool(FINANCING), RAIL_SIZE, "financing", seed);
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

export async function GoalRailSlot({ goal, seed, now }: SlotProps & { goal: ProfileKey }) {
  const pool = goalPool(goal);
  const items = seededPick(await fetchPool(pool), RAIL_SIZE, `goal-${goal}`, seed);
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

  // Not every property has recommendations computed; same city + same type is the
  // documented fallback.
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
  const items = seededPick([...byId.values()], RAIL_SIZE, "saved", seed);

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

export async function CollectionsSlot({ seed }: { seed: number }) {
  const [clusters, stats] = await Promise.all([getClusters(), getClusterStatsAll()]);
  const picked = seededShuffle(clusters, railSeed(seed, "collections")).slice(0, 3);
  if (picked.length < 3) return null;
  return (
    <section className="railsec">
      <SectionHead
        title="Coleções parecidas"
        why="grupos de imóveis semelhantes, reunidos por perfil"
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
