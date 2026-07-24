"use client";

import Image from "next/image";
import { useState } from "react";
import Hint from "@/components/ui/Hint";
import { SHOWCASE, type ShowcaseProperty } from "@/app/(marketing)/_data/showcase";
import { money } from "@/lib/format";
import Rail from "./Rail";

const fmtArea = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} m²`;

// The showcase mixes property types, so a listing without bedrooms or parking
// must not render empty cells.
function attrsOf(p: ShowcaseProperty) {
  return [
    { k: "Área útil", v: fmtArea(p.areaM2) },
    ...(p.bedrooms ? [{ k: "Quartos", v: String(p.bedrooms) }] : []),
    ...(p.parking ? [{ k: "Vagas", v: String(p.parking) }] : []),
    { k: "Situação", v: p.occupancy },
  ].slice(0, 4);
}

const factsOf = (p: ShowcaseProperty) => [
  fmtArea(p.areaM2),
  ...(p.bedrooms ? [`${p.bedrooms} quartos`] : []),
  p.occupancy,
];

const ringOffset = (v: number, dash: number) => ((dash * (100 - v)) / 100).toFixed(1);

export default function ShowcaseGallery() {
  const [selected, setSelected] = useState(0);
  const featured = SHOWCASE[selected];

  return (
    <>
      <div className="lp-showcase">
        {/* keyed so the ring and bars re-animate when another property is picked */}
        <article className="lp-sc-card" key={`card-${featured.slug}`}>
          <div className="lp-sc-photo">
            <Image
              src={featured.photo}
              alt={`Fachada - ${featured.title}, ${featured.location}`}
              width={1200}
              height={750}
              priority
              sizes="(max-width: 900px) 100vw, 620px"
            />
            <span className="lp-tag">{featured.type}</span>
            <span className="lp-simi">{featured.modality}</span>
          </div>
          <div className="lp-sc-body">
            <b className="lp-sc-title">{featured.title}</b>
            <div className="lp-loc">{featured.location}</div>

            <div className="lp-sc-attrs">
              {attrsOf(featured).map((a) => (
                <div key={a.k}>
                  <span>{a.k}</span>
                  <b>{a.v}</b>
                </div>
              ))}
            </div>

            <div className="lp-sc-price">
              <div>
                <span>Lance inicial</span>
                <b>{money(featured.saleValue)}</b>
              </div>
              <div className="lp-sc-visual">
                <i>{featured.visualScore}</i> avaliação visual da fachada
              </div>
            </div>
          </div>
        </article>

        <div className="lp-sc-side" key={`side-${featured.slug}`}>
          <div className="lp-sc-ring">
            <svg className="lp-ring" width="92" height="92" viewBox="0 0 56 56">
              <circle className="lp-track" cx="28" cy="28" r="23" strokeWidth="6" />
              <circle
                className="lp-bar"
                cx="28"
                cy="28"
                r="23"
                strokeWidth="6"
                strokeDasharray="144.5"
                strokeDashoffset={ringOffset(featured.investment, 144.5)}
                transform="rotate(-90 28 28)"
              />
              <text x="28" y="33" textAnchor="middle" fontSize="17">
                {featured.investment}
              </text>
            </svg>
            <div>
              <b className="lp-sc-scorelabel">
                Nota geral de investimento
                <Hint title="Como a nota é calculada" align="left" size={15}>
                  Combina desconto sobre a avaliação, preço frente ao mercado do bairro, qualidade
                  da região e facilidade de revenda. É comparativa: posiciona o imóvel em relação
                  aos outros da mesma cidade.{" "}
                  <a className="lp-hint-more" href="#faq-nota">
                    Ver o cálculo completo
                  </a>
                </Hint>
              </b>
              <span>
                {money(featured.appraisedValue)} de avaliação · {featured.discount}% de desconto
              </span>
            </div>
          </div>

          <div className="lp-sc-uses">
            <span className="lp-seclabel lp-sc-lbl">Melhores usos</span>
            {featured.uses.map((u) => (
              <div className="lp-bar" key={u.k}>
                <div className="lp-t">
                  <span>{u.k}</span>
                  <b>{u.v}</b>
                </div>
                <div className="lp-track">
                  <i style={{ width: `${u.v}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="lp-whybox">
            <b>Por quê?</b> {featured.why}
          </div>
        </div>
      </div>

      <div className="lp-more">
        <span className="lp-more-hint">Escolha um imóvel para ver a análise completa</span>
        <Rail label="Outros imóveis analisados">
          {SHOWCASE.map((p, i) => (
            <button
              type="button"
              className={`lp-mcard${i === selected ? " lp-on" : ""}`}
              key={p.slug}
              onClick={() => setSelected(i)}
              aria-pressed={i === selected}
            >
              <span className="lp-mcard-photo">
                <Image
                  src={p.photo}
                  alt={`Fachada - ${p.title}, ${p.location}`}
                  width={600}
                  height={375}
                  loading="lazy"
                  sizes="(max-width: 700px) 78vw, 300px"
                />
                <span className="lp-tag">{p.type}</span>
                <span className="lp-disc">-{p.discount}%</span>
              </span>
              <span className="lp-mcard-body">
                <b>{p.title}</b>
                <span className="lp-loc">{p.location}</span>
                <span className="lp-mcard-facts">
                  {factsOf(p).map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </span>
                <span className="lp-mcard-foot">
                  <span className="lp-mcard-price">
                    <span>Lance inicial</span>
                    <b>{money(p.saleValue)}</b>
                  </span>
                  <span className="lp-mcard-score">
                    <i>{p.investment}</i>
                    <span>nota</span>
                  </span>
                </span>
                <span className="lp-mcard-use">
                  <span>
                    Fachada <b>{p.visualScore}</b>
                  </span>
                  <span>
                    Melhor uso: <b>{p.uses[0].k.toLowerCase()}</b>
                  </span>
                </span>
              </span>
            </button>
          ))}
        </Rail>
      </div>
    </>
  );
}
