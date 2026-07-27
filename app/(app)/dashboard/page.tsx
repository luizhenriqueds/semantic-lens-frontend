import { Suspense } from "react";
import { accountFrom, shortName } from "@/lib/account";
import { getPropertiesPage } from "@/lib/data";
import { getFavoriteIds } from "@/lib/data/favorites";
import { HIGHLIGHTS, daySeed, parseGoal, pickHero, seededPick } from "@/lib/discovery";
import { getUser } from "@/lib/supabase/server";
import GoalChips from "./_components/GoalChips";
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

  const { supabase, user } = await getUser();
  const seed = daySeed(user?.id ?? null);
  const now = new Date();

  const [favIds, pool] = await Promise.all([
    user ? getFavoriteIds(supabase) : Promise.resolve<string[]>([]),
    highlights,
  ]);

  // The hero is the LCP element: a priority image inside a Suspense boundary cannot be
  // preloaded from the initial HTML, so this one pool is awaited rather than streamed.
  const hero = pickHero(pool.items, seed);
  const featured = seededPick(pool.items, 6, "highlights", seed, {
    exclude: hero ? new Set([hero.id]) : undefined,
  });

  const { name } = accountFrom(user);
  const greeting = user ? `Olá, ${shortName(name)}.` : "Olá!";

  return (
    <section className="view home">
      <HomeHead greeting={greeting} hasFavorites={favIds.length > 0} />

      {hero && <HeroPick p={hero} now={now} />}

      <Suspense fallback={<InsightsSkeleton />}>
        <MarketSlot />
      </Suspense>

      {favIds.length > 0 && (
        <Suspense fallback={null}>
          <SavedRailSlot ids={favIds} seed={seed} now={now} />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <ClosingRailSlot seed={seed} now={now} />
      </Suspense>

      <div className="railsec">
        <GoalChips active={goal} />
      </div>
      <Suspense key={goal} fallback={<RailSkeleton />}>
        <GoalRailSlot goal={goal} seed={seed} now={now} />
      </Suspense>

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

      <Suspense fallback={<GridSkeleton />}>
        <CitiesSlot seed={seed} />
      </Suspense>

      <Suspense fallback={<GridSkeleton cells={3} />}>
        <CollectionsSlot seed={seed} />
      </Suspense>
    </section>
  );
}
