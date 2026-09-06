import MatchesSkeleton from "./_components/MatchesSkeleton";

// Without this the click falls back to the group-level spinner, which throws the whole view
// away. The alert name is not known here - loading.tsx cannot read params - so the head is
// two placeholder lines the real one replaces.
export default function Loading() {
  return (
    <section className="view">
      <div className="pagehead">
        <div className="searchhead">
          <div>
            <div className="skline w45" style={{ height: 26 }} />
            <div className="skline w70" style={{ marginTop: 12 }} />
          </div>
        </div>
      </div>
      <MatchesSkeleton />
    </section>
  );
}
