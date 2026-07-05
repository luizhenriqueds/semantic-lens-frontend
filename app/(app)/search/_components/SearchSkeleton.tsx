export default function SearchSkeleton({ scope }: { scope: "imoveis" | "matriculas" }) {
  if (scope === "matriculas") {
    return (
      <>
        <div className="searchloading">
          <span className="spinner" aria-hidden="true" />
          Analisando as matrículas como documentos jurídicos…
        </div>
        <div className="deedlist">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="skdeed" key={i}>
              <div className="skline w45" />
              <div className="skpill" />
              <div className="skline w70" />
            </div>
          ))}
        </div>
      </>
    );
  }

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
