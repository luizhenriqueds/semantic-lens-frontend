import Link from "next/link";
import LandingEffects from "@/app/(marketing)/_components/LandingEffects";
import HeroSearchScene from "@/app/(marketing)/_components/HeroSearchScene";
import LavraLogo from "@/components/brand/LavraLogo";
import { getUser } from "@/lib/supabase/server";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function HexField({ withPattern = false }: { withPattern?: boolean }) {
  return (
    <svg
      className="lp-hexfield"
      aria-hidden="true"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMin slice"
      viewBox="0 0 1200 700"
    >
      {withPattern && (
        <defs>
          <pattern id="lp-hexes" width="104" height="180" patternUnits="userSpaceOnUse">
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
      )}
      <rect width="1200" height="700" fill="url(#lp-hexes)" />
      <g strokeWidth="1.2">
        <polygon
          className="lp-hex"
          points="600,182 648,209 648,269 600,296 552,269 552,209"
          fillOpacity="0.16"
        />
        <polygon
          className="lp-hex"
          points="704,242 752,269 752,329 704,356 656,329 656,269"
          fillOpacity="0.09"
        />
        <polygon
          className="lp-hex"
          points="496,122 544,149 544,209 496,236 448,209 448,149"
          fillOpacity="0.07"
        />
      </g>
    </svg>
  );
}

export default async function LandingPage() {
  const { user } = await getUser();

  return (
    <>
      <header className="lp-nav">
        <div className="lp-wrap">
          <Link href="/" className="lp-brand">
            <div className="lp-mark">
              <LavraLogo size={26} />
            </div>
            <div>
              <b>Lavra</b>
              <small>Leilões inteligentes</small>
            </div>
          </Link>
          <nav>
            <a href="#camadas">Recursos</a>
            <a href="#comparar">Comparar</a>
          </nav>
          <div className="lp-cta">
            {user ? (
              <Link className="btn solid" href="/dashboard">
                Dashboard
              </Link>
            ) : (
              <>
                <Link className="btn ghost" href="/login">
                  Entrar
                </Link>
                <Link className="btn solid" href="/register">
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="lp-hero">
        <HexField withPattern />
        <div className="lp-wrap">
          <span className="lp-eyebrow">
            <span className="lp-new">Novo</span> A primeira busca semântica e geográfica de leilões
            do Brasil
          </span>
          <h1>
            Descreva o imóvel.
            <br />A gente encontra{" "}
            <span className="lp-underline">
              o leilão.
              <svg viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true">
                <path d="M2 7 Q 50 2, 100 6 T 198 4" />
              </svg>
            </span>
          </h1>
          <p className="lp-lede">
            Descreva o imóvel que procura como descreveria a um corretor. A Lavra cruza linguagem
            natural, células geográficas H3 e dados de mercado para mostrar só os leilões que fazem
            sentido para o seu objetivo.
          </p>
          <div className="lp-actions">
            <Link className="btn solid big" href="/dashboard">
              Abrir o dashboard
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M5 12h14m0 0-6-6m6 6-6 6" />
              </svg>
            </Link>
            <a className="btn ghost big" href="#camadas">
              Ver como funciona
            </a>
          </div>
          <div className="lp-micro">
            <span className="mono">12.400+</span> imóveis monitorados ·{" "}
            <span className="mono">27</span> estados · atualização diária
          </div>
        </div>

        <div className="lp-scrollcue" aria-hidden="true">
          role para ver as camadas
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 5v14m0 0-5-5m5 5 5-5" />
          </svg>
        </div>
      </section>

      <section className="lp-searchzone">
        <HexField />
        <div className="lp-wrap">
          <HeroSearchScene />
        </div>
      </section>

      <section className="lp-stackzone" id="camadas">
        <div className="lp-wrap">
          <div className="lp-stackhead lp-reveal">
            <span className="lp-seclabel">{"// quatro camadas de leitura"}</span>
            <h2>Cada imóvel, lido em camadas — como um mapa</h2>
            <p>
              Linguagem, geografia, preço e tempo. As quatro dimensões que separam um bom arremate
              de um problema caro.
            </p>
          </div>

          <div className="lp-stack">
            <div className="lp-layer">
              <div className="lp-lcard">
                <div className="lp-body">
                  <span className="lp-lindex">
                    <i>1</i> camada semântica
                  </span>
                  <h3>Busca que entende objetivo, não palavra-chave</h3>
                  <p>
                    “Comprar, reformar e revender” vira critérios reais: potencial de valorização,
                    custo de obra estimado, liquidez de revenda. Sem dropdown, sem juridiquês.
                  </p>
                  <ul className="lp-lpoints">
                    <li>
                      <CheckIcon />
                      Português coloquial, direto do seu jeito de falar
                    </li>
                    <li>
                      <CheckIcon />
                      Ranking por afinidade com o objetivo
                    </li>
                  </ul>
                </div>
                <div className="lp-lviz">
                  <div className="lp-mockq">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.2-3.2" />
                    </svg>
                    “casa para reformar e revender na zona sul de SP”
                  </div>
                  <div className="lp-mocktags">
                    <span>flip / revenda</span>
                    <span>obra leve a média</span>
                    <span>zona sul · SP</span>
                    <span>liquidez alta</span>
                  </div>
                  <div className="lp-mockhit">
                    <span className="lp-ph">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 11 12 4l9 7" />
                        <path d="M5 10v10h14V10" />
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
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 11 12 4l9 7" />
                        <path d="M5 10v10h14V10" />
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
                <div className="lp-body">
                  <span className="lp-lindex">
                    <i>2</i> camada geográfica
                  </span>
                  <h3>A vizinhança inteira em células hexagonais</h3>
                  <p>
                    Cada região do Brasil é dividida em células H3 com notas de infraestrutura,
                    serviços, mobilidade e vocação. Você conhece o entorno antes de visitar.
                  </p>
                  <ul className="lp-lpoints">
                    <li>
                      <CheckIcon />
                      DNA da região: para quem aquele bairro funciona
                    </li>
                    <li>
                      <CheckIcon />
                      Escolas, hospitais e metrô a distâncias reais
                    </li>
                  </ul>
                </div>
                <div className="lp-lviz">
                  <div className="lp-mockmap">
                    <svg viewBox="0 0 420 210" aria-hidden="true">
                      <g className="lp-dashline" strokeDasharray="5 6">
                        <path d="M-10 60 C 130 45, 290 85, 430 62" />
                        <path d="M-10 140 C 140 125, 300 165, 430 142" />
                        <path d="M140 -10 C 130 70, 155 160, 145 220" />
                        <path d="M290 -10 C 280 70, 305 160, 295 220" />
                      </g>
                      <g strokeWidth="1">
                        <polygon
                          className="lp-hex"
                          points="210,64 241,82 241,118 210,136 179,118 179,82"
                          fillOpacity="0.42"
                        />
                        <polygon
                          className="lp-hex"
                          points="272,64 303,82 303,118 272,136 241,118 241,82"
                          fillOpacity="0.22"
                        />
                        <polygon
                          className="lp-hex"
                          points="148,64 179,82 179,118 148,136 117,118 117,82"
                          fillOpacity="0.30"
                        />
                        <polygon
                          className="lp-hex"
                          points="241,10 272,28 272,64 241,82 210,64 210,28"
                          fillOpacity="0.12"
                        />
                        <polygon
                          className="lp-hex"
                          points="179,10 210,28 210,64 179,82 148,64 148,28"
                          fillOpacity="0.16"
                        />
                        <polygon
                          className="lp-hex"
                          points="241,118 272,136 272,172 241,190 210,172 210,136"
                          fillOpacity="0.14"
                        />
                        <polygon
                          className="lp-hex"
                          points="179,118 210,136 210,172 179,190 148,172 148,136"
                          fillOpacity="0.18"
                        />
                        <polygon
                          className="lp-hex"
                          points="334,64 365,82 365,118 334,136 303,118 303,82"
                          fillOpacity="0.10"
                        />
                        <polygon
                          className="lp-hex"
                          points="86,64 117,82 117,118 86,136 55,118 55,82"
                          fillOpacity="0.11"
                        />
                      </g>
                      <g className="lp-maptext" textAnchor="middle">
                        <text className="lp-maptext-strong" x="210" y="104">
                          8,4
                        </text>
                        <text x="148" y="104">
                          7,1
                        </text>
                        <text x="272" y="104">
                          6,2
                        </text>
                      </g>
                    </svg>
                    <span className="lp-pill">Vila Mariana · SP</span>
                    <span className="lp-coord">h3 · res 9</span>
                  </div>
                  <div className="lp-mockpois">
                    <div className="lp-mockpoi">
                      <i>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M4 19V8l8-4 8 4v11" />
                          <path d="M9 19v-6h6v6" />
                        </svg>
                      </i>
                      <div>
                        <b>Escola estadual</b>
                        <span className="lp-d">450 m</span>
                      </div>
                    </div>
                    <div className="lp-mockpoi">
                      <i>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M12 3v18M3 12h18" />
                        </svg>
                      </i>
                      <div>
                        <b>Hospital</b>
                        <span className="lp-d">1,2 km</span>
                      </div>
                    </div>
                    <div className="lp-mockpoi">
                      <i>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="5" y="4" width="14" height="13" rx="2" />
                          <path d="M8 21h8M9 17l-1 4M15 17l1 4" />
                        </svg>
                      </i>
                      <div>
                        <b>Estação de metrô</b>
                        <span className="lp-d">700 m</span>
                      </div>
                    </div>
                    <div className="lp-mockpoi">
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

            <div className="lp-layer">
              <div className="lp-lcard">
                <div className="lp-body">
                  <span className="lp-lindex">
                    <i>3</i> camada de preço
                  </span>
                  <h3>Scores que mostram o próprio raciocínio</h3>
                  <p>
                    Desconto sobre avaliação, comparação com o m² real do entorno, liquidez e risco
                    — tudo aberto, dimensão por dimensão. Decisão defensável, não palpite.
                  </p>
                  <ul className="lp-lpoints">
                    <li>
                      <CheckIcon />
                      Nota calibrada pelo objetivo da sua busca
                    </li>
                    <li>
                      <CheckIcon />
                      Comparação com a média de mercado da célula
                    </li>
                  </ul>
                </div>
                <div className="lp-lviz lp-mockscore">
                  <div className="lp-row">
                    <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
                      <circle className="lp-ringtrack" cx="23" cy="23" r="19" strokeWidth="5.5" />
                      <circle
                        className="lp-ringbar"
                        cx="23"
                        cy="23"
                        r="19"
                        strokeWidth="5.5"
                        strokeDasharray="100 120"
                        transform="rotate(-90 23 23)"
                      />
                      <text className="lp-ringlabel" x="23" y="27" textAnchor="middle">
                        8,4
                      </text>
                    </svg>
                    <div>
                      <b>Apartamento 72 m² · Vila Mariana</b>
                      <span className="lp-s">Lance atual R$ 312.000 · avaliação R$ 578.000</span>
                    </div>
                  </div>
                  <div className="lp-msb">
                    <div className="lp-t">
                      <span>Desconto sobre avaliação</span>
                      <b>9,2</b>
                    </div>
                    <div className="lp-track">
                      <i data-w="92%" />
                    </div>
                  </div>
                  <div className="lp-msb">
                    <div className="lp-t">
                      <span>Qualidade da região</span>
                      <b>8,7</b>
                    </div>
                    <div className="lp-track">
                      <i data-w="87%" />
                    </div>
                  </div>
                  <div className="lp-msb">
                    <div className="lp-t">
                      <span>Liquidez de revenda</span>
                      <b>7,9</b>
                    </div>
                    <div className="lp-track">
                      <i data-w="79%" />
                    </div>
                  </div>
                  <div className="lp-msb lp-dim">
                    <div className="lp-t">
                      <span>Risco jurídico</span>
                      <b>6,1</b>
                    </div>
                    <div className="lp-track">
                      <i data-w="61%" />
                    </div>
                  </div>
                  <div className="lp-mockwhy">
                    <b>Por quê?</b> m² do lance 41% abaixo da média da célula; revenda média em 8
                    meses na região.
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-layer">
              <div className="lp-lcard">
                <div className="lp-body">
                  <span className="lp-lindex">
                    <i>4</i> camada de tempo
                  </span>
                  <h3>Alertas e calendário para agir na hora certa</h3>
                  <p>
                    Leilão é prazo: 1ª praça, 2ª praça, edital novo. Salve seu perfil de busca,
                    receba alertas quando algo compatível entrar e acompanhe as datas no calendário.
                  </p>
                  <ul className="lp-lpoints">
                    <li>
                      <CheckIcon />
                      Alertas por objetivo, região e faixa de preço
                    </li>
                    <li>
                      <CheckIcon />
                      Calendário de praças dos seus favoritos
                    </li>
                  </ul>
                </div>
                <div className="lp-lviz">
                  <div className="lp-mockalert">
                    <span className="lp-ic">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                      </svg>
                    </span>
                    <div>
                      <b>Casas p/ reforma · zona sul SP</b>
                      <span className="lp-s">3 novos editais esta semana</span>
                    </div>
                    <span className="lp-on">Ativo</span>
                  </div>
                  <div className="lp-mockalert">
                    <span className="lp-ic">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                      </svg>
                    </span>
                    <div>
                      <b>Renda estudantil · Curitiba</b>
                      <span className="lp-s">1ª praça amanhã · kitnet 28 m²</span>
                    </div>
                    <span className="lp-on">Ativo</span>
                  </div>
                  <div className="lp-mockcal" aria-hidden="true">
                    <span>8</span>
                    <span>9</span>
                    <span className="lp-has">10</span>
                    <span>11</span>
                    <span className="lp-today">12</span>
                    <span className="lp-has">13</span>
                    <span>14</span>
                    <span>15</span>
                    <span className="lp-has">16</span>
                    <span>17</span>
                    <span>18</span>
                    <span className="lp-has">19</span>
                    <span>20</span>
                    <span>21</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-versus" id="comparar">
        <div className="lp-wrap">
          <div className="lp-stackhead lp-reveal">
            <span className="lp-seclabel">{"// antes e depois"}</span>
            <h2>O jeito antigo termina em edital. O novo começa em você.</h2>
          </div>
          <div className="lp-vsgrid">
            <div className="lp-vscard lp-old lp-reveal">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
                Garimpar leilão hoje
              </h3>
              <ul>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14" />
                  </svg>
                  Dezenas de sites de leiloeiros, cada um com seu formato
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14" />
                  </svg>
                  Filtros que não entendem o seu objetivo
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14" />
                  </svg>
                  Editais em juridiquês, lidos um a um
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14" />
                  </svg>
                  Nenhuma ideia real do entorno do imóvel
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14" />
                  </svg>
                  Datas de praça perdidas por falta de aviso
                </li>
              </ul>
            </div>
            <div className="lp-vscard lp-new-way lp-reveal">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8.5 12.5 2.5 2.5 5-6" />
                </svg>
                Garimpar com a Lavra
              </h3>
              <ul>
                <li>
                  <CheckIcon />
                  Milhares de editais em um painel só, atualizado diariamente
                </li>
                <li>
                  <CheckIcon />
                  Busca em português, ranqueada por afinidade com o objetivo
                </li>
                <li>
                  <CheckIcon />
                  Scores explicáveis, dimensão por dimensão
                </li>
                <li>
                  <CheckIcon />
                  Região lida em células H3: infra, mercado e vocação
                </li>
                <li>
                  <CheckIcon />
                  Alertas e calendário de praças no seu perfil
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-ctaband">
        <div className="lp-wrap">
          <div className="lp-inner lp-reveal">
            <HexField />
            <h2>Descreva o imóvel dos seus planos. Nós achamos o leilão.</h2>
            <p>
              Abra o dashboard, diga o que procura e explore milhares de leilões analisados por
              região e objetivo.
            </p>
            <div className="lp-row">
              <Link className="btn solid big" href="/dashboard">
                Abrir o dashboard
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path d="M5 12h14m0 0-6-6m6 6-6 6" />
                </svg>
              </Link>
              <a className="btn ghost big" href="#camadas">
                Rever os recursos
              </a>
            </div>
            <div className="lp-fine">Acesso aberto durante a fase experimental — sem cadastro</div>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap">
          <Link href="/" className="lp-brand">
            <div className="lp-mark">
              <LavraLogo size={26} />
            </div>
            <div>
              <b>Lavra</b>
              <small>Leilões inteligentes</small>
            </div>
          </Link>
          <div className="lp-links">
            <a href="#camadas">Recursos</a>
            <a href="#comparar">Comparar</a>
            <Link href="/dashboard">Dashboard</Link>
          </div>
          <span className="lp-fine">© 2026 Lavra · dados de editais públicos</span>
        </div>
      </footer>

      <LandingEffects />
    </>
  );
}
