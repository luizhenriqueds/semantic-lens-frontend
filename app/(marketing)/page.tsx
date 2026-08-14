import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";
import JsonLd from "@/components/seo/JsonLd";
import { FAQ } from "@/app/(marketing)/_data/faq";
import { faqLd } from "@/lib/seo/jsonLd";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo/site";
import LandingEffects from "@/app/(marketing)/_components/LandingEffects";
import ApiWaitlist from "@/app/(marketing)/_components/ApiWaitlist";
import PlanCta from "@/components/plan/PlanCta";
import SeoLinks from "@/components/seo/SeoLinks";
import SocialRow from "@/components/seo/SocialRow";
import {
  SpotCommercial,
  SpotFamily,
  SpotFlip,
  SpotSeason,
  SpotStudent,
} from "@/app/(marketing)/_components/UseSpots";
import { IconCalendar, IconChart, IconHouse, IconSliders } from "@/lib/icons";
import Rail from "@/components/ui/Rail";
import ShowcaseGallery from "@/app/(marketing)/_components/ShowcaseGallery";
import DataFlow from "@/app/(marketing)/_components/DataFlow";
import { SIMILAR, SIMILAR_SEED } from "@/app/(marketing)/_data/similar";
import { getLandingStats } from "@/lib/data/landingStats";
import { PLANS, TRIAL_DAYS, type Role } from "@/lib/entitlements";
import { canTrial, PAYMENT_NOTE, PLAN_INCLUDES } from "@/lib/entitlements/copy";
import { getEntitlements } from "@/lib/entitlements/server";
import { countShort, money } from "@/lib/format";
import { POI_LABEL, POI_ORDER } from "@/lib/pois";
import { getUser } from "@/lib/supabase/server";

// Dynamic: getUser()/getEntitlements() read the auth cookie, so this route can't be static.
export const dynamic = "force-dynamic";

export const maxDuration = 20;

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

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

// Must match the entitlement matrix in lib/entitlements/plans.ts - this is what we promise.
const PLAN_CARDS: {
  role: Role;
  trial: string;
  trialOver?: string;
  subnote?: string;
  popular?: boolean;
  features: { lead?: string; text: string; joiner?: string }[];
}[] = [
  {
    role: "basic",
    trial: "Explore sem criar conta",
    features: [
      { text: "Busca por texto, por região e por proximidade de lugares" },
      { text: "Lista, mapa, filtros básicos e a página de cada imóvel, com todas as notas" },
      {
        lead: "Com conta grátis",
        text: `${PLANS.basic.limits.favorites} favoritos e ${PLANS.basic.limits.savedSearches} alertas por e-mail, diários ou semanais`,
      },
    ],
  },
  {
    role: "investor",
    trial: `${TRIAL_DAYS} dias grátis, sem cartão`,
    trialOver: "Para quem acompanha leilões de perto",
    popular: true,
    subnote: `Tudo do ${PLANS.basic.label}, mais:`,
    features: [
      { lead: "Favoritos e alertas ilimitados", text: "sem teto de carteira nem de buscas salvas" },
      {
        lead: "Lugares próximos",
        text: "escolas, mercados, transporte e serviços num raio de 5 km do imóvel",
      },
      {
        lead: "Filtros avançados",
        text: "desconto, notas, financiamento, FGTS e lugares próximos",
      },
      { lead: "Coleções", text: "imóveis parecidos reunidos automaticamente para comparar" },
      {
        lead: "Análise de imóveis",
        text: "distribuição de preço, desconto, área e Nota de Investimento",
      },
      {
        lead: "Comparativo de mercado",
        text: "o lance contra anúncios reais do bairro, com o potencial de ganho",
      },
      {
        lead: `Até ${PLANS.investor.limits.recommendations} recomendações`,
        text: "de imóveis semelhantes",
        joiner: " ",
      },
      { lead: "Alertas automáticos", text: "seleções semanais montadas para você" },
    ],
  },
  {
    role: "professional",
    trial: "Para quem vive de leilão",
    subnote: `Tudo do ${PLANS.investor.label}, mais:`,
    features: [
      { lead: "Alertas em primeira mão", text: "seus alertas saem antes dos demais planos" },
      {
        lead: "Todos os alertas automáticos",
        text: "descontos, reduções de preço, imóveis que migram de leilão para venda direta, coleções e regiões em destaque",
      },
      { lead: "Painel de mercado", text: "preço por m², tendências e comparáveis por cidade" },
      { lead: "Calendário de leilões", text: "a agenda das datas, dia a dia" },
      {
        lead: "Regiões",
        text: "perfil e DNA de cada bairro, o que existe no entorno, preços de mercado e regiões semelhantes",
      },
      {
        lead: `Até ${PLANS.professional.limits.recommendations} recomendações`,
        text: "e envio por WhatsApp (em breve)",
      },
      { lead: "Relatórios e exportação", text: "buscas, filtros e análises em CSV ou PDF" },
    ],
  },
];

export default async function LandingPage() {
  const [{ user }, stats, ent] = await Promise.all([
    getUser(),
    getLandingStats(),
    getEntitlements(),
  ]);

  const tiles: StatTile[] = stats
    ? [
        {
          v: countShort(stats.activeProperties),
          k: "imóveis ativos",
          note: "de leilão e venda direta da Caixa",
        },
        {
          v: countShort(stats.pois),
          k: "lugares próximos",
          note: `medidos em ${stats.poiCategories} categorias`,
        },
        {
          v: countShort(stats.regions),
          k: "regiões analisadas",
          note: `em ${stats.ufs} estados`,
        },
        {
          v: countShort(stats.clusters),
          k: "coleções de imóveis",
          note: "por tipo, preço e região",
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
      <JsonLd data={faqLd(FAQ)} />
      <header className="lp-nav">
        <div className="lp-wrap">
          <a className="lp-brand" href="#top" aria-label="Leilão Index — início">
            <span className="lp-mark">
              <BrandLogo size={28} />
            </span>
            <span>
              <b>
                Leilão <span>Index</span>
              </b>
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
              <a href="#recursos">Como funciona</a>
              <a href="#exemplo">Exemplo real</a>
              <a href="#casos">Objetivos</a>
              <a href="#planos">Planos</a>
              <a href="#faq">Dúvidas</a>
            </nav>
            {/* Browsing needs no account, so the primary CTA opens the app rather than signup. */}
            <div className="lp-navcta">
              {!user && (
                <Link className="lp-btn lp-ghost" href="/login">
                  Entrar
                </Link>
              )}
              <Link className="lp-btn lp-solid" href="/dashboard">
                {user ? "Ir para o painel" : "Explorar imóveis"}
              </Link>
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
            {/* Only a short phrase gets .lp-u: it is white-space:nowrap so the underline can span
                it, and anything long overflows the column. */}
            <h1>
              Saiba quais leilões
              <br />
              <span className="lp-u">
                valem o lance
                <svg viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 7 Q 50 2, 100 6 T 198 4" />
                </svg>
              </span>
              .
            </h1>
            <p className="lp-lede">
              Analisamos diariamente imóveis de leilão para te ajudar a encontrar as melhores
              oportunidades: preço, região, tese de investimento, potencial de revenda e muito mais!
            </p>
            <div className="lp-actions">
              <Link className="lp-btn lp-solid lp-big" href="/dashboard">
                Ver as melhores oportunidades
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14m0 0-6-6m6 6-6 6" />
                </svg>
              </Link>
              <a className="lp-btn lp-ghost lp-big" href="#exemplo">
                Ver uma análise real
              </a>
            </div>
            <div className="lp-micro">Gratuita para testar. Sem cadastro ou cartão de crédito</div>
          </div>

          <div className="lp-heromock lp-reveal" aria-hidden="true">
            <div className="lp-photo">
              <Image
                src="/showcase/apto-ribeirao-preto.jpg"
                alt="Fachada de apartamento de 64 m² no Jardim Palma Travassos, Ribeirão Preto/SP, em leilão da Caixa"
                width={800}
                height={500}
                priority
                sizes="(max-width: 860px) 100vw, 460px"
              />
              <span className="lp-disc">-40% sobre a avaliação</span>
              <div className="lp-uses">
                <span>Moradia</span>
                <span>Temporada</span>
                <span>Revenda</span>
              </div>
            </div>
            <div className="lp-mrow">
              <div className="lp-info">
                <b>Apartamento 3 dorm. · 64 m²</b>
                <span className="lp-loc">Jd. Palma Travassos · Ribeirão Preto/SP</span>
              </div>
              <div className="lp-price">
                <span>Lance inicial</span>
                <b>R$ 137.390</b>
                <small>avaliação R$ 228.983</small>
              </div>
            </div>
            <div className="lp-mockbars">
              <ScoreBars
                items={[
                  { k: "Desconto sobre a avaliação", v: 92 },
                  { k: "Preço vs. mercado", v: 84 },
                  { k: "Qualidade da região", v: 88 },
                ]}
              />
            </div>
            <div className="lp-scorebar">
              <svg className="lp-ring" width="56" height="56" viewBox="0 0 56 56">
                <circle className="lp-track" cx="28" cy="28" r="23" strokeWidth="5" />
                <circle
                  className="lp-bar"
                  cx="28"
                  cy="28"
                  r="23"
                  strokeWidth="5"
                  strokeDasharray="144.5"
                  strokeDashoffset="144.5"
                  data-off="15.9"
                  transform="rotate(-90 28 28)"
                />
                <text x="28" y="34" textAnchor="middle" fontSize="18">
                  89
                </text>
              </svg>
              <div className="lp-lbl">
                Nota de Investimento<b>preço, região e revenda em um número só</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {stats && (
        <section className="lp-statsband" aria-label="A base hoje">
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
              Sem cadastro para explorar · Nota de investimento explicada para você tomar as
              melhores decisões
            </p>
          </div>
        </section>
      )}

      {/* The groundwork, made literal: what the listing gives vs what the report returns. */}
      <section className="lp-band lp-tint">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">do dado bruto à tomada de decisão</span>
            <h2>O edital do leilão traz o dado bruto. Nós te devolvemos o relatório.</h2>
            <p>
              As melhores oportunidades do Brasil, ordenadas por potencial de investimento. Um
              relatório completo para te apoiar no processo de decisão.
            </p>
          </div>

          <DataFlow />
        </div>
      </section>

      <section className="lp-band lp-chapter lp-alt lp-showband" id="exemplo">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">imóveis reais, notas reais</span>
            <h2>Veja a análise de um imóvel de verdade</h2>
            <p>
              Exemplo de análise de um imóvel real da base:{" "}
              <b>nota, melhores usos e análise de região</b>.
            </p>
          </div>

          <ShowcaseGallery />

          <div className="lp-sc-cta lp-reveal lp-d3">
            <Link className="lp-btn lp-solid lp-big" href="/dashboard">
              Ver imóveis como este
            </Link>
          </div>
        </div>
      </section>

      <section className="lp-band lp-chapter" id="recursos">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">o que fazemos por você</span>
            <h2>Da busca à tomada de decisão</h2>
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
                  <h3>Descreva o que procura. Nós encontramos as melhores oportunidades.</h3>
                  <p>
                    Fale como falaria com um corretor. A busca entende o seu objetivo e ordena por
                    relevância.
                  </p>
                  <ul className="lp-lpoints">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Busque imóveis usando linguagem natural
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Resultados ranqueados por relevância
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
                      <span className="lp-s">1º Leilão em 12 dias · R$ 385.000</span>
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
                      <span className="lp-s">2º Leilão em 20 dias · R$ 298.000</span>
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
                      Modelo próprio
                    </span>
                    <span className="lp-lindex">
                      <i>2</i> nota de investimento
                    </span>
                  </div>
                  <h3>Uma nota de 0 a 100 para rankear as melhores oportunidades</h3>
                  <p>
                    A nota combina desconto sobre a avaliação, preço frente ao mercado do bairro,
                    serviços no entorno e facilidade de revenda.
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
                      <span>Desconto sobre a avaliação</span>
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
                  <h3>A fachada do imóvel também vira nota</h3>
                  <p>
                    A partir da foto do anúncio, damos uma nota de 0 a 100 para{" "}
                    <b>fachada, acabamento e estado de conservação</b> — um sinal a mais para
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
                      alt="Fachada de apartamento em Ribeirão Preto/SP avaliada por visão computacional"
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
                        81<small>/100</small>
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
                    Salve os critérios que você procura e escolha a frequência: <b>diária</b> ou{" "}
                    <b>semanal</b>. Te notificamos sempre que um novo imóvel atender aos seus
                    critérios.
                  </p>
                  <ul className="lp-lpoints">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Você escolhe a cadência: diária ou semanal
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Critérios avançados
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Salve buscas e filtros como alertas
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      Recomendações e principais oportunidades
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

      <section className="lp-band lp-beat lp-tint">
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
                    <span>quanto o preço está abaixo do valor de avaliação pelo banco.</span>
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
                    <span>
                      proximidade de mercados, hospitais, escolas, farmácias, parques e mais 20
                      categorias de estabelecimentos.
                    </span>
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
                    <span>variedade de comércios e serviços por perto — uma região completa.</span>
                  </div>
                </li>
                <li>
                  <span className="lp-fi">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 12h4l3 8 4-16 3 8h4" />
                    </svg>
                  </span>
                  <div>
                    <b>Liquidez do tipo</b>
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
                    <b>Tese de investimento recomendada</b>
                    <span>o ponto mais forte do imóvel e tese de investimento recomendada.</span>
                  </div>
                </li>
              </ul>
              <div className="lp-weightnote">
                Pesos ajustados por tipo:
                <span className="lp-chip">Moradia</span>
                <span className="lp-chip">Terreno</span>
                <span className="lp-chip">Comercial</span>
              </div>
              <p className="lp-notacaveat">
                A nota compara oportunidades — ela não lê o edital nem garante bom negócio.{" "}
                <a href="#faq-garantia">Por quê?</a>
              </p>
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
              Além da nota principal, mostramos a tese de investimento recomendada para o imóvel.
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
                d: "universidades e escolas no entorno e imóvel compacto.",
              },
              {
                Spot: SpotFlip,
                k: "Reforma e revenda",
                d: "desconto, preço frente ao mercado e potencial de obra.",
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

      <section className="lp-band lp-chapter lp-alt">
        <div className="lp-wrap">
          <div className="lp-region">
            <div className="lp-txt lp-reveal">
              <span className="lp-seclabel">análise da região</span>
              <h3>Você não compra só o imóvel. Compra a região.</h3>
              <p>
                Dividimos o país em pequenas regiões e medimos, em cada uma, a distância real até
                centenas de milhares de pontos de referência — de escola e hospital a restaurante,
                shopping e ponto de ônibus.
              </p>
              <p>
                Regiões mais completas puxam a nota para cima. No mapa, quanto mais escura a célula,
                maior a densidade de serviços na região.
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
        </div>
      </section>

      <section className="lp-band">
        <div className="lp-wrap">
          <div className="lp-market">
            <div className="lp-txt lp-reveal">
              <span className="lp-seclabel">análise de preço de mercado</span>
              <h3>O preço é bom mesmo? Comparamos com o mercado real.</h3>
              <p>Buscamos anúncios reais de imóveis semelhantes em portais consolidados.</p>
              <div className="lp-sources">
                <span className="lp-yes">✓ +10 portais de imóveis analisados em todo o Brasil</span>
                <span className="lp-yes">✓ +300 mil imóveis comparados</span>
              </div>
              <p>
                Calculamos o preço <b>mediano por m²</b> da região e refinamos para o imóvel
                específico, comparando só anúncios de área e nº de quartos parecidos.
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
        </div>
      </section>

      <section className="lp-band lp-chapter lp-deep">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">coleções de imóveis</span>
            <h2>Coleções de imóveis, montadas automaticamente</h2>
            <p>
              Agrupamos imóveis parecidos entre si usando um algoritmo proprietário e de forma
              automática para você encontrar as melhores oportunidades para o seu objetivo.
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
                        alt={`${c.label} — imóvel ${n} da coleção`}
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
            <span className="lp-seclabel">nunca deixe passar uma oportunidade</span>
            <h2>Recomendações de imóveis para o seu perfil</h2>
            <p>
              Para cada imóvel, sugerimos imóveis similares para que você possa considerar em sua
              análise e tomada de decisão.
            </p>
          </div>

          <div className="lp-simseed lp-reveal">
            <div className="lp-simseed-photo">
              <Image
                src={SIMILAR_SEED.photo}
                alt={`Fachada do condomínio — ${SIMILAR_SEED.location}`}
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
                    alt={`Fachada — ${p.title}, ${p.location}`}
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
            Repare nos imóveis parecidos visualmente: fachadas praticamente idênticas e notas de{" "}
            <b>85 a 47</b>. O que separa um do outro é o preço — o de nota 85 sai 59% abaixo da
            avaliação; o de nota 47, só 41%, e custa 70% a mais.
          </p>
        </div>
      </section>

      <section className="lp-band lp-tint" id="casos">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">qual é o seu objetivo?</span>
            <h2>Cada objetivo possui uma tese de investimento diferente</h2>
            <p>Calculamos uma nota de uso para cada tese de investimento de forma automática.</p>
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
                  Medimos hotéis, restaurantes e universidades no entorno, além da distância do
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
                  Salve os critérios, escolha o aviso diário ou semanal e acompanhe as datas dos
                  seus favoritos na carteira.
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
            <h2>Escolha o plano para o seu objetivo</h2>
            <p>
              Comece a explorar as oportunidades agora mesmo, sem precisar criar conta. O plano
              gratuito oferece uma análise completa para você começar a usar a plataforma.
            </p>
          </div>

          <div className="lp-plans-grid lp-m-slide">
            {PLAN_CARDS.map((card, i) => {
              const plan = PLANS[card.role];
              const includes = PLAN_INCLUDES[card.role];
              // `canTrial` is false for anon, who is exactly who the offer is for.
              const offerTrial = ent.role === "anon" || canTrial(plan, ent.trial);
              return (
                <div
                  className={`lp-plan lp-reveal${card.popular ? " lp-pop" : ""}${i ? ` lp-d${i}` : ""}`}
                  key={card.role}
                >
                  {card.popular && <span className="lp-poppill">Mais popular</span>}
                  <div className="lp-phead">
                    <span className="lp-pname">{plan.label}</span>
                  </div>
                  <div className={`lp-price${plan.price === 0 ? " lp-free" : ""}`}>
                    <span className="lp-amt">{money(plan.price)}</span>
                    <span className="lp-per">/mês</span>
                  </div>
                  <div className="lp-trial">
                    {!offerTrial && card.trialOver ? card.trialOver : card.trial}
                  </div>
                  {card.subnote && <div className="lp-subnote">{card.subnote}</div>}
                  <ul>
                    {card.features.map((f) => (
                      <li key={f.text}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="m5 13 4 4L19 7" />
                        </svg>
                        <span>
                          {f.lead && <b>{f.lead}</b>}
                          {f.lead ? `${f.joiner ?? " — "}${f.text}` : f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {includes && (
                    <>
                      <div className="lp-pincludes">{includes.heading}</div>
                      <ul>
                        {includes.items.map((item) => (
                          <li key={item}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="m5 13 4 4L19 7" />
                            </svg>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {/* Básico asks for nothing here: the account decision belongs in the app, at
                      the moment a favourite or an alert actually needs one. */}
                  {card.role === "basic" ? (
                    <Link className="lp-pbtn" href="/dashboard">
                      Explorar sem cadastro
                    </Link>
                  ) : (
                    <PlanCta
                      target={card.role}
                      role={ent.role}
                      trial={ent.trial}
                      celebrateAt="/dashboard"
                      className={`lp-pbtn${card.popular ? " lp-solid" : ""}`}
                    />
                  )}
                </div>
              );
            })}
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
                O plano <b>{PLANS.platform.label}</b> dá acesso programático à mesma base via API,
                para conectar os nossos dados aos seus sistemas, fluxos e planilhas. Entre na lista
                de espera e ajude a moldar o que vem por aí.
              </p>
            </div>
            <ApiWaitlist />
          </div>

          <p className="lp-plans-anchor">
            Pronto para dar o próximo passo? Teste as análises avançadas e relatórios completos por{" "}
            {TRIAL_DAYS} dias gratuitamente. Sem fidelidade e sem cartão de crédito.
          </p>
          <p className="lp-plans-note">
            {PAYMENT_NOTE} O plano {PLANS.basic.label} não expira.
          </p>
        </div>
      </section>

      <section className="lp-band lp-alt" id="faq">
        <div className="lp-wrap">
          <div className="lp-sechead lp-reveal">
            <span className="lp-seclabel">dúvidas</span>
            <h2>Perguntas frequentes</h2>
            <p>Como calculamos, de onde vêm os dados e o que não fazemos.</p>
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
                  Cada imóvel recebe notas de 0 a 100 a partir de quatro componentes: <b>preço</b>{" "}
                  (desconto sobre a avaliação oficial do banco e preço por m² frente ao mercado
                  aberto na região), <b>região</b> (distância real até escolas, hospitais,
                  supermercados, parques e outras categorias de referência),{" "}
                  <b>características do imóvel</b> (tipo, área, quartos, vagas, situação de
                  ocupação) e <b>facilidade de revenda</b> daquele tipo naquela cidade.
                </p>
                <p>
                  As notas são <b>comparativas</b>: um ranking, não um selo de aprovação. Toda nota
                  vem com a explicação fator a fator e os pesos mudam por tipo: moradia, terreno e
                  comercial se valorizam de formas diferentes.
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
                  Que o imóvel está à frente da maioria dos concorrentes diretos dele — imóveis do
                  mesmo tipo, na mesma cidade. As notas são <b>relativas</b>: servem para ranquear e
                  comparar rapidamente, não para dizer que um negócio é bom em termos absolutos.
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
                  Não, e nunca vai ser. A nota olha preço, região e características do imóvel a
                  partir de dados públicos — ela não lê o edital, não avalia a situação jurídica e
                  não sabe de dívida de condomínio, ação judicial ou custo de desocupação. Antes de
                  dar lance, leia o edital e, se possível, consulte um advogado: a decisão continua
                  sendo sua.
                </p>
              </div>
            </details>
            <details id="faq-caixa">
              <summary>
                O Leilão Index é ligado à Caixa?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  Não. O Leilão Index é independente: coletamos, organizamos e analisamos a base
                  pública de leilões e venda direta da Caixa Econômica Federal. Não somos afiliados,
                  patrocinados nem endossados pela Caixa, não intermediamos lances nem recebemos
                  comissão sobre arremates — o lance é sempre dado no canal oficial da Caixa.
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
                  De três fontes públicas ou licenciadas: <b>imóveis, avaliação, lances e datas</b>{" "}
                  vêm da base de leilões e venda direta da Caixa;{" "}
                  <b>pontos de referência e distâncias</b>, de bases abertas de mapas; e{" "}
                  <b>preço de mercado</b>, de anúncios reais de imóveis parecidos em portais do
                  mercado aberto — portais de leilão ficam de fora de propósito, para a comparação
                  ser sempre com o mercado normal.
                </p>
              </div>
            </details>
            <details id="faq-pois">
              <summary>
                Quais lugares vocês medem em volta do imóvel?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  {stats
                    ? `São ${stats.poiCategories} categorias de lugar, medidas em ${countShort(stats.pois)} pontos mapeados: `
                    : "São as categorias abaixo, medidas em centenas de milhares de pontos mapeados: "}
                  {POI_ORDER.map((k) => POI_LABEL[k]).join(", ")}.
                </p>
                <p>
                  Para cada imóvel, calculamos a <b>distância real até o mais próximo</b> de cada
                  categoria — não apenas quantos existem no bairro. É isso que alimenta a nota da
                  região e as notas de uso: uma universidade a 700 m pesa no aluguel estudantil, um
                  parque a 200 m pesa na moradia familiar.
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
                  valor que a Caixa avaliou. A outra metade é o mercado — calculamos o preço{" "}
                  <b>mediano</b> por m² de imóveis parecidos anunciados na mesma região e refinamos
                  comparando só área e número de quartos semelhantes. Quando há poucos anúncios, a
                  estimativa se apoia numa área maior e reduzimos a confiança daquele número.
                </p>
              </div>
            </details>
            <details id="faq-colecoes">
              <summary>
                Como as coleções de imóveis parecidos são montadas?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  <b>Automaticamente, por semelhança.</b> O algoritmo compara os imóveis pelos
                  atributos que tornam dois anúncios realmente comparáveis — tipo, área, faixa de
                  preço e características da região — e junta numa mesma coleção os que ficam
                  próximos entre si. Ninguém monta coleção à mão e elas são recalculadas conforme a
                  base muda.
                </p>
                <p>
                  Cada coleção recebe um rótulo e o <b>objetivo que ela melhor atende</b>, para você
                  comparar semelhante com semelhante em vez de pôr lado a lado um apartamento na
                  capital e um terreno no interior. Imóveis que não se parecem com nenhum outro
                  ficam de fora até haver grupo para eles.
                </p>
              </div>
            </details>
            <details id="faq-recomendacoes">
              <summary>
                Como funcionam as recomendações?
                <span className="lp-chev">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="lp-ans">
                <p>
                  Elas partem de <b>um imóvel que você salvou</b>. Usamos esse imóvel como âncora,
                  procuramos na base os mais parecidos com ele e mostramos os que passam de um
                  limite de semelhança, ordenados pela Nota de Investimento. Quando ainda não há
                  semelhantes suficientes calculados para aquele imóvel, completamos com imóveis do
                  mesmo tipo na mesma cidade, também ordenados por nota.
                </p>
                <p>
                  Não é publicidade nem perfilamento: a recomendação olha só para o imóvel que você
                  escolheu, não para o seu comportamento. O recurso está disponível a partir do
                  plano {PLANS.investor.label}.
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
                  para refletir a base ativa do dia. Com uma conta, você pode salvar buscas e
                  receber por e-mail as novidades, no ritmo que escolher: diário ou semanal.
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
                  atualização e outra — quando isso acontece, marcamos o anúncio como inativo em vez
                  de apagá-lo.
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
                  um dado que falta é simplesmente ignorado — ele não vira ponto negativo. Já na{" "}
                  <b>Nota de Investimento</b>, faltar informação reduz a nota: com menos dados, há
                  menos certeza sobre o imóvel.
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
                  Não. Você descreve o que procura em linguagem natural — “apartamento de 2 quartos
                  até R$ 150 mil no Rio, perto de metrô” e traduzimos isso em filtros e notas. Para
                  dar o lance, aí sim vale estudar o edital: é lá que estão as regras de pagamento,
                  as dívidas do imóvel e a situação de ocupação.
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
                  Explorar a base, buscar por texto ou por proximidade, ver todas as notas e abrir a
                  leitura de região é gratuito e não exige cadastro. Uma conta grátis libera{" "}
                  {PLANS.basic.limits.favorites} favoritos e {PLANS.basic.limits.savedSearches}{" "}
                  alertas por e-mail. Os planos pagos liberam filtros avançados, coleções,
                  recomendações, painel de mercado, calendário de leilões, a análise completa de
                  região e a exportação em CSV/PDF.
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
            <h2>Arremate com confiança.</h2>
            <p>
              Te ajudamos a economizar horas de busca por imóveis de leilão ao recomendar as
              melhores oportunidades.
            </p>
            {/* Trial primary here: at the bottom of the page the free-browse CTA competes with the
                only conversion this band exists for. */}
            <div className="lp-row">
              <a className="lp-btn lp-solid lp-big" href="#planos">
                Testar {TRIAL_DAYS} dias sem cartão
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14m0 0-6-6m6 6-6 6" />
                </svg>
              </a>
              <Link className="lp-btn lp-ghost lp-big" href="/dashboard">
                Explorar imóveis
              </Link>
            </div>
            <div className="lp-fine">
              O plano {PLANS.investor.label} tem {TRIAL_DAYS} dias grátis, sem cartão e sem cobrança
              automática.
            </div>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap lp-footlinks">
          {/* Streamed: the catalogue read must not sit in front of the page. */}
          <Suspense fallback={null}>
            <SeoLinks />
          </Suspense>
        </div>
        <div className="lp-wrap">
          <a className="lp-brand" href="#top">
            <span className="lp-mark">
              <BrandLogo size={28} />
            </span>
            <span>
              <b>
                Leilão <span>Index</span>
              </b>
            </span>
          </a>
          <div className="lp-links">
            <a href="#recursos">Como funciona</a>
            <a href="#exemplo">Exemplo real</a>
            <a href="#casos">Objetivos</a>
            <a href="#planos">Planos</a>
            <a href="#faq">Dúvidas</a>
            <Link href="/termos">Termos de uso</Link>
            <Link href="/privacidade">Privacidade</Link>
            <a href="mailto:contato@leilaoindex.com.br">contato@leilaoindex.com.br</a>
          </div>
          <SocialRow />
          <span className="lp-fine">
            © 2026 Leilão Index · Dados da base pública de imóveis da Caixa Econômica Federal,
            atualizados diariamente. O Leilão Index não é afiliado, patrocinado nem endossado pela
            Caixa e não intermedeia lances. As notas são estimativas comparativas, não recomendação
            de investimento.
          </span>
        </div>
      </footer>
      <LandingEffects />
    </>
  );
}
