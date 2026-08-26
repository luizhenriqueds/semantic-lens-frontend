import SearchHead from "./_components/SearchHead";
import SearchSkeleton from "./_components/SearchSkeleton";

// Without this, arriving from another route falls back to the group-level spinner and throws
// the whole view away; a search from the topbar should look like one started on the page.
// No query here - loading.tsx cannot read search params - so it stays on the neutral copy.
export default function Loading() {
  return (
    <section className="view">
      <SearchHead />
      <SearchSkeleton />
    </section>
  );
}
