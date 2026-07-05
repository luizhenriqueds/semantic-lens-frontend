"use client";

import { useEffect, useState } from "react";

type Match = {
  query: string;
  regionScore: string;
  coord: string;
  res: string;
  disc: string;
  score: number;
  title: string;
  loc: string;
  now: string;
  was: string;
};

const MATCHES: Match[] = [
  {
    query: "casa com quintal em Curitiba",
    regionScore: "8,1",
    coord: "-25.4372, -49.2699",
    res: "res 9 · 0,10 km²",
    disc: "-38%",
    score: 8.1,
    title: "Casa 128 m²",
    loc: "Portão · Curitiba",
    now: "R$ 268.000",
    was: "R$ 432.000",
  },
  {
    query: "apartamento para revender",
    regionScore: "8,4",
    coord: "-23.5613, -46.6565",
    res: "res 9 · 0,10 km²",
    disc: "-46%",
    score: 8.4,
    title: "Apartamento 72 m²",
    loc: "Vila Mariana · São Paulo",
    now: "R$ 312.000",
    was: "R$ 578.000",
  },
  {
    query: "studio perto do metrô",
    regionScore: "7,9",
    coord: "-23.5980, -46.6390",
    res: "res 9 · 0,09 km²",
    disc: "-29%",
    score: 7.9,
    title: "Studio 38 m²",
    loc: "Paraíso · São Paulo",
    now: "R$ 205.000",
    was: "R$ 289.000",
  },
];

const HINTS = [
  "Casa para família",
  "Comprar, reformar e revender",
  "Aluguel para estudantes",
  "Imóvel com boa liquidez",
];

const RING_C = 2 * Math.PI * 18; // circumference of the score ring

function MapTerrain({ active }: { active: number }) {
  return (
    <svg
      className="lp-map-terrain"
      viewBox="0 0 400 440"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g className="lp-map-grid-a" fill="none">
        <path d="M-10 90 C 90 70, 180 130, 410 100" />
        <path d="M-10 210 C 120 190, 240 250, 410 220" />
        <path d="M-10 330 C 100 320, 260 360, 410 330" />
        <path d="M80 -10 C 70 120, 110 300, 90 450" />
        <path d="M210 -10 C 200 140, 230 320, 215 450" />
        <path d="M330 -10 C 320 120, 350 300, 335 450" />
      </g>
      <g className="lp-map-grid-b" fill="none" strokeDasharray="5 6">
        <path d="M-10 150 C 130 140, 250 180, 410 160" />
        <path d="M-10 270 C 130 260, 250 300, 410 280" />
        <path d="M150 -10 C 140 150, 160 320, 150 450" />
        <path d="M270 -10 C 260 150, 290 320, 275 450" />
      </g>
      <g className="lp-map-hexes">
        <polygon points="200,96 243,121 243,171 200,196 157,171 157,121" fillOpacity="0.42" />
        <polygon points="286,96 329,121 329,171 286,196 243,171 243,121" fillOpacity="0.22" />
        <polygon points="114,96 157,121 157,171 114,196 71,171 71,121" fillOpacity="0.30" />
        <polygon points="243,171 286,196 286,246 243,271 200,246 200,196" fillOpacity="0.16" />
        <polygon points="157,171 200,196 200,246 157,271 114,246 114,196" fillOpacity="0.20" />
        <polygon points="243,21 286,46 286,96 243,121 200,96 200,46" fillOpacity="0.08" />
        <polygon points="157,21 200,46 200,96 157,121 114,96 114,46" fillOpacity="0.12" />
        <polygon points="200,246 243,271 243,321 200,346 157,321 157,271" fillOpacity="0.10" />
        <polygon points="372,96 415,121 415,171 372,196 329,171 329,121" fillOpacity="0.14" />
        <polygon points="28,96 71,121 71,171 28,196 -15,171 -15,121" fillOpacity="0.12" />
      </g>
      <g transform="translate(200 146)">
        <circle key={active} className="lp-map-ping" r="17" fill="none" />
        <circle className="lp-map-marker-ring" r="17" strokeWidth="3" />
        <path
          className="lp-map-marker-pin"
          d="M0-6.5c-3 0-5.4 2.3-5.4 5.2 0 3.8 5.4 8.3 5.4 8.3s5.4-4.5 5.4-8.3C5.4-4.2 3-6.5 0-6.5Z"
        />
      </g>
    </svg>
  );
}

export default function HeroSearchScene() {
  const [text, setText] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(MATCHES[0].query);
      return;
    }
    let qi = 0;
    let ci = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const q = MATCHES[qi].query;
      setText(q.slice(0, ci));
      let delay = deleting ? 22 : 52;
      if (!deleting && ci === q.length) {
        setActive(qi); // query fully typed → reveal its match on the map
        delay = 2100;
        deleting = true;
      } else if (deleting && ci === 0) {
        deleting = false;
        qi = (qi + 1) % MATCHES.length;
        delay = 420;
      } else {
        ci += deleting ? -1 : 1;
      }
      timer = setTimeout(tick, delay);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  const m = MATCHES[active];
  const ringDash = `${(m.score / 10) * RING_C} ${RING_C}`;

  return (
    <>
      <div className="lp-searchzone-left lp-reveal">
        <div className="lp-searchzone-head">
          <span className="lp-seclabel">{"// busca em linguagem natural"}</span>
          <h2>Busque como você fala. A gente entende o resto.</h2>
          <p>
            Nada de filtros e jargão de edital. Escreva o que procura em português corrido e a Lavra
            traduz para critérios reais de leilão, matrícula e região.
          </p>
        </div>

        <div className="lp-demo">
          <form className="lp-demo-field" action="/search" method="get">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <div className="lp-demo-inputwrap">
              <input
                name="q"
                className="lp-demo-input"
                placeholder=" "
                aria-label="Buscar imóveis"
                autoComplete="off"
              />
              <span className="lp-demo-typed" aria-hidden="true">
                {text}
                <span className="lp-demo-caret" />
              </span>
            </div>
            <button type="submit" className="lp-demo-go">
              Buscar
            </button>
          </form>
          <div className="lp-demo-hints" aria-hidden="true">
            {HINTS.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          <div className="lp-demo-note">
            <span className="mono">~140ms</span> para cruzar seu objetivo com editais, matrículas e
            dados da região.
          </div>
        </div>
      </div>

      <div
        className="lp-mapcard lp-reveal"
        role="img"
        aria-label={`Mapa de análise regional: ${m.title} em ${m.loc}`}
      >
        <MapTerrain active={active} />

        <span className="lp-maptag">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M12 2 20.5 7v10L12 22 3.5 17V7L12 2Z" />
          </svg>
          Célula H3 · Score da região{" "}
          <b key={m.regionScore} className="lp-maptag-score">
            {m.regionScore}
          </b>
        </span>
        <span key={`c-${active}`} className="lp-coord lp-coord-a" style={{ top: 64, right: 16 }}>
          {m.coord}
        </span>
        <span className="lp-coord" style={{ bottom: 116, left: 16 }}>
          {m.res}
        </span>

        <div className="lp-fcard">
          <div key={active} className="lp-fcard-swap">
            <span className="lp-fcard-disc">{m.disc}</span>
            <svg
              className="lp-fcard-ring"
              width="44"
              height="44"
              viewBox="0 0 44 44"
              aria-hidden="true"
            >
              <circle
                className="lp-ring-track"
                cx="22"
                cy="22"
                r="18"
                fill="none"
                strokeWidth="5"
              />
              <circle
                className="lp-ring-fill"
                cx="22"
                cy="22"
                r="18"
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={ringDash}
                transform="rotate(-90 22 22)"
              />
              <text
                className="lp-ring-text"
                x="22"
                y="26"
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
              >
                {m.regionScore}
              </text>
            </svg>
            <div className="lp-fcard-info">
              <b>{m.title}</b>
              <span className="lp-fcard-loc">{m.loc}</span>
            </div>
            <div className="lp-fcard-price">
              <div className="lp-fcard-now">{m.now}</div>
              <div className="lp-fcard-was">{m.was}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
