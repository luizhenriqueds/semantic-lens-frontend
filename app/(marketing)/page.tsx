import Link from "next/link";
import LandingEffects from "@/app/(marketing)/_components/LandingEffects";
import ApiWaitlist from "@/app/(marketing)/_components/ApiWaitlist";
import { getUser } from "@/lib/supabase/server";

export default async function LandingPage() {
  const { user } = await getUser();
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
              <a className="lp-m-hide" href="#painel">
                O painel
              </a>
              <a href="#analise">Como funciona</a>
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
            <span className="lp-eyebrow">
              <span className="lp-tag">Novo</span> Leilões de imóveis, analisados um a um
            </span>
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
              A Lavra reúne milhares de leilões em um painel só e dá a cada imóvel notas fáceis de
              comparar - preço, região e potencial. Você descreve o que procura; a gente encontra a
              oportunidade.
            </p>
            <div className="lp-actions">
              <Link className="lp-btn lp-solid lp-big" href="/dashboard">
                Explorar imóveis
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14m0 0-6-6m6 6-6 6" />
                </svg>
              </Link>
              <a className="lp-btn lp-ghost lp-big" href="#analise">
                Como funciona a análise
              </a>
            </div>
            <div className="lp-micro">
              <span className="lp-mono">378</span> imóveis analisados ·{" "}
              <span className="lp-mono">19</span> estados ·{" "}
              <span className="lp-mono">400 mil+</span> POIs no Brasil todo
            </div>
          </div>

          <div className="lp-heromock lp-reveal" aria-hidden="true">
            <div className="lp-photo">
              <span className="lp-disc">40% abaixo da avaliação</span>
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
                <span>🏠 Moradia 88</span>
                <span>💰 Liquidez 81</span>
              </div>
            </div>
            <div className="lp-mrow">
              <div className="lp-info">
                <b>Apartamento 72 m²</b>
                <span className="lp-loc">Vila Mariana · São Paulo, SP</span>
              </div>
              <div className="lp-price">
                <div className="lp-now">R$ 312.000</div>
                <div className="lp-was">R$ 520.000</div>
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
                <text x="28" y="33" textAnchor="middle" fontSize="17">
                  87
                </text>
              </svg>
              <div className="lp-lbl">
                Nota de Investimento<b>Melhor que 87% dos imóveis semelhantes</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="lp-trust">
        <div className="lp-wrap">
          <span className="lp-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="m5 13 4 4L19 7" />
            </svg>
            <span>
              <b>Sem cadastro</b> para explorar
            </span>
          </span>
          <span className="lp-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M8 4h9a1 1 0 0 1 1 1v15l-5-3-5 3V5a1 1 0 0 1 1-1z" />
            </svg>
            <span>
              <b>Editais públicos</b>, sempre atualizados
            </span>
          </span>
          <span className="lp-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 16v-4m0-4h.01" />
            </svg>
            <span>
              <b>Notas explicáveis</b>, sem caixa-preta
            </span>
          </span>
          <span className="lp-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 3v18h18" />
              <path d="M7 13l3-3 3 2 5-5" />
            </svg>
            <span>
              Comparados com o <b>mercado aberto</b>
            </span>
          </span>
        </div>
      </div>

      <section className="lp-band">
        <div className="lp-wrap">
          <div className="lp-unique lp-reveal">
            <svg
              className="lp-uhexes"
              viewBox="0 0 600 300"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <polygon points="540,40 572,58 572,94 540,112 508,94 508,58" opacity="0.06" />
              <polygon points="500,110 532,128 532,164 500,182 468,164 468,128" opacity="0.05" />
              <polygon points="580,110 612,128 612,164 580,182 548,164 548,128" opacity="0.04" />
            </svg>
            <div className="lp-u-head">
              <span className="lp-upill">Novidade</span>
              <h2>
                A primeira base de leilões que entende <u>linguagem</u> e <u>geografia</u>
              </h2>
              <p>
                Milhares de imóveis organizados por significado e por lugar - uma combinação que
                nenhum outro portal de leilões do Brasil oferece.
              </p>
            </div>
            <div className="lp-unique-pillars">
              <div className="lp-upillar">
                <span className="lp-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 5h16v10H9l-4 4z" />
                    <path d="M8 9h8M8 12h5" />
                  </svg>
                </span>
                <div>
                  <b>Base semântica</b>
                  <span>
                    Descreva em português; a Lavra combina significado e palavras-chave (busca
                    híbrida) e ranqueia por afinidade, não só por palavra-chave.
                  </span>
                </div>
              </div>
              <div className="lp-upillar">
                <span className="lp-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <div>
                  <b>Base geográfica</b>
                  <span>
                    <b>Mais de 400 mil POIs</b> mapeados em todo o Brasil. Cada imóvel é lido por
                    células hexagonais, com densidade de serviços, qualidade do entorno e as
                    distâncias que importam.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-band" id="recursos">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">// recursos exclusivos da Lavra</span>
            <h2>Tudo o que você precisa para decidir com confiança</h2>
            <p>Da busca à hora do lance, cada etapa fica mais simples - e mais clara.</p>
          </div>

          <div className="lp-stack lp-m-slide">
            <div className="lp-layer">
              <div className="lp-lcard">
                <div className="lp-lbody">
                  <span className="lp-lindex">
                    <i>1</i> busca em português
                  </span>
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
                  <span className="lp-badge-prop">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>{" "}
                    Algoritmo proprietário
                  </span>
                  <span className="lp-lindex">
                    <i>2</i> nota de investimento
                  </span>
                  <h3>Uma nota, calibrada pelo nosso algoritmo</h3>
                  <p>
                    O modelo proprietário da Lavra combina desconto, preço de mercado, qualidade da
                    região e liquidez em uma nota de 0 a 100 - sempre com o “porquê” aberto.
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
                      Explicação fator a fator, nada de caixa-preta
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
                        data-off="18.8"
                        transform="rotate(-90 28 28)"
                      />
                      <text x="28" y="33" textAnchor="middle" fontSize="16">
                        87
                      </text>
                    </svg>
                    <div className="lp-info">
                      <b>Apartamento 72 m² · Vila Mariana</b>
                      <span>Lance R$ 312.000 · Avaliação R$ 520.000</span>
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
                  <span className="lp-badge-prop">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" />
                    </svg>{" "}
                    Visão computacional
                  </span>
                  <span className="lp-lindex">
                    <i>3</i> score visual por IA
                  </span>
                  <h3>Modelos de IA avaliam a cara do imóvel</h3>
                  <p>
                    A partir das fotos, nossos modelos estimam a <b>qualidade da fachada</b> e a{" "}
                    <b>idade aparente</b> do imóvel - sinais que ajudam a prever conservação e custo
                    de reforma.
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
                      Idade estimada para dimensionar a reforma
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
                    <svg
                      className="lp-photo-illus2"
                      viewBox="0 0 320 156"
                      preserveAspectRatio="xMidYMid slice"
                    >
                      <path
                        className="lp-il-ground"
                        d="M0 120 C 90 108, 200 128, 320 116 L320 156 L0 156 Z"
                      />
                      <rect
                        className="lp-il-tree-trunk"
                        x="286"
                        y="92"
                        width="8"
                        height="30"
                        rx="2"
                      />
                      <circle className="lp-il-tree-top" cx="290" cy="84" r="18" />
                      <polygon className="lp-il-roof" points="120,52 210,52 232,86 98,86" />
                      <rect className="lp-il-wall" x="122" y="86" width="86" height="34" />
                      <rect className="lp-il-door" x="152" y="100" width="22" height="20" rx="1" />
                      <rect className="lp-il-win" x="132" y="94" width="14" height="14" rx="1.5" />
                      <rect className="lp-il-win" x="184" y="94" width="14" height="14" rx="1.5" />
                    </svg>
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
                      <div className="lp-k">Idade estimada</div>
                      <div className="lp-v">
                        ~15<small> anos</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-layer">
              <div className="lp-lcard">
                <div className="lp-lbody">
                  <span className="lp-lindex">
                    <i>4</i> alertas inteligentes
                  </span>
                  <h3>A oportunidade chega até você</h3>
                  <p>
                    Salve o que procura e a Lavra te avisa <b>na hora</b> em que um imóvel
                    compatível entra - por e-mail, WhatsApp ou push. Sem ficar atualizando a página.
                  </p>
                  <ul className="lp-lpoints">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Disparo automático quando surge um match
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Datas de praça dos favoritos no calendário
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
                      <span className="lp-when">agora</span>
                    </div>
                    <div className="lp-msg">
                      <b>Nova oportunidade!</b> Casa 110 m² · Saúde - nota 87, 40% abaixo da
                      avaliação. 1ª praça em 12 dias.
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
                          <path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 20l1.5-5.5A8.5 8.5 0 1 1 21 11.5z" />
                        </svg>{" "}
                        WhatsApp
                      </span>
                      <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                        </svg>{" "}
                        Push
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-band lp-alt lp-m-hide" id="painel">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">// o produto por dentro</span>
            <h2>Um painel feito para explorar leilões</h2>
            <p>
              Imóveis, grupos de oportunidades e regiões - explore tudo em um painel só, sempre
              reordenado por relevância a cada busca.
            </p>
          </div>

          <div className="lp-appframe lp-reveal lp-d1">
            <div className="lp-winbar">
              <span className="lp-dots">
                <i></i>
                <i></i>
                <i></i>
              </span>
              <span className="lp-url" id="appurl">
                app.lavra.com.br/imoveis
              </span>
            </div>
            <div className="lp-appui">
              <aside className="lp-appside">
                <div className="lp-brand2">
                  <span className="lp-mk">
                    <svg viewBox="0 0 48 48" width="20" height="20">
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
                </div>
                <div className="lp-nlabel">Menu</div>
                <div className="lp-nav2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 11 12 4l9 7" />
                    <path d="M5 10v10h14V10" />
                  </svg>{" "}
                  Início
                </div>
                <div className="lp-nav2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.2-3.2" />
                  </svg>{" "}
                  Buscar imóveis
                </div>
                <div className="lp-nav2 lp-on" data-nav="0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 21V9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3" />
                  </svg>{" "}
                  Imóveis
                </div>
                <div className="lp-nav2" data-nav="1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="4" y="4" width="7" height="7" rx="1" />
                    <rect x="13" y="4" width="7" height="7" rx="1" />
                    <rect x="4" y="13" width="7" height="7" rx="1" />
                    <rect x="13" y="13" width="7" height="7" rx="1" />
                  </svg>{" "}
                  Grupos
                </div>
                <div className="lp-nav2" data-nav="2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>{" "}
                  Regiões
                </div>
                <div className="lp-nav2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                  </svg>{" "}
                  Alertas
                </div>
                <div className="lp-nav2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z" />
                  </svg>{" "}
                  Minha carteira
                </div>
              </aside>

              <div className="lp-appmainwrap">
                <div className="lp-apptrack" id="apptrack">
                  <div className="lp-appmain lp-appslide">
                    <div className="lp-apptop">
                      <div className="lp-appsearch">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="11" cy="11" r="7" />
                          <path d="m20 20-3.2-3.2" />
                        </svg>
                        <span className="lp-txt">casa 3 quartos com quintal perto de escola</span>
                      </div>
                      <div className="lp-ticons">
                        <i>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
                          </svg>
                        </i>
                        <i>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                          </svg>
                        </i>
                      </div>
                      <span className="lp-avatar">LQ</span>
                    </div>

                    <div className="lp-apptoolbar">
                      <span className="lp-crumb">
                        Imóveis <b>· 1.240 encontrados</b>
                      </span>
                      <span className="lp-sortsel">
                        Ordenar: Relevância{" "}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                    <div className="lp-appchips">
                      <span>São Paulo, SP</span>
                      <span>Casa</span>
                      <span>3+ quartos</span>
                      <span>até R$ 400 mil</span>
                      <span className="lp-muted">+ Perto de: escola</span>
                    </div>
                    <div className="lp-relnote">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0-3 3m3-3 3 3" />
                      </svg>
                      <span>
                        <b>Reordenado por relevância</b> a cada busca - algoritmo especializado da
                        Lavra coloca as melhores oportunidades no topo.
                      </span>
                    </div>

                    <div className="lp-appgrid">
                      <article className="lp-appcard">
                        <div className="lp-ap-photo">
                          <span className="lp-ap-type">Casa</span>
                          <span className="lp-ap-disc">−40%</span>
                          <span className="lp-ap-fav">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
                            </svg>
                          </span>
                          <svg
                            className="lp-photo-illus2"
                            viewBox="0 0 284 150"
                            preserveAspectRatio="xMidYMid slice"
                          >
                            <polygon
                              className="lp-il-hex"
                              points="250,20 262,27 262,41 250,48 238,41 238,27"
                            />
                            <path
                              className="lp-il-ground"
                              d="M0 116 C 80 106, 180 126, 284 112 L284 150 L0 150 Z"
                            />
                            <rect
                              className="lp-il-tree-trunk"
                              x="44"
                              y="86"
                              width="7"
                              height="28"
                              rx="2"
                            />
                            <circle className="lp-il-tree-top" cx="47.5" cy="80" r="16" />
                            <polygon className="lp-il-roof" points="108,50 176,50 194,78 90,78" />
                            <rect className="lp-il-wall" x="112" y="78" width="60" height="36" />
                            <rect
                              className="lp-il-door"
                              x="133"
                              y="94"
                              width="18"
                              height="20"
                              rx="1"
                            />
                            <rect
                              className="lp-il-win"
                              x="120"
                              y="84"
                              width="11"
                              height="11"
                              rx="1.5"
                            />
                            <rect
                              className="lp-il-win"
                              x="153"
                              y="84"
                              width="11"
                              height="11"
                              rx="1.5"
                            />
                          </svg>
                        </div>
                        <div className="lp-ap-body">
                          <b>Casa 110 m²</b>
                          <div className="lp-ap-loc">Saúde · São Paulo/SP</div>
                          <div className="lp-ap-facts">
                            <span>
                              <b>110</b> m²
                            </span>
                            <span>
                              <b>3</b> quartos
                            </span>
                          </div>
                          <div className="lp-ap-price">
                            <div className="lp-now">R$ 385.000</div>
                            <div className="lp-was">avaliado em R$ 640.000</div>
                          </div>
                          <div className="lp-ap-score">
                            <svg className="lp-ring" width="42" height="42" viewBox="0 0 42 42">
                              <circle className="lp-track" cx="21" cy="21" r="16" strokeWidth="5" />
                              <circle
                                className="lp-bar"
                                cx="21"
                                cy="21"
                                r="16"
                                strokeWidth="5"
                                strokeDasharray="100.5"
                                strokeDashoffset="100.5"
                                data-off="13.1"
                                transform="rotate(-90 21 21)"
                              />
                              <text x="21" y="25" textAnchor="middle" fontSize="13">
                                87
                              </text>
                            </svg>
                            <div className="lp-ap-goals">
                              <span className="lp-k">Ideal para</span>
                              <span className="lp-gp lp-on">Moradia</span>
                              <span className="lp-gp">Reforma</span>
                            </div>
                          </div>
                        </div>
                      </article>

                      <article className="lp-appcard">
                        <div className="lp-ap-photo">
                          <span className="lp-ap-type">Apartamento</span>
                          <span className="lp-ap-disc">−40%</span>
                          <span className="lp-ap-fav">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
                            </svg>
                          </span>
                          <svg
                            className="lp-photo-illus2"
                            viewBox="0 0 284 150"
                            preserveAspectRatio="xMidYMid slice"
                          >
                            <polygon
                              className="lp-il-hex"
                              points="40,22 52,29 52,43 40,50 28,43 28,29"
                            />
                            <path
                              className="lp-il-ground"
                              d="M0 118 C 90 108, 190 128, 284 114 L284 150 L0 150 Z"
                            />
                            <rect
                              className="lp-il-tree-trunk"
                              x="228"
                              y="84"
                              width="7"
                              height="30"
                              rx="2"
                            />
                            <circle className="lp-il-tree-top" cx="231.5" cy="78" r="17" />
                            <rect
                              className="lp-il-roof-soft"
                              x="104"
                              y="42"
                              width="70"
                              height="72"
                              rx="3"
                            />
                            <g className="lp-il-win">
                              <rect x="114" y="52" width="12" height="12" rx="1.5" />
                              <rect x="133" y="52" width="12" height="12" rx="1.5" />
                              <rect x="152" y="52" width="12" height="12" rx="1.5" />
                              <rect x="114" y="70" width="12" height="12" rx="1.5" />
                              <rect x="133" y="70" width="12" height="12" rx="1.5" />
                              <rect x="152" y="70" width="12" height="12" rx="1.5" />
                              <rect x="114" y="88" width="12" height="12" rx="1.5" />
                              <rect x="133" y="88" width="12" height="12" rx="1.5" />
                              <rect x="152" y="88" width="12" height="12" rx="1.5" />
                            </g>
                          </svg>
                        </div>
                        <div className="lp-ap-body">
                          <b>Apartamento 72 m²</b>
                          <div className="lp-ap-loc">Vila Mariana · São Paulo/SP</div>
                          <div className="lp-ap-facts">
                            <span>
                              <b>72</b> m²
                            </span>
                            <span>
                              <b>2</b> quartos
                            </span>
                          </div>
                          <div className="lp-ap-price">
                            <div className="lp-now">R$ 312.000</div>
                            <div className="lp-was">avaliado em R$ 520.000</div>
                          </div>
                          <div className="lp-ap-score">
                            <svg className="lp-ring" width="42" height="42" viewBox="0 0 42 42">
                              <circle className="lp-track" cx="21" cy="21" r="16" strokeWidth="5" />
                              <circle
                                className="lp-bar"
                                cx="21"
                                cy="21"
                                r="16"
                                strokeWidth="5"
                                strokeDasharray="100.5"
                                strokeDashoffset="100.5"
                                data-off="16.1"
                                transform="rotate(-90 21 21)"
                              />
                              <text x="21" y="25" textAnchor="middle" fontSize="13">
                                84
                              </text>
                            </svg>
                            <div className="lp-ap-goals">
                              <span className="lp-k">Ideal para</span>
                              <span className="lp-gp lp-on">Moradia</span>
                              <span className="lp-gp">Temporada</span>
                            </div>
                          </div>
                        </div>
                      </article>

                      <article className="lp-appcard">
                        <div className="lp-ap-photo">
                          <span className="lp-ap-type">Sobrado</span>
                          <span className="lp-ap-disc">−37%</span>
                          <span className="lp-ap-fav">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
                            </svg>
                          </span>
                          <svg
                            className="lp-photo-illus2"
                            viewBox="0 0 284 150"
                            preserveAspectRatio="xMidYMid slice"
                          >
                            <polygon
                              className="lp-il-hex"
                              points="250,20 262,27 262,41 250,48 238,41 238,27"
                            />
                            <path
                              className="lp-il-ground"
                              d="M0 116 C 80 106, 180 126, 284 112 L284 150 L0 150 Z"
                            />
                            <rect
                              className="lp-il-tree-trunk"
                              x="44"
                              y="86"
                              width="7"
                              height="28"
                              rx="2"
                            />
                            <circle className="lp-il-tree-top" cx="47.5" cy="80" r="16" />
                            <polygon className="lp-il-roof" points="108,50 176,50 194,78 90,78" />
                            <rect className="lp-il-wall" x="112" y="78" width="60" height="36" />
                            <rect
                              className="lp-il-door"
                              x="133"
                              y="94"
                              width="18"
                              height="20"
                              rx="1"
                            />
                            <rect
                              className="lp-il-win"
                              x="120"
                              y="84"
                              width="11"
                              height="11"
                              rx="1.5"
                            />
                            <rect
                              className="lp-il-win"
                              x="153"
                              y="84"
                              width="11"
                              height="11"
                              rx="1.5"
                            />
                          </svg>
                        </div>
                        <div className="lp-ap-body">
                          <b>Sobrado 96 m²</b>
                          <div className="lp-ap-loc">Jabaquara · São Paulo/SP</div>
                          <div className="lp-ap-facts">
                            <span>
                              <b>96</b> m²
                            </span>
                            <span>
                              <b>3</b> quartos
                            </span>
                          </div>
                          <div className="lp-ap-price">
                            <div className="lp-now">R$ 298.000</div>
                            <div className="lp-was">avaliado em R$ 470.000</div>
                          </div>
                          <div className="lp-ap-score">
                            <svg className="lp-ring" width="42" height="42" viewBox="0 0 42 42">
                              <circle className="lp-track" cx="21" cy="21" r="16" strokeWidth="5" />
                              <circle
                                className="lp-bar"
                                cx="21"
                                cy="21"
                                r="16"
                                strokeWidth="5"
                                strokeDasharray="100.5"
                                strokeDashoffset="100.5"
                                data-off="20.1"
                                transform="rotate(-90 21 21)"
                              />
                              <text x="21" y="25" textAnchor="middle" fontSize="13">
                                80
                              </text>
                            </svg>
                            <div className="lp-ap-goals">
                              <span className="lp-k">Ideal para</span>
                              <span className="lp-gp lp-on">Reforma</span>
                              <span className="lp-gp">Estudantil</span>
                            </div>
                          </div>
                        </div>
                      </article>
                    </div>
                  </div>

                  <div className="lp-appmain lp-appslide">
                    <div className="lp-apptop">
                      <div className="lp-appsearch">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="11" cy="11" r="7" />
                          <path d="m20 20-3.2-3.2" />
                        </svg>
                        <span className="lp-txt">apartamentos populares de alta liquidez</span>
                      </div>
                      <div className="lp-ticons">
                        <i>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
                          </svg>
                        </i>
                        <i>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                          </svg>
                        </i>
                      </div>
                      <span className="lp-avatar">LQ</span>
                    </div>
                    <div className="lp-apptoolbar">
                      <span className="lp-crumb">
                        Grupos <b>· 48 segmentos</b>
                      </span>
                      <span className="lp-sortsel">
                        Ordenar: Liquidez{" "}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                    <div className="lp-appclusters">
                      <div className="lp-gcard">
                        <div className="lp-ghex">
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.85"
                            />
                          </svg>
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.5"
                            />
                          </svg>
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.3"
                            />
                          </svg>
                        </div>
                        <b>Apartamentos populares de alta liquidez</b>
                        <div className="lp-gmeta">São Paulo, SP · 1–2 quartos</div>
                        <div className="lp-gcount">1.240 imóveis</div>
                      </div>
                      <div className="lp-gcard">
                        <div className="lp-ghex">
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.85"
                            />
                          </svg>
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.5"
                            />
                          </svg>
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.3"
                            />
                          </svg>
                        </div>
                        <b>Terrenos compactos de valor médio</b>
                        <div className="lp-gmeta">Grande São Paulo</div>
                        <div className="lp-gcount">380 imóveis</div>
                      </div>
                      <div className="lp-gcard">
                        <div className="lp-ghex">
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.85"
                            />
                          </svg>
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.5"
                            />
                          </svg>
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.3"
                            />
                          </svg>
                        </div>
                        <b>Sobrados para reforma e revenda</b>
                        <div className="lp-gmeta">Zona Sul, SP</div>
                        <div className="lp-gcount">156 imóveis</div>
                      </div>
                      <div className="lp-gcard">
                        <div className="lp-ghex">
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.85"
                            />
                          </svg>
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.5"
                            />
                          </svg>
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.3"
                            />
                          </svg>
                        </div>
                        <b>Kitnets perto de universidades</b>
                        <div className="lp-gmeta">São Paulo, SP</div>
                        <div className="lp-gcount">92 imóveis</div>
                      </div>
                      <div className="lp-gcard">
                        <div className="lp-ghex">
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.85"
                            />
                          </svg>
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.5"
                            />
                          </svg>
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.3"
                            />
                          </svg>
                        </div>
                        <b>Casas familiares com quintal</b>
                        <div className="lp-gmeta">Região do ABC</div>
                        <div className="lp-gcount">214 imóveis</div>
                      </div>
                      <div className="lp-gcard">
                        <div className="lp-ghex">
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.85"
                            />
                          </svg>
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.5"
                            />
                          </svg>
                          <svg viewBox="0 0 26 30">
                            <polygon
                              className="lp-hf"
                              points="13,1 25,8 25,22 13,29 1,22 1,8"
                              fillOpacity="0.3"
                            />
                          </svg>
                        </div>
                        <b>Salas comerciais de alta liquidez</b>
                        <div className="lp-gmeta">Centro, SP</div>
                        <div className="lp-gcount">128 imóveis</div>
                      </div>
                    </div>
                  </div>

                  <div className="lp-appmain lp-appslide">
                    <div className="lp-apptop">
                      <div className="lp-appsearch">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="11" cy="11" r="7" />
                          <path d="m20 20-3.2-3.2" />
                        </svg>
                        <span className="lp-txt">Centro, São Paulo</span>
                      </div>
                      <div className="lp-ticons">
                        <i>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
                          </svg>
                        </i>
                        <i>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                          </svg>
                        </i>
                      </div>
                      <span className="lp-avatar">LQ</span>
                    </div>
                    <div className="lp-apptoolbar">
                      <span className="lp-crumb">
                        Regiões <b>· Centro, SP</b>
                      </span>
                      <span className="lp-propill">⚡ Recurso Pro</span>
                    </div>
                    <div className="lp-appregion3">
                      <div className="lp-rcard">
                        <div className="lp-rcard-h">1 · Perfil da região</div>
                        <div className="lp-rscores">
                          <div className="lp-rrow">
                            <div className="lp-rt">
                              <span>Temporada</span>
                              <b>99</b>
                            </div>
                            <div className="lp-rtrack">
                              <i style={{ width: "99%" }}></i>
                            </div>
                          </div>
                          <div className="lp-rrow">
                            <div className="lp-rt">
                              <span>Comercial</span>
                              <b>99</b>
                            </div>
                            <div className="lp-rtrack">
                              <i style={{ width: "99%" }}></i>
                            </div>
                          </div>
                          <div className="lp-rrow">
                            <div className="lp-rt">
                              <span>Caminhabilidade</span>
                              <b>98</b>
                            </div>
                            <div className="lp-rtrack">
                              <i style={{ width: "98%" }}></i>
                            </div>
                          </div>
                          <div className="lp-rrow">
                            <div className="lp-rt">
                              <span>Conveniência</span>
                              <b>98</b>
                            </div>
                            <div className="lp-rtrack">
                              <i style={{ width: "98%" }}></i>
                            </div>
                          </div>
                          <div className="lp-rrow">
                            <div className="lp-rt">
                              <span>Familiar</span>
                              <b>97</b>
                            </div>
                            <div className="lp-rtrack">
                              <i style={{ width: "97%" }}></i>
                            </div>
                          </div>
                          <div className="lp-rrow">
                            <div className="lp-rt">
                              <span>Estudantil</span>
                              <b>97</b>
                            </div>
                            <div className="lp-rtrack">
                              <i style={{ width: "97%" }}></i>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="lp-rcard">
                        <div className="lp-rcard-h">2 · O que existe por perto</div>
                        <div className="lp-rpois">
                          <div className="lp-rpoi">
                            <i>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M3 9l9-4 9 4-9 4-9-4z" />
                                <path d="M7 11v4c0 1.5 2.5 3 5 3s5-1.5 5-3v-4" />
                              </svg>
                            </i>
                            <div>
                              <b>Universidade</b>
                              <span>327 m</span>
                            </div>
                          </div>
                          <div className="lp-rpoi">
                            <i>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="4" y="4" width="16" height="16" rx="2" />
                                <path d="M12 8v8M8 12h8" />
                              </svg>
                            </i>
                            <div>
                              <b>Hospital</b>
                              <span>601 m</span>
                            </div>
                          </div>
                          <div className="lp-rpoi">
                            <i>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="9" cy="20" r="1" />
                                <circle cx="17" cy="20" r="1" />
                                <path d="M3 4h2l2.2 11h10l1.8-8H6.5" />
                              </svg>
                            </i>
                            <div>
                              <b>Supermercado</b>
                              <span>451 m</span>
                            </div>
                          </div>
                          <div className="lp-rpoi">
                            <i>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M6 8h12l-1 12H7z" />
                                <path d="M9 8a3 3 0 0 1 6 0" />
                              </svg>
                            </i>
                            <div>
                              <b>Shopping</b>
                              <span>354 m</span>
                            </div>
                          </div>
                          <div className="lp-rpoi">
                            <i>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M12 3l5 8h-3l3 5H7l3-5H7z" />
                                <path d="M12 16v5" />
                              </svg>
                            </i>
                            <div>
                              <b>Parque</b>
                              <span>182 m</span>
                            </div>
                          </div>
                          <div className="lp-rpoi">
                            <i>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M6 3v7a2 2 0 0 0 2 2v9M6 3v5M9 3v5M17 3c-1.5 0-2 2-2 5s.5 4 2 4v9" />
                              </svg>
                            </i>
                            <div>
                              <b>Restaurante</b>
                              <span>44 m</span>
                            </div>
                          </div>
                        </div>
                        <div className="lp-rnote">Distância até o serviço mais próximo.</div>
                      </div>
                      <div className="lp-rcard">
                        <div className="lp-rcard-h">3 · DNA da região</div>
                        <div className="lp-rdnalabel">Perfil predominante</div>
                        <div className="lp-rchips">
                          <span>Airbnb</span>
                          <span>Comercial</span>
                        </div>
                        <div className="lp-rstar">
                          <span>Conveniência</span>
                          <span className="lp-stars">★★★★★</span>
                        </div>
                        <div className="lp-rstar">
                          <span>Densidade comercial</span>
                          <span className="lp-stars">★★★★★</span>
                        </div>
                        <div className="lp-rstar">
                          <span>Potencial de temporada</span>
                          <span className="lp-stars">★★★★★</span>
                        </div>
                        <div className="lp-rstar">
                          <span>Demanda estudantil</span>
                          <span className="lp-stars">★★★★★</span>
                        </div>
                        <div className="lp-rstar">
                          <span>Perfil familiar</span>
                          <span className="lp-stars">★★★★★</span>
                        </div>
                        <div className="lp-rstar">
                          <span>Caminhabilidade</span>
                          <span className="lp-stars">
                            ★★★★<span className="lp-off">★</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="lp-rsimbar">
                      <b>Mais indicado para:</b> <span className="lp-rs">Temporada</span>{" "}
                      <span className="lp-rs">Comercial</span>
                      <b style={{ marginLeft: "12px" }}>Regiões parecidas:</b>{" "}
                      <span className="lp-rs">Sé · SP 94%</span>{" "}
                      <span className="lp-rs">Bela Vista · SP 90%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lp-appdots" id="appdots">
              <button className="lp-on" type="button" data-i="0" aria-label="Ver imóveis"></button>
              <button type="button" data-i="1" aria-label="Ver grupos"></button>
              <button type="button" data-i="2" aria-label="Ver regiões"></button>
            </div>
          </div>

          <p className="lp-appcap lp-reveal">
            A cada busca, um <b>algoritmo especializado</b> reordena todos os imóveis para deixar as
            oportunidades mais relevantes no topo da lista.
          </p>
        </div>
      </section>

      <div className="lp-scene">
        <div className="lp-scene-cap lp-reveal">
          <span className="lp-seclabel">// milhares de imóveis, um painel só</span>
          <b>Do bairro à sua porta - cada oportunidade no seu contexto</b>
        </div>
        <svg aria-hidden="true" viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice">
          <polygon className="lp-il-hex" points="200,44 220,55 220,79 200,90 180,79 180,55" />
          <polygon
            className="lp-il-hex"
            points="1010,60 1028,71 1028,93 1010,104 992,93 992,71"
            opacity="0.08"
          />
          <polygon
            className="lp-il-hex"
            points="620,30 636,39 636,57 620,66 604,57 604,39"
            opacity="0.10"
          />

          <path
            className="lp-il-ground"
            d="M0 196 C 160 170, 300 208, 460 190 C 640 170, 780 210, 960 192 C 1080 180, 1150 202, 1200 190 L1200 260 L0 260 Z"
          />

          <rect className="lp-il-roof-soft" x="70" y="96" width="74" height="100" rx="4" />
          <g className="lp-il-win">
            <rect x="82" y="108" width="12" height="12" rx="1.5" />
            <rect x="102" y="108" width="12" height="12" rx="1.5" />
            <rect x="122" y="108" width="12" height="12" rx="1.5" />
            <rect x="82" y="128" width="12" height="12" rx="1.5" />
            <rect x="102" y="128" width="12" height="12" rx="1.5" />
            <rect x="122" y="128" width="12" height="12" rx="1.5" />
            <rect x="82" y="148" width="12" height="12" rx="1.5" />
            <rect x="102" y="148" width="12" height="12" rx="1.5" />
            <rect x="122" y="148" width="12" height="12" rx="1.5" />
            <rect x="82" y="168" width="12" height="12" rx="1.5" />
            <rect x="102" y="168" width="12" height="12" rx="1.5" />
            <rect x="122" y="168" width="12" height="12" rx="1.5" />
          </g>

          <rect className="lp-il-tree-trunk" x="182" y="160" width="9" height="36" rx="2" />
          <circle className="lp-il-tree-top" cx="186" cy="150" r="24" />

          <polygon className="lp-il-roof" points="238,132 300,132 316,158 222,158" />
          <rect className="lp-il-wall" x="240" y="158" width="60" height="42" />
          <rect className="lp-il-door" x="262" y="176" width="16" height="24" rx="1" />
          <rect className="lp-il-win" x="247" y="166" width="12" height="12" rx="1.5" />
          <rect className="lp-il-win" x="281" y="166" width="12" height="12" rx="1.5" />

          <path
            className="lp-il-pin"
            d="M405 96c-8 0-14 6-14 14 0 9 14 21 14 21s14-12 14-21c0-8-6-14-14-14z"
          />
          <circle className="lp-il-pin-dot" cx="405" cy="110" r="5" />
          <polygon className="lp-il-roof" points="366,146 444,146 444,158 366,158" />
          <rect className="lp-il-wall" x="372" y="158" width="66" height="52" />
          <rect className="lp-il-win" x="382" y="166" width="14" height="14" rx="1.5" />
          <rect className="lp-il-win" x="414" y="166" width="14" height="14" rx="1.5" />
          <rect className="lp-il-door" x="396" y="188" width="18" height="22" rx="1" />

          <rect className="lp-il-tree-trunk" x="470" y="168" width="8" height="32" rx="2" />
          <circle className="lp-il-tree-top" cx="474" cy="160" r="19" />

          <rect className="lp-il-roof-soft" x="520" y="72" width="80" height="128" rx="4" />
          <g className="lp-il-win">
            <rect x="532" y="86" width="13" height="13" rx="1.5" />
            <rect x="554" y="86" width="13" height="13" rx="1.5" />
            <rect x="576" y="86" width="13" height="13" rx="1.5" />
            <rect x="532" y="108" width="13" height="13" rx="1.5" />
            <rect x="554" y="108" width="13" height="13" rx="1.5" />
            <rect x="576" y="108" width="13" height="13" rx="1.5" />
            <rect x="532" y="130" width="13" height="13" rx="1.5" />
            <rect x="554" y="130" width="13" height="13" rx="1.5" />
            <rect x="576" y="130" width="13" height="13" rx="1.5" />
            <rect x="532" y="152" width="13" height="13" rx="1.5" />
            <rect x="554" y="152" width="13" height="13" rx="1.5" />
            <rect x="576" y="152" width="13" height="13" rx="1.5" />
            <rect x="532" y="174" width="13" height="13" rx="1.5" />
            <rect x="554" y="174" width="13" height="13" rx="1.5" />
            <rect x="576" y="174" width="13" height="13" rx="1.5" />
          </g>

          <polygon className="lp-il-roof" points="650,140 712,140 728,166 634,166" />
          <rect className="lp-il-wall" x="652" y="166" width="60" height="42" />
          <rect className="lp-il-door" x="674" y="184" width="16" height="24" rx="1" />
          <rect className="lp-il-win" x="659" y="174" width="12" height="12" rx="1.5" />
          <rect className="lp-il-win" x="693" y="174" width="12" height="12" rx="1.5" />

          <rect className="lp-il-tree-trunk" x="748" y="158" width="9" height="42" rx="2" />
          <circle className="lp-il-tree-top" cx="752" cy="146" r="26" />

          <rect className="lp-il-roof-soft" x="800" y="104" width="70" height="96" rx="4" />
          <g className="lp-il-win">
            <rect x="812" y="116" width="12" height="12" rx="1.5" />
            <rect x="832" y="116" width="12" height="12" rx="1.5" />
            <rect x="852" y="116" width="12" height="12" rx="1.5" />
            <rect x="812" y="136" width="12" height="12" rx="1.5" />
            <rect x="832" y="136" width="12" height="12" rx="1.5" />
            <rect x="852" y="136" width="12" height="12" rx="1.5" />
            <rect x="812" y="156" width="12" height="12" rx="1.5" />
            <rect x="832" y="156" width="12" height="12" rx="1.5" />
            <rect x="852" y="156" width="12" height="12" rx="1.5" />
            <rect x="812" y="176" width="12" height="12" rx="1.5" />
            <rect x="832" y="176" width="12" height="12" rx="1.5" />
            <rect x="852" y="176" width="12" height="12" rx="1.5" />
          </g>

          <polygon className="lp-il-roof" points="912,150 966,150 980,172 898,172" />
          <rect className="lp-il-wall" x="914" y="172" width="52" height="36" />
          <rect className="lp-il-door" x="932" y="188" width="15" height="20" rx="1" />
          <rect className="lp-il-win" x="920" y="178" width="11" height="11" rx="1.5" />

          <rect className="lp-il-tree-trunk" x="1002" y="170" width="8" height="30" rx="2" />
          <circle className="lp-il-tree-top" cx="1006" cy="162" r="18" />
          <polygon className="lp-il-roof" points="1052,150 1128,150 1128,162 1052,162" />
          <rect className="lp-il-wall" x="1058" y="162" width="64" height="46" />
          <rect className="lp-il-win" x="1068" y="170" width="13" height="13" rx="1.5" />
          <rect className="lp-il-win" x="1099" y="170" width="13" height="13" rx="1.5" />
          <rect className="lp-il-door" x="1082" y="188" width="16" height="20" rx="1" />
        </svg>
      </div>

      <section className="lp-band lp-alt" id="analise">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">// como funciona a nossa análise</span>
            <h2>Cada imóvel, traduzido em notas fáceis de comparar</h2>
            <p>
              Localização, preço de mercado, características e qualidade da região viram números
              claros. Abaixo, de forma simples, como cada parte é calculada.
            </p>
          </div>

          <div className="lp-method-intro">
            <div className="lp-pill-explain lp-reveal">
              <span className="lp-n">01 · comparativas</span>
              <h4>Notas de 0 a 100</h4>
              <p>
                Toda nota compara o imóvel com todos os outros da base ativa. É um ranking, não uma
                aprovação absoluta.
              </p>
            </div>
            <div className="lp-pill-explain lp-reveal lp-d1">
              <span className="lp-n">02 · transparentes</span>
              <h4>Nada de caixa-preta</h4>
              <p>
                Cada nota vem com a explicação por fator: o que puxou o número para cima e o que
                puxou para baixo.
              </p>
            </div>
            <div className="lp-pill-explain lp-reveal lp-d2">
              <span className="lp-n">03 · sob medida</span>
              <h4>Ajustadas por tipo</h4>
              <p>
                Os pesos mudam conforme o imóvel - moradia, terreno ou comercial se valorizam de
                formas diferentes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-band">
        <div className="lp-wrap">
          <div className="lp-scores-lead">
            <div className="lp-reveal">
              <span className="lp-seclabel">// as notas</span>
              <h3>Uma nota 87 quer dizer: “melhor que 87% dos imóveis semelhantes”</h3>
              <p>
                As notas são <b>relativas</b>: comparam o imóvel com os concorrentes da base ativa.
                Servem para ranquear oportunidades - e mostrar rapidamente onde estão as melhores
                chances.
              </p>
            </div>
            <div className="lp-rankviz lp-reveal lp-d1">
              <div className="lp-big">
                <span className="lp-num">87</span>
                <span className="lp-den">/ 100</span>
              </div>
              <p className="lp-cap">
                <b>Apartamento 72 m² · Vila Mariana</b> está à frente de 87% dos imóveis parecidos.
              </p>
              <div className="lp-rankbar">
                <span className="lp-me" data-left="87%"></span>
              </div>
              <div className="lp-rankbar-labels">
                <span>piores oportunidades</span>
                <span>melhores oportunidades</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-band lp-alt lp-m-hide">
        <div className="lp-wrap">
          <div className="lp-breakdown">
            <div className="lp-txt lp-reveal">
              <span className="lp-seclabel">// a nota principal</span>
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
                <span className="lp-chip">🏠 Moradia</span>
                <span className="lp-chip">🌱 Terreno</span>
                <span className="lp-chip">🏢 Comercial</span>
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
                    data-off="19.6"
                    transform="rotate(-90 30 30)"
                  />
                  <text x="30" y="35" textAnchor="middle" fontSize="17">
                    87
                  </text>
                </svg>
                <div className="lp-info">
                  <b>Apartamento 72 m² · Vila Mariana</b>
                  <span>Lance R$ 312.000 · Avaliação Caixa R$ 520.000</span>
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
            <span className="lp-seclabel">// para o que o imóvel serve melhor</span>
            <h2>Notas de uso: o destaque de cada imóvel</h2>
            <p>
              Além da nota principal, mostramos os melhores usos - e eles só aparecem quando o
              imóvel realmente se sobressai.
            </p>
          </div>
          <div className="lp-uses-grid">
            <div className="lp-usecard lp-reveal">
              <div className="lp-emo">🏠</div>
              <b>Moradia familiar</b>
              <span>quartos, área, escolas e parques por perto.</span>
              <div className="lp-score">nota 88</div>
            </div>
            <div className="lp-usecard lp-reveal lp-d1">
              <div className="lp-emo">🏖️</div>
              <b>Temporada / Airbnb</b>
              <span>perto de centro, restaurantes, hotéis e universidades.</span>
              <div className="lp-score">nota 74</div>
            </div>
            <div className="lp-usecard lp-reveal lp-d2">
              <div className="lp-emo">🎓</div>
              <b>Aluguel estudantil</b>
              <span>proximidade de universidades e porte adequado.</span>
              <div className="lp-score">nota 69</div>
            </div>
            <div className="lp-usecard lp-reveal lp-d1">
              <div className="lp-emo">🔨</div>
              <b>Reforma &amp; revenda</b>
              <span>potencial de valorização e movimento por perto.</span>
              <div className="lp-score">nota 82</div>
            </div>
            <div className="lp-usecard lp-reveal lp-d2">
              <div className="lp-emo">💰</div>
              <b>Liquidez na revenda</b>
              <span>facilidade de vender rápido.</span>
              <div className="lp-score">nota 81</div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-band lp-m-hide">
        <div className="lp-wrap">
          <div className="lp-region">
            <div className="lp-txt lp-reveal">
              <span className="lp-seclabel">// qualidade da região</span>
              <h3>Conheça o entorno antes de visitar</h3>
              <p>
                Dividimos cada cidade em pequenas células e medimos o que existe ao redor de cada
                imóvel - mercados, escolas, hospitais, farmácias e parques, com as distâncias reais.
              </p>
              <p>
                Regiões mais completas e bem servidas pesam a favor da nota. Quanto mais escuro,
                melhor a célula.
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
                <span className="lp-pill">Vila Mariana · SP</span>
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
        </div>
      </section>

      <section className="lp-band lp-alt lp-m-hide">
        <div className="lp-wrap">
          <div className="lp-market">
            <div className="lp-txt lp-reveal">
              <span className="lp-seclabel">// análise de preço de mercado</span>
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
              <div className="lp-lbl">Preço mediano por m² · Vila Mariana</div>
              <div className="lp-med">
                <b>R$ 9.200</b>
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

      <section className="lp-band">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">// segmentos de mercado</span>
            <h2>Navegue por “famílias” de oportunidades</h2>
            <p>
              Os imóveis são organizados automaticamente em grupos de imóveis parecidos, com nomes
              claros. Fica fácil explorar o que combina com você.
            </p>
          </div>
          <div className="lp-clusters lp-m-slide">
            <div className="lp-cluster lp-reveal">
              <div className="lp-hexrow">
                <svg viewBox="0 0 26 30">
                  <polygon
                    className="lp-hf"
                    points="13,1 25,8 25,22 13,29 1,22 1,8"
                    fillOpacity="0.85"
                  />
                </svg>
                <svg viewBox="0 0 26 30">
                  <polygon
                    className="lp-hf"
                    points="13,1 25,8 25,22 13,29 1,22 1,8"
                    fillOpacity="0.5"
                  />
                </svg>
                <svg viewBox="0 0 26 30">
                  <polygon
                    className="lp-hf"
                    points="13,1 25,8 25,22 13,29 1,22 1,8"
                    fillOpacity="0.3"
                  />
                </svg>
              </div>
              <b>Apartamentos populares de alta liquidez</b>
              <div className="lp-meta">São Paulo · até R$ 350 mil · 1-2 quartos</div>
              <div className="lp-count">1.240 imóveis</div>
            </div>
            <div className="lp-cluster lp-reveal lp-d1">
              <div className="lp-hexrow">
                <svg viewBox="0 0 26 30">
                  <polygon
                    className="lp-hf"
                    points="13,1 25,8 25,22 13,29 1,22 1,8"
                    fillOpacity="0.85"
                  />
                </svg>
                <svg viewBox="0 0 26 30">
                  <polygon
                    className="lp-hf"
                    points="13,1 25,8 25,22 13,29 1,22 1,8"
                    fillOpacity="0.5"
                  />
                </svg>
                <svg viewBox="0 0 26 30">
                  <polygon
                    className="lp-hf"
                    points="13,1 25,8 25,22 13,29 1,22 1,8"
                    fillOpacity="0.3"
                  />
                </svg>
              </div>
              <b>Terrenos compactos de valor médio</b>
              <div className="lp-meta">Grande São Paulo · lotes até 250 m²</div>
              <div className="lp-count">380 imóveis</div>
            </div>
            <div className="lp-cluster lp-reveal lp-d2">
              <div className="lp-hexrow">
                <svg viewBox="0 0 26 30">
                  <polygon
                    className="lp-hf"
                    points="13,1 25,8 25,22 13,29 1,22 1,8"
                    fillOpacity="0.85"
                  />
                </svg>
                <svg viewBox="0 0 26 30">
                  <polygon
                    className="lp-hf"
                    points="13,1 25,8 25,22 13,29 1,22 1,8"
                    fillOpacity="0.5"
                  />
                </svg>
                <svg viewBox="0 0 26 30">
                  <polygon
                    className="lp-hf"
                    points="13,1 25,8 25,22 13,29 1,22 1,8"
                    fillOpacity="0.3"
                  />
                </svg>
              </div>
              <b>Sobrados para reforma e revenda</b>
              <div className="lp-meta">Zona Sul · potencial de valorização</div>
              <div className="lp-count">156 imóveis</div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-band lp-alt lp-m-hide">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">// recomendações</span>
            <h2>Imóveis parecidos, lado a lado</h2>
            <p>
              Exclusivo da Lavra: para cada imóvel sugerimos <b>oportunidades equivalentes</b>{" "}
              (mesma região e faixa de preço) e <b>parecidos visualmente</b> (mesma cidade) - para
              comparar de verdade.
            </p>
          </div>
          <div className="lp-carwrap lp-reveal lp-d1">
            <div className="lp-carhint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 12h14m0 0-4-4m4 4-4 4" />
              </svg>{" "}
              Arraste para explorar as sugestões
            </div>
            <div className="lp-carousel">
              <article className="lp-pcard">
                <div className="lp-pphoto">
                  <span className="lp-tag">Semelhante</span>
                  <span className="lp-simi">94% similar</span>
                  <svg
                    className="lp-photo-illus2"
                    viewBox="0 0 284 150"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <polygon className="lp-il-hex" points="40,22 52,29 52,43 40,50 28,43 28,29" />
                    <path
                      className="lp-il-ground"
                      d="M0 118 C 90 108, 190 128, 284 114 L284 150 L0 150 Z"
                    />
                    <rect
                      className="lp-il-tree-trunk"
                      x="228"
                      y="84"
                      width="7"
                      height="30"
                      rx="2"
                    />
                    <circle className="lp-il-tree-top" cx="231.5" cy="78" r="17" />
                    <rect
                      className="lp-il-roof-soft"
                      x="104"
                      y="42"
                      width="70"
                      height="72"
                      rx="3"
                    />
                    <g className="lp-il-win">
                      <rect x="114" y="52" width="12" height="12" rx="1.5" />
                      <rect x="133" y="52" width="12" height="12" rx="1.5" />
                      <rect x="152" y="52" width="12" height="12" rx="1.5" />
                      <rect x="114" y="70" width="12" height="12" rx="1.5" />
                      <rect x="133" y="70" width="12" height="12" rx="1.5" />
                      <rect x="152" y="70" width="12" height="12" rx="1.5" />
                      <rect x="114" y="88" width="12" height="12" rx="1.5" />
                      <rect x="133" y="88" width="12" height="12" rx="1.5" />
                      <rect x="152" y="88" width="12" height="12" rx="1.5" />
                    </g>
                  </svg>
                </div>
                <div className="lp-pbody">
                  <b>Apto 68 m²</b>
                  <div className="lp-loc">Saúde · São Paulo, SP</div>
                  <div className="lp-pmeta">
                    <span className="lp-price">R$ 298.000</span>
                    <span className="lp-sc">
                      nota <b>84</b>
                    </span>
                  </div>
                </div>
              </article>
              <article className="lp-pcard">
                <div className="lp-pphoto">
                  <span className="lp-tag">Semelhante</span>
                  <span className="lp-simi">90% similar</span>
                  <svg
                    className="lp-photo-illus2"
                    viewBox="0 0 284 150"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <polygon
                      className="lp-il-hex"
                      points="250,20 262,27 262,41 250,48 238,41 238,27"
                    />
                    <path
                      className="lp-il-ground"
                      d="M0 116 C 80 106, 180 126, 284 112 L284 150 L0 150 Z"
                    />
                    <rect className="lp-il-tree-trunk" x="44" y="86" width="7" height="28" rx="2" />
                    <circle className="lp-il-tree-top" cx="47.5" cy="80" r="16" />
                    <polygon className="lp-il-roof" points="108,50 176,50 194,78 90,78" />
                    <rect className="lp-il-wall" x="112" y="78" width="60" height="36" />
                    <rect className="lp-il-door" x="133" y="94" width="18" height="20" rx="1" />
                    <rect className="lp-il-win" x="120" y="84" width="11" height="11" rx="1.5" />
                    <rect className="lp-il-win" x="153" y="84" width="11" height="11" rx="1.5" />
                  </svg>
                </div>
                <div className="lp-pbody">
                  <b>Sobrado 96 m²</b>
                  <div className="lp-loc">Jabaquara · São Paulo, SP</div>
                  <div className="lp-pmeta">
                    <span className="lp-price">R$ 342.000</span>
                    <span className="lp-sc">
                      nota <b>82</b>
                    </span>
                  </div>
                </div>
              </article>
              <article className="lp-pcard">
                <div className="lp-pphoto">
                  <span className="lp-tag">Semelhante</span>
                  <span className="lp-simi">88% similar</span>
                  <svg
                    className="lp-photo-illus2"
                    viewBox="0 0 284 150"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <polygon className="lp-il-hex" points="40,22 52,29 52,43 40,50 28,43 28,29" />
                    <path
                      className="lp-il-ground"
                      d="M0 118 C 90 108, 190 128, 284 114 L284 150 L0 150 Z"
                    />
                    <rect
                      className="lp-il-tree-trunk"
                      x="228"
                      y="84"
                      width="7"
                      height="30"
                      rx="2"
                    />
                    <circle className="lp-il-tree-top" cx="231.5" cy="78" r="17" />
                    <rect
                      className="lp-il-roof-soft"
                      x="104"
                      y="42"
                      width="70"
                      height="72"
                      rx="3"
                    />
                    <g className="lp-il-win">
                      <rect x="114" y="52" width="12" height="12" rx="1.5" />
                      <rect x="133" y="52" width="12" height="12" rx="1.5" />
                      <rect x="152" y="52" width="12" height="12" rx="1.5" />
                      <rect x="114" y="70" width="12" height="12" rx="1.5" />
                      <rect x="133" y="70" width="12" height="12" rx="1.5" />
                      <rect x="152" y="70" width="12" height="12" rx="1.5" />
                      <rect x="114" y="88" width="12" height="12" rx="1.5" />
                      <rect x="133" y="88" width="12" height="12" rx="1.5" />
                      <rect x="152" y="88" width="12" height="12" rx="1.5" />
                    </g>
                  </svg>
                </div>
                <div className="lp-pbody">
                  <b>Apto 75 m²</b>
                  <div className="lp-loc">Ipiranga · São Paulo, SP</div>
                  <div className="lp-pmeta">
                    <span className="lp-price">R$ 335.000</span>
                    <span className="lp-sc">
                      nota <b>80</b>
                    </span>
                  </div>
                </div>
              </article>
              <article className="lp-pcard">
                <div className="lp-pphoto">
                  <span className="lp-tag">Parecido visual</span>
                  <span className="lp-simi">96% visual</span>
                  <svg
                    className="lp-photo-illus2"
                    viewBox="0 0 284 150"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <polygon className="lp-il-hex" points="40,22 52,29 52,43 40,50 28,43 28,29" />
                    <path
                      className="lp-il-ground"
                      d="M0 118 C 90 108, 190 128, 284 114 L284 150 L0 150 Z"
                    />
                    <rect
                      className="lp-il-tree-trunk"
                      x="228"
                      y="84"
                      width="7"
                      height="30"
                      rx="2"
                    />
                    <circle className="lp-il-tree-top" cx="231.5" cy="78" r="17" />
                    <rect
                      className="lp-il-roof-soft"
                      x="104"
                      y="42"
                      width="70"
                      height="72"
                      rx="3"
                    />
                    <g className="lp-il-win">
                      <rect x="114" y="52" width="12" height="12" rx="1.5" />
                      <rect x="133" y="52" width="12" height="12" rx="1.5" />
                      <rect x="152" y="52" width="12" height="12" rx="1.5" />
                      <rect x="114" y="70" width="12" height="12" rx="1.5" />
                      <rect x="133" y="70" width="12" height="12" rx="1.5" />
                      <rect x="152" y="70" width="12" height="12" rx="1.5" />
                      <rect x="114" y="88" width="12" height="12" rx="1.5" />
                      <rect x="133" y="88" width="12" height="12" rx="1.5" />
                      <rect x="152" y="88" width="12" height="12" rx="1.5" />
                    </g>
                  </svg>
                </div>
                <div className="lp-pbody">
                  <b>Apto 72 m²</b>
                  <div className="lp-loc">Vila Clementino · São Paulo, SP</div>
                  <div className="lp-pmeta">
                    <span className="lp-price">R$ 355.000</span>
                    <span className="lp-sc">
                      nota <b>79</b>
                    </span>
                  </div>
                </div>
              </article>
              <article className="lp-pcard">
                <div className="lp-pphoto">
                  <span className="lp-tag">Parecido visual</span>
                  <span className="lp-simi">91% visual</span>
                  <svg
                    className="lp-photo-illus2"
                    viewBox="0 0 284 150"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <polygon
                      className="lp-il-hex"
                      points="250,20 262,27 262,41 250,48 238,41 238,27"
                    />
                    <path
                      className="lp-il-ground"
                      d="M0 116 C 80 106, 180 126, 284 112 L284 150 L0 150 Z"
                    />
                    <rect className="lp-il-tree-trunk" x="44" y="86" width="7" height="28" rx="2" />
                    <circle className="lp-il-tree-top" cx="47.5" cy="80" r="16" />
                    <polygon className="lp-il-roof" points="108,50 176,50 194,78 90,78" />
                    <rect className="lp-il-wall" x="112" y="78" width="60" height="36" />
                    <rect className="lp-il-door" x="133" y="94" width="18" height="20" rx="1" />
                    <rect className="lp-il-win" x="120" y="84" width="11" height="11" rx="1.5" />
                    <rect className="lp-il-win" x="153" y="84" width="11" height="11" rx="1.5" />
                  </svg>
                </div>
                <div className="lp-pbody">
                  <b>Apto 66 m²</b>
                  <div className="lp-loc">Aclimação · São Paulo, SP</div>
                  <div className="lp-pmeta">
                    <span className="lp-price">R$ 322.000</span>
                    <span className="lp-sc">
                      nota <b>77</b>
                    </span>
                  </div>
                </div>
              </article>
              <article className="lp-pcard">
                <div className="lp-pphoto">
                  <span className="lp-tag">Parecido visual</span>
                  <span className="lp-simi">88% visual</span>
                  <svg
                    className="lp-photo-illus2"
                    viewBox="0 0 284 150"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <polygon className="lp-il-hex" points="40,22 52,29 52,43 40,50 28,43 28,29" />
                    <path
                      className="lp-il-ground"
                      d="M0 118 C 90 108, 190 128, 284 114 L284 150 L0 150 Z"
                    />
                    <rect
                      className="lp-il-tree-trunk"
                      x="228"
                      y="84"
                      width="7"
                      height="30"
                      rx="2"
                    />
                    <circle className="lp-il-tree-top" cx="231.5" cy="78" r="17" />
                    <rect
                      className="lp-il-roof-soft"
                      x="104"
                      y="42"
                      width="70"
                      height="72"
                      rx="3"
                    />
                    <g className="lp-il-win">
                      <rect x="114" y="52" width="12" height="12" rx="1.5" />
                      <rect x="133" y="52" width="12" height="12" rx="1.5" />
                      <rect x="152" y="52" width="12" height="12" rx="1.5" />
                      <rect x="114" y="70" width="12" height="12" rx="1.5" />
                      <rect x="133" y="70" width="12" height="12" rx="1.5" />
                      <rect x="152" y="70" width="12" height="12" rx="1.5" />
                      <rect x="114" y="88" width="12" height="12" rx="1.5" />
                      <rect x="133" y="88" width="12" height="12" rx="1.5" />
                      <rect x="152" y="88" width="12" height="12" rx="1.5" />
                    </g>
                  </svg>
                </div>
                <div className="lp-pbody">
                  <b>Apto 74 m²</b>
                  <div className="lp-loc">Paraíso · São Paulo, SP</div>
                  <div className="lp-pmeta">
                    <span className="lp-price">R$ 348.000</span>
                    <span className="lp-sc">
                      nota <b>76</b>
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-band">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">// como ler as notas</span>
            <h2>Três coisas para ter em mente</h2>
          </div>
          <div className="lp-readscores">
            <div className="lp-readcard lp-reveal">
              <div className="lp-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 3v18h18" />
                  <path d="M7 15l4-4 3 2 4-6" />
                </svg>
              </div>
              <b>São comparativas</b>
              <p>
                Uma nota alta é boa em relação aos demais imóveis ativos - não é uma garantia
                absoluta de bom negócio.
              </p>
            </div>
            <div className="lp-readcard lp-reveal lp-d1">
              <div className="lp-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 9v4m0 3h.01" />
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                </svg>
              </div>
              <b>Dados incompletos reduzem a nota</b>
              <p>
                Imóveis sem foto, sem área ou sem preço são penalizados - há menos certeza sobre
                eles.
              </p>
            </div>
            <div className="lp-readcard lp-reveal lp-d2">
              <div className="lp-ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 16v-4m0-4h.01" />
                </svg>
              </div>
              <b>Tudo é explicado</b>
              <p>
                Cada nota mostra os fatores que mais contribuíram, para você decidir com
                transparência.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-band lp-alt" id="casos">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">// casos de uso</span>
            <h2>Feita para o seu objetivo</h2>
            <p>Seja qual for o seu plano, a Lavra mostra os imóveis que realmente fazem sentido.</p>
          </div>
          <div className="lp-personas lp-m-slide">
            <div className="lp-persona lp-reveal">
              <div className="lp-emo">🔨</div>
              <div>
                <h3>Quem compra para reformar e revender</h3>
                <p>
                  Encontre imóveis com bom desconto e potencial de valorização, com liquidez de
                  revenda estimada para a região.
                </p>
                <div className="lp-flow">
                  <span>desconto alto</span>
                  <span>potencial de obra</span>
                  <span>revenda rápida</span>
                </div>
              </div>
            </div>
            <div className="lp-persona lp-reveal lp-d1">
              <div className="lp-emo">🏠</div>
              <div>
                <h3>Quem procura o próprio lar</h3>
                <p>
                  Filtre por moradia familiar e veja escolas, parques e serviços por perto antes
                  mesmo de visitar.
                </p>
                <div className="lp-flow">
                  <span>região completa</span>
                  <span>escolas perto</span>
                  <span>bom m²</span>
                </div>
              </div>
            </div>
            <div className="lp-persona lp-reveal">
              <div className="lp-emo">📈</div>
              <div>
                <h3>Quem investe para renda</h3>
                <p>
                  Compare vocação para temporada, aluguel estudantil ou moradia - e priorize onde o
                  retorno é mais provável.
                </p>
                <div className="lp-flow">
                  <span>temporada</span>
                  <span>estudantil</span>
                  <span>alta demanda</span>
                </div>
              </div>
            </div>
            <div className="lp-persona lp-reveal lp-d1">
              <div className="lp-emo">⏰</div>
              <div>
                <h3>Quem não quer perder o prazo</h3>
                <p>
                  Salve seus critérios, receba alertas de novos editais compatíveis e acompanhe as
                  datas de praça no calendário.
                </p>
                <div className="lp-flow">
                  <span>alertas</span>
                  <span>1ª e 2ª praça</span>
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
            <span className="lp-seclabel">// planos</span>
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

          <p className="lp-plans-note">
            Preços e limites são ilustrativos - ajustar antes de publicar.
          </p>
        </div>
      </section>

      <section className="lp-band lp-alt" id="faq">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">// dúvidas frequentes</span>
            <h2>Perguntas frequentes</h2>
            <p>O essencial para começar com confiança.</p>
          </div>
          <div className="lp-faq lp-reveal">
            <details open>
              <summary>
                As notas são uma garantia de bom negócio?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  Não. As notas são <b>comparativas</b>: mostram quão boa é uma oportunidade em
                  relação aos outros imóveis ativos. Servem para ranquear e comparar - a decisão
                  final, incluindo a análise jurídica do edital, continua sendo sua.
                </p>
              </div>
            </details>
            <details>
              <summary>
                De onde vêm os preços de mercado?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  De anúncios reais de imóveis semelhantes em <b>portais consolidados do mercado</b>
                  . Excluímos portais de leilão de propósito, para comparar sempre com o mercado
                  aberto. Usamos o preço mediano por m², que evita distorções de anúncios fora da
                  curva.
                </p>
              </div>
            </details>
            <details>
              <summary>
                O que é o “desconto sobre a avaliação”?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  É a comparação direta entre o preço de venda do leilão e o valor que a própria
                  Caixa avaliou para o imóvel. Diferente do preço de mercado, esse número{" "}
                  <b>não depende de anúncios</b> - vem da avaliação oficial.
                </p>
              </div>
            </details>
            <details>
              <summary>
                Como vocês sabem se a região é boa?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  Medimos a proximidade de mercados, hospitais, escolas, farmácias e parques, além
                  da <b>diversidade de serviços</b> por perto - uma região completa, não só “muitos
                  do mesmo”. Isso vira a nota de qualidade da região, com as distâncias reais aos
                  pontos de interesse.
                </p>
              </div>
            </details>
            <details>
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
                  Não. Você descreve o que procura em português comum, como falaria com um corretor,
                  e a Lavra traduz isso em critérios e notas fáceis de comparar. Nada de dropdowns
                  complexos ou juridiquês.
                </p>
              </div>
            </details>
            <details>
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
                  Diariamente. Novos editais entram, imóveis arrematados saem, e as notas são
                  recalculadas para continuar refletindo a base ativa. Você também pode salvar
                  buscas e receber alertas quando algo compatível aparecer.
                </p>
              </div>
            </details>
            <details>
              <summary>
                Por que um imóvel sem foto tem nota mais baixa?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  Porque dados incompletos reduzem a certeza. Imóveis sem foto, sem área ou sem
                  informações de preço são penalizados - não porque são ruins, mas porque sabemos
                  menos sobre eles. E tudo isso fica explícito na explicação da nota.
                </p>
              </div>
            </details>
            <details>
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
                  Durante a fase experimental, o acesso para explorar é aberto - sem cadastro. Criar
                  uma conta libera favoritos, buscas salvas e alertas.
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
              <a className="lp-btn lp-ghost lp-big" href="#analise">
                Rever a metodologia
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
            <a href="#analise">Como funciona</a>
            <a href="#casos">Casos de uso</a>
            <a href="#faq">Dúvidas</a>
          </div>
          <span className="lp-fine">© 2026 Lavra · dados de editais públicos</span>
        </div>
      </footer>
      <LandingEffects />
    </>
  );
}
