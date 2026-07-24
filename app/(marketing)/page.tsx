import Image from "next/image";
import Link from "next/link";
import LandingEffects from "@/app/(marketing)/_components/LandingEffects";
import ApiWaitlist from "@/app/(marketing)/_components/ApiWaitlist";
import Hint from "@/components/ui/Hint";
import {
  SpotCommercial,
  SpotFamily,
  SpotFlip,
  SpotLiquidity,
  SpotSeason,
  SpotStudent,
} from "@/app/(marketing)/_components/UseSpots";
import { IconCalendar, IconChart, IconHouse, IconSliders, POI_ICON } from "@/lib/icons";
import Rail from "@/app/(marketing)/_components/Rail";
import ShowcaseGallery from "@/app/(marketing)/_components/ShowcaseGallery";
import { SHOWCASE_CAPTURED } from "@/app/(marketing)/_data/showcase";
import { SIMILAR, SIMILAR_SEED } from "@/app/(marketing)/_data/similar";
import { getLandingStats } from "@/lib/data/landingStats";
import { countShort, fmtDay, money } from "@/lib/format";
import { getUser } from "@/lib/supabase/server";

function ScoreBars({ items }: { items: { k: string; v: number }[] }) {
  return (
    <>
      {items.map((i) => (
        <div className="lp-bar" key={i.k}>
          <div className="lp-t">
            <span>{i.k}</span>
            <b>{i.v}</b>
          </div>
          <div className="lp-track">
            <i data-w={`${i.v}%`}></i>
          </div>
        </div>
      ))}
    </>
  );
}

type StatTile = { v: string; suffix?: string; k: string; note: string; accent?: boolean };

export default async function LandingPage() {
  const [{ user }, stats] = await Promise.all([getUser(), getLandingStats()]);
  const updatedAt = fmtDay(stats?.computedAt);

  const tiles: StatTile[] = stats
    ? [
        {
          v: countShort(stats.activeProperties),
          k: "imóveis ativos",
          note: "de leilão e venda direta da Caixa",
        },
        {
          v: countShort(stats.pois),
          k: "pontos de referência",
          note: `medidos em ${stats.poiCategories} categorias`,
        },
        {
          v: countShort(stats.regions),
          k: "regiões analisadas",
          note: `em ${stats.ufs} estados`,
        },
        {
          v: countShort(stats.clusters),
          k: "famílias de imóveis",
          note: "grupos de imóveis parecidos",
        },
        ...(stats.discountMedian != null
          ? [
              {
                v: stats.discountMedian.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
                suffix: "%",
                k: "desconto mediano",
                note: "sobre a avaliação da Caixa",
                accent: true,
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      <header className="lp-nav">
        <div className="lp-wrap">
          <a className="lp-brand" href="#top" aria-label="Lavra - início">
            <span className="lp-mark">
              <svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true">
                <circle cx="14" cy="9" r="3" fill="currentColor" />
                <path
                  d="M14 15v15a4 4 0 0 0 4 4h13"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M27 27.5 34 34l-7 6.5"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </span>
            <span>
              <b>Lavra</b>
              <small>Leilões inteligentes</small>
            </span>
          </a>
          <button
            className="lp-navtoggle"
            id="navtoggle"
            type="button"
            aria-label="Abrir menu"
            aria-expanded="false"
          >
            <svg className="lp-bars" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg className="lp-close" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <div className="lp-navmenu" id="navmenu">
            <nav>
              <a href="#recursos">Recursos</a>
              <a href="#exemplo">Exemplo real</a>
              <a href="#planos">Planos</a>
              <a href="#faq">Dúvidas</a>
            </nav>
            <div className="lp-navcta">
              {user ? (
                <Link className="lp-btn lp-solid" href="/dashboard">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link className="lp-btn lp-ghost" href="/login">
                    Entrar
                  </Link>
                  <Link className="lp-btn lp-solid" href="/register">
                    Criar conta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="lp-hero" id="top">
        <div className="lp-hexfield" aria-hidden="true">
          <svg preserveAspectRatio="xMidYMin slice" viewBox="0 0 1200 700">
            <defs>
              <pattern id="hexes" width="104" height="180" patternUnits="userSpaceOnUse">
                <g className="lp-hexline">
                  <polygon points="52,2 100,29 100,89 52,116 4,89 4,29" />
                  <polygon
                    points="104,92 152,119 152,179 104,206 56,179 56,119"
                    transform="translate(-52 0)"
                  />
                  <polygon
                    points="0,92 48,119 48,179 0,206 -48,179 -48,119"
                    transform="translate(52 0)"
                  />
                </g>
              </pattern>
            </defs>
            <rect width="1200" height="700" fill="url(#hexes)" />
            <g strokeWidth="1.2">
              <polygon
                className="lp-hex"
                points="820,182 868,209 868,269 820,296 772,269 772,209"
                fillOpacity="0.16"
              />
              <polygon
                className="lp-hex"
                points="924,242 972,269 972,329 924,356 876,329 876,269"
                fillOpacity="0.09"
              />
              <polygon
                className="lp-hex"
                points="716,122 764,149 764,209 716,236 668,209 668,149"
                fillOpacity="0.07"
              />
            </g>
          </svg>
        </div>
        <div className="lp-wrap">
          <div>
            <h1>
              O leilão certo,
              <br />
              sem garimpo e<br />
              sem{" "}
              <span className="lp-u">
                juridiquês.
                <svg viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 7 Q 50 2, 100 6 T 198 4" />
                </svg>
              </span>
            </h1>
            <p className="lp-lede">
              A Lavra reúne os imóveis de leilão da Caixa em um painel só e dá a cada um notas de 0
              a 100 para preço, região e melhor uso. Você descreve o que procura em português; as
              melhores oportunidades sobem para o topo.
            </p>
            <div className="lp-actions">
              <Link className="lp-btn lp-solid lp-big" href="/dashboard">
                Explorar imóveis
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14m0 0-6-6m6 6-6 6" />
                </svg>
              </Link>
              <a className="lp-btn lp-ghost lp-big" href="#exemplo">
                Ver um imóvel real analisado
              </a>
            </div>
            <div className="lp-micro">Sem cadastro para explorar · base atualizada diariamente</div>
          </div>

          <div className="lp-heromock lp-reveal" aria-hidden="true">
            <div className="lp-photo">
              <span className="lp-disc">Desconto sobre a avaliação</span>
              <svg
                className="lp-photo-illus"
                viewBox="0 0 360 180"
                preserveAspectRatio="xMidYMid slice"
              >
                <polygon className="lp-il-hex" points="308,24 324,33 324,51 308,60 292,51 292,33" />
                <polygon
                  className="lp-il-hex"
                  points="46,30 58,37 58,51 46,58 34,51 34,37"
                  opacity="0.09"
                />
                <path
                  className="lp-il-ground"
                  d="M0 134 C 90 118, 150 142, 220 130 C 290 120, 332 136, 360 128 L360 180 L0 180 Z"
                />

                <rect className="lp-il-roof-soft" x="40" y="66" width="54" height="66" rx="3" />
                <rect className="lp-il-win" x="48" y="76" width="11" height="11" rx="1.5" />
                <rect className="lp-il-win" x="67" y="76" width="11" height="11" rx="1.5" />
                <rect className="lp-il-win" x="48" y="94" width="11" height="11" rx="1.5" />
                <rect className="lp-il-win" x="67" y="94" width="11" height="11" rx="1.5" />
                <rect className="lp-il-win" x="48" y="112" width="11" height="11" rx="1.5" />
                <rect className="lp-il-win" x="67" y="112" width="11" height="11" rx="1.5" />

                <rect className="lp-il-tree-trunk" x="306" y="102" width="8" height="32" rx="2" />
                <circle className="lp-il-tree-top" cx="310" cy="94" r="21" />

                <rect className="lp-il-roof" x="196" y="50" width="8" height="20" rx="1" />
                <polygon className="lp-il-roof" points="148,66 212,66 228,94 132,94" />
                <rect className="lp-il-wall" x="150" y="94" width="62" height="44" />
                <rect className="lp-il-door" x="172" y="112" width="17" height="26" rx="1" />
                <rect className="lp-il-win" x="157" y="102" width="13" height="13" rx="1.5" />
                <rect className="lp-il-win" x="192" y="102" width="13" height="13" rx="1.5" />

                <path
                  className="lp-il-pin"
                  d="M181 40c-7 0-12 5-12 12 0 8 12 18 12 18s12-10 12-18c0-7-5-12-12-12z"
                />
                <circle className="lp-il-pin-dot" cx="181" cy="52" r="4" />
              </svg>
              <div className="lp-uses">
                <span>Moradia</span>
                <span>Temporada</span>
                <span>Revenda</span>
              </div>
            </div>
            <div className="lp-mrow">
              <div className="lp-info">
                <b>Lance inicial</b>
                <span className="lp-loc">Avaliação Caixa · preço vs. mercado do bairro</span>
              </div>
            </div>
            <div className="lp-scorebar">
              <svg className="lp-ring" width="56" height="56" viewBox="0 0 56 56">
                <circle className="lp-track" cx="28" cy="28" r="23" strokeWidth="6" />
                <circle
                  className="lp-bar"
                  cx="28"
                  cy="28"
                  r="23"
                  strokeWidth="6"
                  strokeDasharray="144.5"
                  strokeDashoffset="144.5"
                  data-off="18.8"
                  transform="rotate(-90 28 28)"
                />
                <text x="28" y="32" textAnchor="middle" fontSize="12">
                  0-100
                </text>
              </svg>
              <div className="lp-lbl">
                Nota de investimento<b>Cada imóvel chega com essa leitura pronta</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {stats && (
        <section className="lp-statsband" aria-label="A base da Lavra hoje">
          <div className="lp-wrap">
            <div className="lp-stats">
              {tiles.map((s) => (
                <div className={`lp-stat${s.accent ? " lp-accent" : ""}`} key={s.k}>
                  <div className="lp-v">
                    {s.v}
                    {s.suffix ? <small>{s.suffix}</small> : null}
                  </div>
                  <div className="lp-k">{s.k}</div>
                  <div className="lp-note">{s.note}</div>
                </div>
              ))}
            </div>
            <p className="lp-stats-foot">
              Sem cadastro para explorar · toda nota vem com o porquê, fator a fator
              {updatedAt ? ` · base atualizada em ${updatedAt}` : ""}
            </p>
          </div>
        </section>
      )}

      <section className="lp-band lp-chapter lp-alt lp-showband" id="exemplo">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">imóveis reais, notas reais</span>
            <h2>Veja a Lavra analisando um imóvel de verdade</h2>
            <p>
              Nada de tela de exemplo. Abaixo está exatamente o que a plataforma mostra sobre um
              imóvel da base: <b>nota, melhores usos e leitura da região</b>.
            </p>
          </div>

          <ShowcaseGallery />

          <div className="lp-sc-cta lp-reveal lp-d3">
            <Link className="lp-btn lp-solid lp-big" href="/dashboard">
              Ver imóveis como este
            </Link>
            <span>
              Imóveis reais da base pública da Caixa, com dados de {fmtDay(SHOWCASE_CAPTURED)}. A
              oferta muda todo dia - um imóvel pode ser arrematado ou sair do ar a qualquer momento.
            </span>
          </div>
        </div>
      </section>

      <section className="lp-band lp-chapter" id="recursos">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">o que a Lavra faz por você</span>
            <h2>Da busca ao lance, com número em cada passo</h2>
            <p>
              Quatro coisas que a Lavra faz automaticamente, todo dia, em cima de toda a base ativa.
            </p>
          </div>

          <div className="lp-stack lp-m-slide">
            <div className="lp-layer">
              <div className="lp-lcard">
                <div className="lp-lbody">
                  <div className="lp-lhead">
                    <span className="lp-lindex">
                      <i>1</i> busca em português
                    </span>
                  </div>
                  <h3>Descreva o imóvel; a gente encontra o leilão</h3>
                  <p>
                    Fale como falaria com um corretor. A Lavra entende o seu objetivo - não só
                    palavras-chave - e ordena por afinidade.
                  </p>
                  <ul className="lp-lpoints">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Português coloquial, sem dropdowns nem juridiquês
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Resultados ranqueados pela afinidade com o objetivo
                    </li>
                  </ul>
                </div>
                <div className="lp-lviz">
                  <div className="lp-demoq">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.2-3.2" />
                    </svg>
                    <span>casa para reformar e revender na zona sul de SP</span>
                    <span className="lp-car"></span>
                  </div>
                  <div className="lp-demotags">
                    <span>reforma &amp; revenda</span>
                    <span>zona sul · SP</span>
                    <span>boa liquidez</span>
                  </div>
                  <div className="lp-mockhit">
                    <span className="lp-ph">
                      <svg
                        className="lp-photo-illus2"
                        viewBox="0 0 46 46"
                        preserveAspectRatio="xMidYMid slice"
                      >
                        <polygon className="lp-il-roof" points="10,18 36,18 40,26 6,26" />
                        <rect className="lp-il-wall" x="12" y="26" width="22" height="16" />
                        <rect className="lp-il-door" x="20" y="33" width="6" height="9" />
                      </svg>
                    </span>
                    <div>
                      <b>Casa 110 m² · Saúde</b>
                      <span className="lp-s">1ª praça em 12 dias · R$ 385.000</span>
                    </div>
                    <div className="lp-aff">
                      <div className="lp-pct">96%</div>
                      <div className="lp-l">afinidade</div>
                    </div>
                  </div>
                  <div className="lp-mockhit">
                    <span className="lp-ph">
                      <svg
                        className="lp-photo-illus2"
                        viewBox="0 0 46 46"
                        preserveAspectRatio="xMidYMid slice"
                      >
                        <rect
                          className="lp-il-roof-soft"
                          x="13"
                          y="10"
                          width="20"
                          height="32"
                          rx="2"
                        />
                        <rect className="lp-il-win" x="17" y="15" width="5" height="5" />
                        <rect className="lp-il-win" x="24" y="15" width="5" height="5" />
                        <rect className="lp-il-win" x="17" y="24" width="5" height="5" />
                        <rect className="lp-il-win" x="24" y="24" width="5" height="5" />
                      </svg>
                    </span>
                    <div>
                      <b>Sobrado 96 m² · Jabaquara</b>
                      <span className="lp-s">2ª praça em 20 dias · R$ 298.000</span>
                    </div>
                    <div className="lp-aff">
                      <div className="lp-pct">91%</div>
                      <div className="lp-l">afinidade</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-layer">
              <div className="lp-lcard">
                <div className="lp-lbody">
                  <div className="lp-lhead">
                    <span className="lp-badge-prop">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="4" y="10" width="16" height="11" rx="2" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>{" "}
                      Modelo próprio da Lavra
                    </span>
                    <span className="lp-lindex">
                      <i>2</i> nota de investimento
                    </span>
                  </div>
                  <h3>Uma nota de 0 a 100 - e o porquê dela</h3>
                  <p>
                    A nota combina desconto sobre a avaliação, preço frente ao mercado do bairro,
                    serviços no entorno e facilidade de revenda. Os pesos mudam conforme o tipo -
                    moradia, terreno ou comercial se valorizam de formas diferentes.
                  </p>
                  <ul className="lp-lpoints">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Pesos ajustados por tipo de imóvel
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Explicação fator a fator: o que puxou para cima e o que puxou para baixo
                    </li>
                  </ul>
                </div>
                <div className="lp-lviz">
                  <div className="lp-scorehdr">
                    <svg className="lp-ring" width="56" height="56" viewBox="0 0 56 56">
                      <circle className="lp-track" cx="28" cy="28" r="23" strokeWidth="6" />
                      <circle
                        className="lp-bar"
                        cx="28"
                        cy="28"
                        r="23"
                        strokeWidth="6"
                        strokeDasharray="144.5"
                        strokeDashoffset="144.5"
                        data-off="15.9"
                        transform="rotate(-90 28 28)"
                      />
                      <text x="28" y="33" textAnchor="middle" fontSize="16">
                        89
                      </text>
                    </svg>
                    <div className="lp-info">
                      <b>Apartamento 64 m² · Jardim Palma Travassos</b>
                      <span>Lance R$ 137.390 · Avaliação R$ 228.983</span>
                    </div>
                  </div>
                  <div className="lp-bar">
                    <div className="lp-t">
                      <span>Desconto sobre avaliação</span>
                      <b>92</b>
                    </div>
                    <div className="lp-track">
                      <i data-w="92%"></i>
                    </div>
                  </div>
                  <div className="lp-bar">
                    <div className="lp-t">
                      <span>Qualidade da região</span>
                      <b>88</b>
                    </div>
                    <div className="lp-track">
                      <i data-w="88%"></i>
                    </div>
                  </div>
                  <div className="lp-bar">
                    <div className="lp-t">
                      <span>Liquidez do tipo</span>
                      <b>81</b>
                    </div>
                    <div className="lp-track">
                      <i data-w="81%"></i>
                    </div>
                  </div>
                  <div className="lp-whybox">
                    <b>Por quê?</b> preço por m² ~40% abaixo da mediana da região e boa oferta de
                    serviços por perto.
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-layer">
              <div className="lp-lcard">
                <div className="lp-lbody">
                  <div className="lp-lhead">
                    <span className="lp-badge-prop">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" />
                      </svg>{" "}
                      Visão computacional
                    </span>
                    <span className="lp-lindex">
                      <i>3</i> avaliação visual
                    </span>
                  </div>
                  <h3>A cara do imóvel também vira nota</h3>
                  <p>
                    A partir da foto do anúncio, a Lavra dá uma nota de 0 a 100 para{" "}
                    <b>fachada, acabamento e estado de conservação</b> - um sinal a mais para
                    dimensionar a reforma antes de visitar, que entra no cálculo da nota geral.
                  </p>
                  <ul className="lp-lpoints">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Qualidade de fachada em nota comparável
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Disponível na maior parte dos imóveis com foto
                    </li>
                  </ul>
                </div>
                <div className="lp-lviz">
                  <div className="lp-vs-photo">
                    <span className="lp-ai-badge">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" />
                      </svg>{" "}
                      IA · visão
                    </span>
                    <Image
                      src="/showcase/apto-ribeirao-preto.jpg"
                      alt=""
                      width={1200}
                      height={750}
                      loading="lazy"
                      sizes="420px"
                    />
                    <div className="lp-scan">
                      <span>fachada analisada</span>
                    </div>
                  </div>
                  <div className="lp-vs-stats">
                    <div className="lp-vs-stat">
                      <div className="lp-k">Qualidade da fachada</div>
                      <div className="lp-v">
                        82<small>/100</small>
                      </div>
                    </div>
                    <div className="lp-vs-stat">
                      <div className="lp-k">Entra na nota geral</div>
                      <div className="lp-v">
                        sim<small> · como um fator</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-layer">
              <div className="lp-lcard">
                <div className="lp-lbody">
                  <div className="lp-lhead">
                    <span className="lp-lindex">
                      <i>4</i> alertas e agenda
                    </span>
                  </div>
                  <h3>A oportunidade chega no seu e-mail</h3>
                  <p>
                    Salve os critérios que você procura e escolha a frequência: <b>diária</b>,{" "}
                    <b>semanal</b> ou <b>mensal</b>. A Lavra varre a base atualizada e manda por
                    e-mail só o que combina - com a nota já calculada.
                  </p>
                  <ul className="lp-lpoints">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Você escolhe a cadência: diária, semanal ou mensal
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Datas de leilão dos seus favoritos na carteira
                    </li>
                  </ul>
                </div>
                <div className="lp-lviz">
                  <div className="lp-alertcard">
                    <div className="lp-top">
                      <span className="lp-bell">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                        </svg>
                      </span>
                      <div>
                        <b>Casas p/ reforma · zona sul SP</b>
                        <span>seu alerta salvo</span>
                      </div>
                      <span className="lp-when">aviso diário</span>
                    </div>
                    <div className="lp-msg">
                      <b>3 imóveis novos</b> combinam com os seus critérios. O melhor: casa 127 m²,
                      nota 94, 79% abaixo da avaliação.
                    </div>
                    <div className="lp-channels">
                      <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <path d="m3 7 9 6 9-6" />
                        </svg>{" "}
                        E-mail
                      </span>
                      <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="5" width="18" height="16" rx="2" />
                          <path d="M3 10h18M8 3v4M16 3v4" />
                        </svg>{" "}
                        Agenda de leilões
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-band lp-beat lp-tint lp-m-hide">
        <div className="lp-wrap">
          <div className="lp-breakdown">
            <div className="lp-txt lp-reveal">
              <span className="lp-seclabel">a nota principal</span>
              <h3>Nota de Investimento: é um bom negócio?</h3>
              <p>
                Ela combina, com pesos calibrados, os fatores que mais importam na hora de
                arrematar:
              </p>
              <ul className="lp-factorlist">
                <li>
                  <span className="lp-fi">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </span>
                  <div>
                    <b>Desconto sobre a avaliação</b>
                    <span>quanto o preço está abaixo do valor avaliado pela Caixa.</span>
                  </div>
                </li>
                <li>
                  <span className="lp-fi">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 3v18h18" />
                      <path d="M7 13l3-3 3 2 5-5" />
                    </svg>
                  </span>
                  <div>
                    <b>Preço vs. mercado</b>
                    <span>se o preço por m² está barato frente ao mercado aberto da região.</span>
                  </div>
                </li>
                <li>
                  <span className="lp-fi">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 2 3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7z" />
                    </svg>
                  </span>
                  <div>
                    <b>Qualidade da região</b>
                    <span>proximidade de mercados, hospitais, escolas, farmácias e parques.</span>
                  </div>
                </li>
                <li>
                  <span className="lp-fi">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
                    </svg>
                  </span>
                  <div>
                    <b>Diversidade de serviços</b>
                    <span>variedade de comércios e serviços por perto - uma região completa.</span>
                  </div>
                </li>
                <li>
                  <span className="lp-fi">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 12h4l3 8 4-16 3 8h4" />
                    </svg>
                  </span>
                  <div>
                    <b>Liquidez do tipo de imóvel</b>
                    <span>
                      apartamentos e casas revendem mais fácil que salas, galpões ou terrenos.
                    </span>
                  </div>
                </li>
                <li>
                  <span className="lp-fi">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-2.7L7 19l1-6-4-4 5.5-.5z" />
                    </svg>
                  </span>
                  <div>
                    <b>Melhor uso / potencial</b>
                    <span>o ponto mais forte do imóvel - moradia, comércio, renda etc.</span>
                  </div>
                </li>
              </ul>
              <div className="lp-weightnote">
                Pesos ajustados por tipo:
                <span className="lp-chip">Moradia</span>
                <span className="lp-chip">Terreno</span>
                <span className="lp-chip">Comercial</span>
              </div>
            </div>

            <div className="lp-scorecard lp-reveal lp-d1">
              <div className="lp-head">
                <svg className="lp-ring" width="60" height="60" viewBox="0 0 60 60">
                  <circle className="lp-track" cx="30" cy="30" r="24" strokeWidth="6" />
                  <circle
                    className="lp-bar"
                    cx="30"
                    cy="30"
                    r="24"
                    strokeWidth="6"
                    strokeDasharray="150.8"
                    strokeDashoffset="150.8"
                    data-off="16.6"
                    transform="rotate(-90 30 30)"
                  />
                  <text x="30" y="35" textAnchor="middle" fontSize="17">
                    89
                  </text>
                </svg>
                <div className="lp-info">
                  <b>Apartamento 64 m² · Jardim Palma Travassos</b>
                  <span>Lance R$ 137.390 · Avaliação Caixa R$ 228.983</span>
                </div>
              </div>
              <div className="lp-bar">
                <div className="lp-t">
                  <span>Desconto sobre a avaliação</span>
                  <b>92</b>
                </div>
                <div className="lp-track">
                  <i data-w="92%"></i>
                </div>
              </div>
              <div className="lp-bar">
                <div className="lp-t">
                  <span>Preço vs. mercado</span>
                  <b>84</b>
                </div>
                <div className="lp-track">
                  <i data-w="84%"></i>
                </div>
              </div>
              <div className="lp-bar">
                <div className="lp-t">
                  <span>Qualidade da região</span>
                  <b>88</b>
                </div>
                <div className="lp-track">
                  <i data-w="88%"></i>
                </div>
              </div>
              <div className="lp-bar">
                <div className="lp-t">
                  <span>Diversidade de serviços</span>
                  <b>79</b>
                </div>
                <div className="lp-track">
                  <i data-w="79%"></i>
                </div>
              </div>
              <div className="lp-bar lp-dim">
                <div className="lp-t">
                  <span>Liquidez do tipo</span>
                  <b>81</b>
                </div>
                <div className="lp-track">
                  <i data-w="81%"></i>
                </div>
              </div>
              <div className="lp-whybox">
                <b>Por quê?</b> preço por m² ~40% abaixo da mediana da região e boa oferta de
                serviços por perto puxam a nota para cima.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-band">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">para o que o imóvel serve melhor</span>
            <h2>Notas de uso: o destaque de cada imóvel</h2>
            <p>
              Além da nota principal, mostramos os melhores usos - e eles só aparecem quando o
              imóvel realmente se sobressai.
            </p>
          </div>
          <div className="lp-uses-grid">
            {[
              {
                Spot: SpotFamily,
                k: "Moradia familiar",
                d: "quartos e área, com escolas, parques e mercados por perto.",
              },
              {
                Spot: SpotSeason,
                k: "Aluguel por temporada",
                d: "perto do centro, de restaurantes, hotéis e universidades.",
              },
              {
                Spot: SpotStudent,
                k: "Aluguel estudantil",
                d: "universidades no entorno e imóvel compacto.",
              },
              {
                Spot: SpotFlip,
                k: "Reforma e revenda",
                d: "desconto, preço frente ao mercado e potencial de obra.",
              },
              {
                Spot: SpotLiquidity,
                k: "Liquidez na revenda",
                d: "quanto tempo o imóvel leva para sair naquela região.",
              },
              {
                Spot: SpotCommercial,
                k: "Comercial",
                d: "movimento do entorno: bancos, shoppings e restaurantes.",
              },
            ].map((u, i) => (
              <div className={`lp-usecard lp-reveal${i % 3 ? ` lp-d${i % 3}` : ""}`} key={u.k}>
                <u.Spot />
                <b>{u.k}</b>
                <span>{u.d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-band lp-chapter lp-alt lp-m-hide">
        <div className="lp-wrap">
          <div className="lp-region">
            <div className="lp-txt lp-reveal">
              <span className="lp-seclabel">a região, medida</span>
              <h3>Você não compra só o imóvel. Compra a região.</h3>
              <p>
                {stats
                  ? `A Lavra divide o país em ${countShort(stats.regions)} regiões e mede, em cada uma, a distância real até ${countShort(stats.pois)} pontos de referência em ${stats.poiCategories} categorias`
                  : "A Lavra divide o país em pequenas regiões e mede, em cada uma, a distância real até centenas de milhares de pontos de referência"}{" "}
                - de escola e hospital a restaurante, shopping e ponto de ônibus.
              </p>
              <p>
                Regiões mais completas puxam a nota para cima. No mapa, quanto mais escura a célula,
                mais serviço por perto.
              </p>
              <div className="lp-legend">
                <span>Menos serviços</span>
                <span className="lp-scale"></span>
                <span>Mais serviços</span>
              </div>
            </div>
            <div className="lp-mapcard lp-reveal lp-d1">
              <div className="lp-maphex">
                <svg viewBox="0 0 420 210" aria-hidden="true">
                  <g className="lp-map-dash" strokeDasharray="5 6">
                    <path d="M-10 60 C 130 45, 290 85, 430 62" />
                    <path d="M-10 140 C 140 125, 300 165, 430 142" />
                    <path d="M140 -10 C 130 70, 155 160, 145 220" />
                    <path d="M290 -10 C 280 70, 305 160, 295 220" />
                  </g>
                  <g strokeWidth="1">
                    <polygon
                      className="lp-map-hex"
                      points="210,64 241,82 241,118 210,136 179,118 179,82"
                      fillOpacity="0.5"
                    />
                    <polygon
                      className="lp-map-hex"
                      points="272,64 303,82 303,118 272,136 241,118 241,82"
                      fillOpacity="0.24"
                    />
                    <polygon
                      className="lp-map-hex"
                      points="148,64 179,82 179,118 148,136 117,118 117,82"
                      fillOpacity="0.34"
                    />
                    <polygon
                      className="lp-map-hex"
                      points="241,10 272,28 272,64 241,82 210,64 210,28"
                      fillOpacity="0.14"
                    />
                    <polygon
                      className="lp-map-hex"
                      points="179,10 210,28 210,64 179,82 148,64 148,28"
                      fillOpacity="0.18"
                    />
                    <polygon
                      className="lp-map-hex"
                      points="241,118 272,136 272,172 241,190 210,172 210,136"
                      fillOpacity="0.16"
                    />
                    <polygon
                      className="lp-map-hex"
                      points="179,118 210,136 210,172 179,190 148,172 148,136"
                      fillOpacity="0.2"
                    />
                    <polygon
                      className="lp-map-hex"
                      points="334,64 365,82 365,118 334,136 303,118 303,82"
                      fillOpacity="0.1"
                    />
                    <polygon
                      className="lp-map-hex"
                      points="86,64 117,82 117,118 86,136 55,118 55,82"
                      fillOpacity="0.12"
                    />
                  </g>
                  <g textAnchor="middle">
                    <text className="lp-map-txt lp-map-txt-strong" x="210" y="104">
                      88
                    </text>
                    <text className="lp-map-txt" x="148" y="104">
                      71
                    </text>
                    <text className="lp-map-txt" x="272" y="104">
                      62
                    </text>
                  </g>
                  <path
                    className="lp-map-pin"
                    d="M210 78c-7 0-12 5-12 12 0 8 12 18 12 18s12-10 12-18c0-7-5-12-12-12z"
                    transform="translate(0 -34)"
                  />
                  <circle className="lp-map-pin-dot" cx="210" cy="56" r="4" />
                </svg>
                <span className="lp-pill">Ribeirão Preto · SP</span>
                <span className="lp-coord">célula · alta densidade</span>
              </div>
              <div className="lp-pois">
                <div className="lp-poi">
                  <i>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M4 19V8l8-4 8 4v11" />
                      <path d="M9 19v-6h6v6" />
                    </svg>
                  </i>
                  <div>
                    <b>Escola</b>
                    <span className="lp-d">450 m</span>
                  </div>
                </div>
                <div className="lp-poi">
                  <i>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 4v16M4 12h16" />
                    </svg>
                  </i>
                  <div>
                    <b>Hospital</b>
                    <span className="lp-d">1,2 km</span>
                  </div>
                </div>
                <div className="lp-poi">
                  <i>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="5" y="4" width="14" height="13" rx="2" />
                      <path d="M8 21h8M9 17l-1 4M15 17l1 4" />
                    </svg>
                  </i>
                  <div>
                    <b>Metrô</b>
                    <span className="lp-d">700 m</span>
                  </div>
                </div>
                <div className="lp-poi">
                  <i>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M4 8h16v11H4zM8 8V5h8v3" />
                    </svg>
                  </i>
                  <div>
                    <b>Mercado</b>
                    <span className="lp-d">220 m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="lp-region-bridge lp-reveal">Na prática, é assim que uma região aparece:</p>

          <div className="lp-sc-region lp-reveal lp-d2">
            <div className="lp-sc-reghead">
              <div>
                <span className="lp-seclabel lp-sc-lbl">Perfil da região</span>
                <b>Porto Canoa · Serra/ES</b>
              </div>
              <div className="lp-sc-chips">
                <span>Temporada</span>
                <span>Familiar</span>
              </div>
            </div>
            <div className="lp-sc-reggrid">
              <div className="lp-sc-regscores">
                <ScoreBars
                  items={[
                    { k: "Moradia familiar", v: 88 },
                    { k: "Caminhabilidade", v: 88 },
                    { k: "Conveniência", v: 85 },
                    { k: "Temporada", v: 83 },
                  ]}
                />
              </div>
              <div className="lp-sc-pois">
                {[
                  { k: "Parque", v: "234 m" },
                  { k: "Supermercado", v: "299 m" },
                  { k: "Restaurante", v: "471 m" },
                  { k: "Shopping", v: "514 m" },
                  { k: "Universidade", v: "749 m" },
                  { k: "Hospital", v: "928 m" },
                ].map((p) => (
                  <div className="lp-sc-poi" key={p.k}>
                    <span>{p.k}</span>
                    <b>{p.v}</b>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-sc-foot">
              Distância em linha reta até o serviço mais próximo, a partir de dados abertos de mapa.
            </div>
          </div>
        </div>
      </section>

      <section className="lp-band lp-m-hide">
        <div className="lp-wrap">
          <div className="lp-market">
            <div className="lp-txt lp-reveal">
              <span className="lp-seclabel">análise de preço de mercado</span>
              <h3>O preço é bom mesmo? A gente compara com o mercado real.</h3>
              <p>
                Buscamos anúncios reais de imóveis semelhantes em portais consolidados - e ignoramos
                portais de leilão, para comparar sempre com o mercado aberto.
              </p>
              <div className="lp-sources">
                <span className="lp-yes">✓ portais consolidados do mercado</span>
                <span className="lp-no">portais de leilão</span>
              </div>
              <p>
                Calculamos o preço <b>mediano por m²</b> da região (que evita distorções de anúncios
                fora da curva) e refinamos para o imóvel específico, comparando só anúncios de área
                e nº de quartos parecidos.
              </p>
            </div>
            <div className="lp-marketviz lp-reveal lp-d1">
              <div className="lp-lbl">Preço mediano por m² · Ribeirão Preto</div>
              <div className="lp-med">
                <b>R$ 4.300</b>
                <span>/ m² no mercado aberto</span>
              </div>
              <div className="lp-scatter" aria-hidden="true">
                <span className="lp-pt" style={{ left: "12%", top: "60%" }}></span>
                <span className="lp-pt" style={{ left: "20%", top: "32%" }}></span>
                <span className="lp-pt" style={{ left: "28%", top: "70%" }}></span>
                <span className="lp-pt" style={{ left: "36%", top: "44%" }}></span>
                <span className="lp-pt" style={{ left: "44%", top: "24%" }}></span>
                <span className="lp-pt" style={{ left: "52%", top: "58%" }}></span>
                <span className="lp-pt" style={{ left: "60%", top: "38%" }}></span>
                <span className="lp-pt" style={{ left: "68%", top: "66%" }}></span>
                <span className="lp-pt" style={{ left: "76%", top: "30%" }}></span>
                <span className="lp-pt" style={{ left: "84%", top: "52%" }}></span>
                <span className="lp-pt" style={{ left: "90%", top: "40%" }}></span>
                <span className="lp-median" style={{ left: "50%" }}></span>
                <span className="lp-subject" style={{ left: "22%", top: "80%" }}></span>
              </div>
              <div className="lp-scatter-x">
                <span>mais barato / m²</span>
                <span>mais caro / m²</span>
              </div>
              <div className="lp-confid">
                <div className="lp-meter">
                  <i style={{ width: "88%" }}></i>
                </div>
                <div className="lp-txt2">
                  <b>Confiança alta</b> · 240 anúncios na região
                </div>
              </div>
            </div>
          </div>

          <div className="lp-split-note lp-reveal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5m0 3h.01" />
            </svg>
            <p>
              <b>E quando há poucos anúncios?</b> A estimativa se apoia numa área maior (bairro →
              cidade → estado) e o sistema reduz a confiança daquele dado - poucos anúncios contam
              menos. Já o <b>desconto sobre a avaliação</b> não depende do mercado: é a comparação
              direta entre o preço de venda e o valor que a própria Caixa avaliou.
            </p>
          </div>
        </div>
      </section>

      <section className="lp-band lp-chapter lp-deep">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">famílias de imóveis</span>
            <h2>Famílias de imóveis, montadas automaticamente</h2>
            <p>
              A Lavra agrupa imóveis parecidos entre si - tipo, tamanho, faixa de preço e perfil de
              região - e dá um nome a cada grupo. Em vez de filtrar campo por campo, você entra
              direto na família que combina com o seu plano.
            </p>
          </div>
          <div className="lp-clusters lp-m-slide">
            {[
              {
                slug: "alto-valor",
                label: "Apartamentos de alto valor",
                meta: "perfil temporada · fachada nova e área compacta",
              },
              {
                slug: "reforma",
                label: "Casas populares para reforma - Médio porte",
                meta: "perfil reforma e revenda · imóveis de médio porte",
              },
              {
                slug: "compactos",
                label: "Apartamentos compactos populares - ~41 m²",
                meta: "perfil alta liquidez · primeiro investimento",
              },
            ].map((c, i) => (
              <div className={`lp-cluster lp-reveal${i ? ` lp-d${i}` : ""}`} key={c.slug}>
                <div className="lp-clthumb" aria-hidden>
                  {[1, 2, 3, 4].map((n) => (
                    <span className="lp-clcell" key={n}>
                      <Image
                        src={`/showcase/clusters/${c.slug}-${n}.jpg`}
                        alt=""
                        width={420}
                        height={420}
                        loading="lazy"
                        sizes="170px"
                      />
                    </span>
                  ))}
                </div>
                <b>{c.label}</b>
                <div className="lp-meta">{c.meta}</div>
                {stats?.featuredClusters[c.label] ? (
                  <div className="lp-count">
                    {stats.featuredClusters[c.label].toLocaleString("pt-BR")} imóveis
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="lp-band lp-alt">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">comparação lado a lado</span>
            <h2>Nunca avalie um leilão sozinho</h2>
            <p>
              Para cada imóvel, a Lavra abre duas listas: <b>parecidos visualmente</b>, quando o
              modelo reconhece fachadas quase idênticas, e <b>equivalentes</b>, de mesma região e
              faixa de preço.
            </p>
          </div>

          <div className="lp-simseed lp-reveal">
            <div className="lp-simseed-photo">
              <Image
                src={SIMILAR_SEED.photo}
                alt={`Fachada do condomínio - ${SIMILAR_SEED.location}`}
                width={600}
                height={420}
                loading="lazy"
                sizes="(max-width: 700px) 100vw, 240px"
              />
            </div>
            <div className="lp-simseed-info">
              <span className="lp-seclabel lp-sc-lbl">
                Imóvel de referência · {SIMILAR_SEED.unit}
              </span>
              <b>{SIMILAR_SEED.title}</b>
              <span className="lp-loc">
                {SIMILAR_SEED.location} · {SIMILAR_SEED.areaM2.toLocaleString("pt-BR")} m² ·{" "}
                {SIMILAR_SEED.bedrooms} quartos
              </span>
              <div className="lp-simseed-foot">
                <div>
                  <span>Lance inicial · avaliado em {money(SIMILAR_SEED.appraisedValue)}</span>
                  <b>
                    {money(SIMILAR_SEED.saleValue)} <em>-{SIMILAR_SEED.discount}%</em>
                  </b>
                </div>
                <div className="lp-simcard-score">
                  <i>{SIMILAR_SEED.investment}</i>
                  <span>nota</span>
                </div>
              </div>
            </div>
          </div>

          <Rail label="Unidades parecidas com a de referência" className="lp-simrail">
            {SIMILAR.map((p) => (
              <article className="lp-simcard" key={p.slug}>
                <div className="lp-simcard-photo">
                  <Image
                    src={p.photo}
                    alt={`Fachada - ${p.title}, ${p.location}`}
                    width={600}
                    height={420}
                    loading="lazy"
                    sizes="(max-width: 700px) 78vw, 280px"
                  />
                  <span className={`lp-simkind${p.kind === "visual" ? " lp-visual" : ""}`}>
                    {p.kind === "equivalente" ? "Equivalente" : "Parecido visual"}
                  </span>
                  <span className="lp-simpct">{p.unit}</span>
                </div>
                <div className="lp-simcard-body">
                  <b>{p.title}</b>
                  <span className="lp-loc">
                    {p.location.split(" · ")[0]} · {p.areaM2.toLocaleString("pt-BR")} m²
                  </span>
                  <div className="lp-simcard-foot">
                    <div>
                      <span>Lance · -{p.discount}%</span>
                      <b>{money(p.saleValue)}</b>
                    </div>
                    <div className="lp-simcard-score">
                      <i>{p.investment}</i>
                      <span>nota</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </Rail>

          <p className="lp-simnote lp-reveal">
            Repare nos parecidos visualmente: fachadas praticamente idênticas e notas de{" "}
            <b>85 a 47</b>. O que separa um do outro é o preço - o de nota 85 sai 59% abaixo da
            avaliação; o de nota 52 só 41%, e custa quase o dobro.
          </p>
        </div>
      </section>

      <section className="lp-band lp-tint" id="casos">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">qual é o seu plano?</span>
            <h2>Cada objetivo pede uma nota diferente</h2>
            <p>
              A Lavra calcula uma nota de uso para cada objetivo de investimento. Escolha o seu e a
              lista inteira se reorganiza em volta dele.
            </p>
          </div>
          <div className="lp-personas lp-m-slide">
            <div className="lp-persona lp-reveal">
              <div className="lp-emo">
                <IconSliders />
              </div>
              <div>
                <h3>“Quero comprar mal cuidado, reformar e vender”</h3>
                <p>
                  Ordene pela nota de reforma e revenda: ela junta desconto sobre a avaliação, preço
                  frente ao mercado e a facilidade de revenda naquele bairro. Fachada em mau estado,
                  aqui, conta a favor.
                </p>
                <div className="lp-flow">
                  <span>desconto alto</span>
                  <span>potencial de obra</span>
                  <span>revenda rápida</span>
                </div>
              </div>
            </div>
            <div className="lp-persona lp-reveal lp-d1">
              <div className="lp-emo">
                <IconHouse />
              </div>
              <div>
                <h3>“Quero sair do aluguel pagando menos”</h3>
                <p>
                  A nota de moradia familiar cruza quartos e área com escolas, parques e
                  supermercados por perto. Você vê a região inteira antes de marcar a primeira
                  visita.
                </p>
                <div className="lp-flow">
                  <span>região completa</span>
                  <span>escolas perto</span>
                  <span>bom m²</span>
                </div>
              </div>
            </div>
            <div className="lp-persona lp-reveal">
              <div className="lp-emo">
                <IconChart />
              </div>
              <div>
                <h3>“Quero uma renda de aluguel”</h3>
                <p>
                  Compare a vocação de cada imóvel para temporada, aluguel estudantil ou moradia: a
                  Lavra mede hotéis, restaurantes e universidades no entorno, além da distância do
                  centro.
                </p>
                <div className="lp-flow">
                  <span>temporada</span>
                  <span>estudantil</span>
                  <span>alta demanda</span>
                </div>
              </div>
            </div>
            <div className="lp-persona lp-reveal lp-d1">
              <div className="lp-emo">
                <IconCalendar />
              </div>
              <div>
                <h3>“Não posso perder a data”</h3>
                <p>
                  Salve os critérios, escolha o aviso diário, semanal ou mensal e acompanhe as datas
                  dos seus favoritos na carteira.
                </p>
                <div className="lp-flow">
                  <span>alerta por e-mail</span>
                  <span>agenda de leilões</span>
                  <span>favoritos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-band" id="planos">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">planos</span>
            <h2>Escolha o plano que combina com o seu jogo</h2>
            <p>Comece de graça e evolua conforme suas oportunidades crescem.</p>
          </div>

          <div className="lp-plans-grid lp-m-slide">
            <div className="lp-plan lp-reveal">
              <div className="lp-phead">
                <span className="lp-pname">Grátis</span>
              </div>
              <div className="lp-price lp-free">
                <span className="lp-amt">R$ 0</span>
                <span className="lp-per">/mês</span>
              </div>
              <div className="lp-trial">Para começar a explorar</div>
              <ul>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  Navegue por anúncios e detalhes, filtros básicos e mapa
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <span>
                    <b>10 favoritos</b>, 1 busca salva e resumo diário
                  </span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <span>
                    <b>3 buscas semânticas</b> por mês
                  </span>
                </li>
              </ul>
              <button className="lp-pbtn" type="button">
                Começar grátis
              </button>
            </div>

            <div className="lp-plan lp-pop lp-reveal lp-d1">
              <span className="lp-poppill">Mais popular</span>
              <div className="lp-phead">
                <span className="lp-pname">Investidor</span>
              </div>
              <div className="lp-price">
                <span className="lp-amt">R$ 39</span>
                <span className="lp-per">/mês</span>
              </div>
              <div className="lp-trial">7 dias grátis</div>
              <ul>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <span>
                    <b>Busca semântica e agrupamentos ilimitados</b>
                  </span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <span>
                    <b>Alertas inteligentes</b> - matches ranqueados por relevância e ROI, buscas
                    salvas ilimitadas
                  </span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <span>
                    <b>Recomendações</b> - até 5 imóveis similares
                  </span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <span>Filtros avançados, favoritos ilimitados e indicadores de ROI</span>
                </li>
              </ul>
              <button className="lp-pbtn lp-solid" type="button">
                Iniciar teste de 7 dias
              </button>
            </div>

            <div className="lp-plan lp-reveal lp-d2">
              <div className="lp-phead">
                <span className="lp-pname">Profissional</span>
              </div>
              <div className="lp-price">
                <span className="lp-amt">R$ 79</span>
                <span className="lp-per">/mês</span>
              </div>
              <div className="lp-trial">Camada proativa para quem vive de leilão</div>
              <div className="lp-subnote">Tudo do Investidor, mais:</div>
              <ul>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <span>
                    <b>Vantagem de Largada</b> - alertas entregues primeiro aos Pros (acesso
                    antecipado)
                  </span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <span>
                    <b>Alertas proativos</b> - leilões prestes a encerrar, novos clusters
                    compatíveis e recomendações, automaticamente
                  </span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <span>
                    <b>Recomendações ampliadas</b> - até 10 imóveis similares (2x)
                  </span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <span>
                    <b>Agenda de Leilões</b> - calendário dos seus lotes salvos, com lembretes
                  </span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <span>
                    <b>Análise avançada de região</b> - DNA do bairro, POIs por perto, regiões
                    parecidas, melhor uso e preços regionais
                  </span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <span>
                    <b>Relatórios e exportação</b> (CSV/PDF)
                  </span>
                </li>
              </ul>
              <button className="lp-pbtn" type="button">
                Assinar Profissional
              </button>
            </div>
          </div>

          <div className="lp-apiplan lp-reveal">
            <div>
              <span className="lp-soon">Em breve</span>
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 5l-2 14" />
                </svg>{" "}
                Integração via API
              </h3>
              <p>
                Estamos desenvolvendo uma camada de integrações altamente personalizáveis para
                conectar a Lavra aos seus sistemas, fluxos e planilhas. Entre na lista de espera e
                ajude a moldar o que vem por aí.
              </p>
            </div>
            <ApiWaitlist />
          </div>

          <p className="lp-plans-note">Cancele quando quiser, direto no painel. Sem fidelidade.</p>
        </div>
      </section>

      <section className="lp-band lp-alt" id="faq">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">dúvidas</span>
            <h2>Perguntas frequentes</h2>
            <p>Como a Lavra calcula, de onde vêm os dados e o que a Lavra não faz.</p>
          </div>
          <div className="lp-faq lp-reveal">
            <details id="faq-nota" open>
              <summary>
                Como a nota é calculada?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  Cada imóvel recebe notas de 0 a 100, a partir de quatro blocos de dados: o{" "}
                  <b>preço</b> (desconto sobre a avaliação da Caixa e preço por m² frente a anúncios
                  reais do mercado aberto na mesma região), a <b>região</b> (distância real até
                  escolas, hospitais, supermercados, parques e outras categorias de ponto de
                  referência), as <b>características do imóvel</b> (tipo, área, quartos, vagas,
                  situação de ocupação) e a <b>facilidade de revenda</b> daquele tipo naquela
                  cidade.
                </p>
                <p>
                  Três coisas valem saber: as notas são <b>comparativas</b> - posicionam o imóvel em
                  relação aos outros da mesma cidade, é um ranking e não um selo de aprovação;{" "}
                  <b>não são caixa-preta</b> - toda nota abre a explicação fator a fator, o que
                  puxou para cima e o que puxou para baixo; e <b>os pesos mudam por tipo</b> -
                  moradia, terreno e comercial se valorizam de formas diferentes.
                </p>
              </div>
            </details>
            <details id="faq-relativa">
              <summary>
                O que quer dizer uma nota 87?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  Que o imóvel está à frente da maioria dos concorrentes diretos dele - imóveis do
                  mesmo tipo, na mesma cidade. As notas da Lavra são <b>relativas</b>: servem para
                  ranquear e comparar rapidamente, não para dizer que um negócio é bom em termos
                  absolutos. Uma nota 87 num mercado caro e uma nota 87 num mercado barato
                  significam a mesma coisa: “melhor que a maioria por perto”.
                </p>
              </div>
            </details>
            <details id="faq-garantia">
              <summary>
                A nota é garantia de bom negócio?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  Não, e nunca vai ser. A nota olha preço, região e características a partir de
                  dados públicos. Ela não lê o edital, não avalia a situação jurídica, não sabe de
                  dívida de condomínio, de ação judicial nem do custo real de desocupação. Antes de
                  dar lance, leia o edital e, se possível, consulte um advogado. A decisão continua
                  sendo sua.
                </p>
              </div>
            </details>
            <details id="faq-caixa">
              <summary>
                A Lavra é ligada à Caixa?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  Não. A Lavra é independente. Os imóveis vêm da base pública de leilões e venda
                  direta da Caixa Econômica Federal, que a Lavra coleta, organiza e analisa. Não
                  somos afiliados, patrocinados nem endossados pela Caixa, não intermediamos lances
                  e não recebemos comissão sobre arremates. O lance é dado sempre no canal oficial
                  da Caixa.
                </p>
              </div>
            </details>
            <details id="faq-dados">
              <summary>
                De onde vêm os dados?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  De três fontes, todas públicas ou licenciadas.{" "}
                  <b>Imóveis, valores de avaliação, lances e datas</b>: base pública de leilões e
                  venda direta da Caixa. <b>Pontos de referência e distâncias</b>: bases abertas de
                  mapas. <b>Preço de mercado</b>: anúncios reais de imóveis parecidos em portais do
                  mercado aberto - portais de leilão ficam de fora de propósito, para a comparação
                  ser sempre com o mercado normal.
                </p>
              </div>
            </details>
            <details id="faq-mercado">
              <summary>
                Como vocês sabem se o preço está bom?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  O desconto sobre a avaliação é só metade da história: ele compara o lance com o
                  valor que a própria Caixa avaliou. A outra metade é o mercado - a Lavra calcula o
                  preço <b>mediano</b> por m² de imóveis parecidos anunciados na mesma região (a
                  mediana evita que um anúncio fora da curva distorça tudo) e refina comparando só
                  área e número de quartos semelhantes. Quando há poucos anúncios, a estimativa se
                  apoia numa área maior e a Lavra reduz a confiança daquele número.
                </p>
              </div>
            </details>
            <details id="faq-atualizacao">
              <summary>
                Com que frequência os dados são atualizados?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  Diariamente. Novos imóveis entram, arrematados saem e as notas são recalculadas
                  para refletir a base ativa daquele dia. Com uma conta, você pode salvar buscas e
                  receber por e-mail o que apareceu de novo, no ritmo que escolher: diário, semanal
                  ou mensal.
                </p>
              </div>
            </details>
            <details id="faq-sumiu">
              <summary>
                Por que um imóvel que eu vi sumiu?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  Porque a oferta da Caixa muda todo dia. Um imóvel pode ser arrematado, ter o
                  leilão suspenso, mudar de modalidade ou simplesmente sair da lista entre uma
                  atualização e outra. Quando isso acontece, a Lavra marca o anúncio como inativo em
                  vez de apagá-lo.
                </p>
              </div>
            </details>
            <details id="faq-faltando">
              <summary>
                Por que um imóvel sem foto ou sem área tem nota mais baixa?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  Nas notas de uso (moradia, temporada, estudantil, reforma, comercial, liquidez),
                  um dado que falta é simplesmente ignorado - ele não vira ponto negativo. Já na{" "}
                  <b>nota geral de investimento</b>, faltar informação reduz a nota: com menos
                  dados, há menos certeza sobre o imóvel.
                </p>
              </div>
            </details>
            <details id="faq-leigo">
              <summary>
                Preciso entender de leilão para usar?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  Não. Você descreve o que procura em português comum - “apartamento de 2 quartos
                  até R$ 150 mil no Rio, perto de metrô” - e a Lavra traduz isso em filtros e notas.
                  Para dar o lance, aí sim vale estudar o edital: é lá que estão as regras de
                  pagamento, as dívidas que acompanham o imóvel e a situação de ocupação.
                </p>
              </div>
            </details>
            <details id="faq-preco">
              <summary>
                Quanto custa?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  Explorar a base, ver todas as notas e abrir a leitura de região é gratuito e não
                  exige cadastro. Uma conta grátis libera favoritos, uma busca salva e resumo por
                  e-mail. Os planos pagos liberam buscas em linguagem natural sem limite, alertas
                  configuráveis, comparação ampliada e a análise completa de região.
                </p>
              </div>
            </details>
          </div>
        </div>
      </section>

      <section className="lp-band lp-ctaband">
        <div className="lp-wrap">
          <div className="lp-inner lp-reveal">
            <div className="lp-hexfield" aria-hidden="true">
              <svg preserveAspectRatio="xMidYMax slice" viewBox="0 0 1200 400">
                <rect width="1200" height="400" fill="url(#hexes)" />
                <g strokeWidth="1.2">
                  <polygon
                    className="lp-hex"
                    points="600,242 648,269 648,329 600,356 552,329 552,269"
                    fillOpacity="0.14"
                  />
                  <polygon
                    className="lp-hex"
                    points="500,300 548,327 548,387 500,414 452,387 452,327"
                    fillOpacity="0.08"
                  />
                  <polygon
                    className="lp-hex"
                    points="700,300 748,327 748,387 700,414 652,387 652,327"
                    fillOpacity="0.08"
                  />
                </g>

                <g className="lp-cta-house">
                  <rect x="70" y="320" width="60" height="80" rx="3" />
                  <path d="M160 350 200 322 240 350 240 400 160 400z" />
                  <rect x="270" y="300" width="54" height="100" rx="3" />
                  <path d="M360 356 396 330 432 356 432 400 360 400z" />
                  <rect x="470" y="330" width="48" height="70" rx="3" />
                  <path d="M770 352 806 326 842 352 842 400 770 400z" />
                  <rect x="880" y="310" width="56" height="90" rx="3" />
                  <path d="M970 348 1006 322 1042 348 1042 400 970 400z" />
                  <rect x="1080" y="330" width="52" height="70" rx="3" />
                </g>
              </svg>
            </div>
            <h2>Descreva o imóvel dos seus planos. Nós achamos o leilão.</h2>
            <p>
              Explore milhares de leilões já analisados por preço, região e potencial - e decida com
              números claros do seu lado.
            </p>
            <div className="lp-row">
              <Link className="lp-btn lp-solid lp-big" href="/dashboard">
                Explorar imóveis
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14m0 0-6-6m6 6-6 6" />
                </svg>
              </Link>
              <a className="lp-btn lp-ghost lp-big" href="#faq-nota">
                Como a nota é calculada
              </a>
            </div>
            <div className="lp-fine">Acesso aberto durante a fase experimental - sem cadastro.</div>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap">
          <a className="lp-brand" href="#top">
            <span className="lp-mark">
              <svg viewBox="0 0 48 48" width="24" height="24" aria-hidden="true">
                <circle cx="14" cy="9" r="3" fill="currentColor" />
                <path
                  d="M14 15v15a4 4 0 0 0 4 4h13"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M27 27.5 34 34l-7 6.5"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </span>
            <span>
              <b>Lavra</b>
              <small>Leilões inteligentes</small>
            </span>
          </a>
          <div className="lp-links">
            <a href="#recursos">Recursos</a>
            <a href="#exemplo">Exemplo real</a>
            <a href="#casos">Casos de uso</a>
            <a href="#faq">Dúvidas</a>
          </div>
          <span className="lp-fine">
            © 2026 Lavra · Dados da base pública de imóveis da Caixa Econômica Federal, atualizados
            diariamente. A Lavra não é afiliada, patrocinada nem endossada pela Caixa e não
            intermedeia lances. As notas são estimativas comparativas, não recomendação de
            investimento.
          </span>
        </div>
      </footer>
      <LandingEffects />
    </>
  );
}
