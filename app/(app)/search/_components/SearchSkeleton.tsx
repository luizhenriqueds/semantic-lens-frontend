export default function SearchSkeleton() {
  return (
    <>
      <div className="searchloading">
        <span className="spinner" aria-hidden="true" />
        Buscando os imóveis mais relevantes…
      </div>
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
