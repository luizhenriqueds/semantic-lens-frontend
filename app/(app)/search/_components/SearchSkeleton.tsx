import SearchProgress from "./SearchProgress";

/** Without a query this is a plain browse, so it must not narrate a search pipeline that is idle. */
export default function SearchSkeleton({ query }: { query?: string }) {
  return (
    <>
      {query ? <SearchProgress /> : <SearchProgress static="Carregando imóveis…" />}
      <div className="pgrid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="skcard" key={i}>
            <div className="skphoto" />
            <div className="skbody">
              <div className="skline w70" />
              <div className="skline w45" />
              <div className="skline w55" />
              <div className="skpill" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
