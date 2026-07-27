import { HeroSkeleton, InsightsSkeleton, RailSkeleton } from "./_components/skeletons";

export default function Loading() {
  return (
    <section className="view home" aria-busy="true">
      <div className="pagehead">
        <div className="skline w70" style={{ height: 26 }} />
        <div className="skline w55" style={{ marginTop: 12 }} />
      </div>
      <HeroSkeleton />
      <InsightsSkeleton />
      <RailSkeleton />
      <RailSkeleton />
    </section>
  );
}
