import SearchHead from "./_components/SearchHead";
import SearchSkeleton from "./_components/SearchSkeleton";

// Without this, arriving from another route falls back to the group-level spinner and throws
// the whole view away; a search from the topbar should look like one started on the page.
export default function Loading() {
  return (
    <section className="view">
      <SearchHead />
      <SearchSkeleton />
    </section>
  );
}
