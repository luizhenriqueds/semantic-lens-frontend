import { Suspense } from "react";
import { accountFrom, shortName } from "@/lib/account";
import { getPropertiesPage } from "@/lib/data";
import { getFavoriteIds } from "@/lib/data/favorites";
import { stillOpen } from "@/lib/auctionTime";
import {
  HIGHLIGHTS,
  byInvestment,
  daySeed,
  parseGoal,
  pickHero,
  seededPick,
} from "@/lib/discovery";
import { getEntitlements } from "@/lib/entitlements/server";
import { getUser } from "@/lib/supabase/server";
import GoalSection from "./_components/GoalSection";
import HeroPick from "./_components/HeroPick";
import HighlightsGrid from "./_components/HighlightsGrid";
import HomeHead from "./_components/HomeHead";
import {
  BudgetRailSlot,
  CitiesSlot,
  ClosingRailSlot,
  CollectionsSlot,
  DiscountRailSlot,
  FinancingRailSlot,
  GoalRailSlot,
  MarketSlot,
  ModalityChangeRailSlot,
  PaymentChangeRailSlot,
  SavedRailSlot,
  VacantRailSlot,
} from "./_components/sections";
import { GridSkeleton, InsightsSkeleton, RailSkeleton } from "./_components/skeletons";

type SP = Record<string, string | string[] | undefined>;

export default async function HomePage({ searchParams }: { searchParams: Promise<SP> }) {
  const goal = parseGoal((await searchParams).goal);

  // Started before the first await so it overlaps the auth round-trip.
  const highlights = getPropertiesPage({
    filters: HIGHLIGHTS.filters,
    sort: HIGHLIGHTS.sort,
    pageSize: HIGHLIGHTS.pageSize,
  });

  const [{ supabase, user }, ent] = await Promise.all([getUser(), getEntitlements()]);
  const seed = daySeed(user?.id ?? null);
  const now = new Date();

  const [favIds, pool] = await Promise.all([
    user ? getFavoriteIds(supabase) : Promise.resolve<string[]>([]),
    highlights,
  ]);

  // The hero is the LCP element: a priority image inside a Suspense boundary cannot be
  // preloaded from the initial HTML, so this one pool is awaited rather than streamed.
  const open = stillOpen(pool.items, now);
  const hero = pickHero(open, seed);
  const featured = byInvestment(
    seededPick(open, 6, "highlights", seed, {
      exclude: hero ? new Set([hero.id]) : undefined,
    }),
  );

  const { name } = accountFrom(user);
  const greeting = user ? `Olá, ${shortName(name)}.` : "Olá!";

  return (
    <section className="view home">
      <HomeHead greeting={greeting} hasFavorites={favIds.length > 0} />
      {hero && <HeroPick p={hero} now={now} />}

      <Suspense fallback={<InsightsSkeleton />}>
        <MarketSlot />
      </Suspense>

      {favIds.length > 0 && ent.can("recommendations") && (
        <Suspense fallback={null}>
          <SavedRailSlot ids={favIds} seed={seed} now={now} limit={ent.limit("recommendations")} />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <ClosingRailSlot seed={seed} now={now} />
      </Suspense>

      {/* Unkeyed on purpose - see GoalSection. */}
      <GoalSection active={goal}>
        <Suspense fallback={<RailSkeleton hideHead />}>
          <GoalRailSlot goal={goal} seed={seed} now={now} />
        </Suspense>
      </GoalSection>

      <HighlightsGrid items={featured} />

      <Suspense fallback={<RailSkeleton />}>
        <DiscountRailSlot seed={seed} now={now} />
      </Suspense>

      <Suspense fallback={<RailSkeleton />}>
        <BudgetRailSlot seed={seed} now={now} />
      </Suspense>

      <Suspense fallback={null}>
        <VacantRailSlot seed={seed} now={now} />
      </Suspense>

      <Suspense fallback={null}>
        <FinancingRailSlot seed={seed} now={now} />
      </Suspense>

      <Suspense fallback={null}>
        <PaymentChangeRailSlot seed={seed} now={now} />
      </Suspense>

      <Suspense fallback={null}>
        <ModalityChangeRailSlot seed={seed} now={now} />
      </Suspense>

      <Suspense fallback={<GridSkeleton />}>
        <CitiesSlot seed={seed} />
      </Suspense>

      {ent.can("groups") && (
        <Suspense fallback={<GridSkeleton cells={3} />}>
          <CollectionsSlot />
        </Suspense>
      )}
    </section>
  );
}
