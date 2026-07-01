import Link from "next/link";
import { notFound } from "next/navigation";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import SaveButton from "./_components/SaveButton";
import ScoreBars from "./_components/ScoreBars";
import PoiNearGrid from "@/components/region/PoiNearGrid";
import RegionScoreBars from "@/components/region/RegionScoreBars";
import { getProperties, getProperty, getRegion } from "@/lib/data";
import { fmtDate, money, PROFILE_EXPLAIN, PROFILE_LABEL } from "@/lib/format";
import { IconBack } from "@/lib/icons";

export const revalidate = 120;

export async function generateStaticParams() {
  const all = await getProperties();
  return all.map((p) => ({ id: p.id }));
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProperty(id);
  if (!p) notFound();

  const [all, region] = await Promise.all([
    getProperties(),
    p.h3 ? getRegion(p.h3) : Promise.resolve(null),
  ]);

  const same = all.filter(
    (x) => p.clusterId != null && x.clusterId === p.clusterId && x.id !== p.id,
  );
  const rest = all
    .filter((x) => x.id !== p.id && x.clusterId !== p.clusterId)
    .sort(
      (a, b) =>
        Math.abs((a.lance ?? 0) - (p.lance ?? 0)) - Math.abs((b.lance ?? 0) - (p.lance ?? 0)),
    );
  const similar = [...same, ...rest].slice(0, 5);
  const data = fmtDate(p.dataLeilao);

  return (
    <section className="view">
      <Link href="/properties" className="backbtn">
        <IconBack width={18} height={18} strokeWidth={2} /> Voltar
      </Link>

      <div className="dhead">
        <div className="loc">
          {p.tipo}
          {p.situacao ? ` · ${p.situacao}` : ""}
        </div>
        <h1>
          {p.titulo} — {p.bairro}
        </h1>
        <div className="loc">
          {p.cidade}/{p.uf}
        </div>
        <div className="matr">
          MATRÍCULA CAIXA {p.id}
          {p.modalidade ? ` · ${p.modalidade.toUpperCase()}` : ""}
          {data ? ` · LEILÃO EM ${data.toUpperCase()}` : ""}
        </div>
      </div>

      <div className="detailgrid">
        <div>
          <div className="gallery">
            <PropertyPhoto
              src={p.image}
              alt={`Foto do imóvel: ${p.titulo}`}
              sizes="(max-width: 920px) 100vw, 700px"
            />
            <span className="badge">{p.tipo}</span>
          </div>

          <div className="factgrid">
            <div className="f">
              <div className="k">Área útil</div>
              <div className="v">{p.area != null ? `${Math.round(p.area)} m²` : "—"}</div>
            </div>
            <div className="f">
              <div className="k">Quartos</div>
              <div className="v">{p.quartos ?? "—"}</div>
            </div>
            <div className="f">
              <div className="k">Vagas</div>
              <div className="v">{p.vagas ?? "—"}</div>
            </div>
            <div className="f">
              <div className="k">Situação</div>
              <div className="v" style={{ fontSize: "15px" }}>
                {p.situacao ?? "—"}
              </div>
            </div>
          </div>

          <div className="infoblock">
            <h3>Nota por objetivo de investimento</h3>
            <ScoreBars scores={p.scores} />
            {p.perfil && (
              <div className="explain">
                <b>{PROFILE_LABEL[p.perfil]}:</b> {PROFILE_EXPLAIN[p.perfil]} As notas vão de 0 a
                100 e são calculadas a partir dos dados do imóvel e do bairro.
              </div>
            )}
          </div>

          {region && (
            <div className="rpanel">
              <div className="rp-top">
                <div>
                  <h3>A região: {region.nome}</h3>
                  <div className="where">
                    {region.cidade} · {region.numProps} imóveis analisados
                  </div>
                </div>
                <Link className="btn ghost" href={`/regions/${region.h3}`}>
                  Ver página da região ›
                </Link>
              </div>
              <RegionScoreBars region={region} />
              <PoiNearGrid region={region} />
              <div className="rnote">Calculado a partir de dados de mapa (OpenStreetMap).</div>
            </div>
          )}
        </div>

        <div>
          <div className="infoblock pricecard">
            <div className="now">{money(p.lance)}</div>
            {p.aval != null && <div className="was">Valor de avaliação: {money(p.aval)}</div>}
            {p.desc != null && <div className="discrow">−{Math.round(p.desc)}% de desconto</div>}
            <div className="when">
              {p.modalidade && <b>{p.modalidade}</b>}
              {data ? ` · leilão em ${data}` : ""}
            </div>
            <div className="cta">
              <SaveButton id={p.id} />
              {p.link && (
                <a
                  className="btn ghost"
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                  style={{ justifyContent: "center" }}
                >
                  Ver anúncio original
                </a>
              )}
            </div>
          </div>

          <div className="infoblock">
            <h3>Sobre o imóvel</h3>
            <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "14.5px", lineHeight: 1.6 }}>
              {p.descricao ?? `Imóvel de leilão da Caixa em ${p.bairro}, ${p.cidade}/${p.uf}.`}
              {p.clusterLabel && (
                <>
                  {" "}
                  Faz parte do grupo <b style={{ color: "var(--ink)" }}>“{p.clusterLabel}”</b>.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <>
          <div className="sectitle" style={{ marginTop: "26px" }}>
            <h2>Imóveis similares</h2>
          </div>
          <div className="pgrid compact">
            {similar.map((s) => (
              <PropertyCard key={s.id} p={s} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
