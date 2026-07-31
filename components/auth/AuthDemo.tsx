"use client";

import { useEffect, useState } from "react";
import { IconHome } from "@/lib/icons";

type Hit = { t: string; l: string; p: string; d: string; s: number };

const DEMOS: { q: string; hits: Hit[] }[] = [
  {
    q: "apartamento 2 quartos perto da universidade",
    hits: [
      {
        t: "Apto 48 m² · 2 quartos",
        l: "Universitário - 600 m da UFMS, Campo Grande",
        p: "R$ 120.278",
        d: "-40%",
        s: 95,
      },
      {
        t: "Apto 52 m² · 2 quartos",
        l: "Setor Leste Universitário, Goiânia",
        p: "R$ 186.000",
        d: "-37%",
        s: 88,
      },
      {
        t: "Apto 45 m² · 2 quartos",
        l: "Agronômica - perto da UFSC, Florianópolis",
        p: "R$ 264.000",
        d: "-31%",
        s: 82,
      },
    ],
  },
  {
    q: "casa ampla com quintal em Goiânia",
    hits: [
      {
        t: "Casa 220 m² · 4 quartos",
        l: "Setor Bueno, Goiânia",
        p: "R$ 540.000",
        d: "-35%",
        s: 94,
      },
      {
        t: "Casa 180 m² · 3 quartos",
        l: "Jardim América, Goiânia",
        p: "R$ 392.000",
        d: "-41%",
        s: 87,
      },
      {
        t: "Casa 260 m² · 4 quartos",
        l: "Setor Oeste, Goiânia",
        p: "R$ 615.000",
        d: "-33%",
        s: 80,
      },
    ],
  },
  {
    q: "apartamento 2 quartos até 100 mil em Campo Grande",
    hits: [
      {
        t: "Apto 40 m² · 2 quartos",
        l: "Conj. Res. Botafogo, Campo Grande",
        p: "R$ 73.993",
        d: "-50%",
        s: 96,
      },
      {
        t: "Apto 43 m² · 2 quartos",
        l: "Varandas do Campo, Campo Grande",
        p: "R$ 67.775",
        d: "-48%",
        s: 90,
      },
      {
        t: "Apto 41 m² · 2 quartos",
        l: "Pioneiros, Campo Grande",
        p: "R$ 87.234",
        d: "-41%",
        s: 83,
      },
    ],
  },
  {
    q: "casa para reformar e revender em Curitiba",
    hits: [
      { t: "Casa 96 m² · 3 quartos", l: "Boqueirão, Curitiba", p: "R$ 268.000", d: "-44%", s: 93 },
      {
        t: "Sobrado 120 m² · 3 quartos",
        l: "Sítio Cercado, Curitiba",
        p: "R$ 312.000",
        d: "-38%",
        s: 86,
      },
      { t: "Casa 78 m² · 2 quartos", l: "Xaxim, Curitiba", p: "R$ 231.000", d: "-41%", s: 80 },
    ],
  },
  {
    q: "casa com mais de 40% de desconto em Campo Grande",
    hits: [
      {
        t: "Casa 63 m² · 2 quartos",
        l: "Rancho Alegre II, Campo Grande",
        p: "R$ 114.234",
        d: "-46%",
        s: 93,
      },
      {
        t: "Casa 72 m² · 3 quartos",
        l: "Conj. Aero Rancho, Campo Grande",
        p: "R$ 145.883",
        d: "-45%",
        s: 86,
      },
      {
        t: "Casa 44 m² · 2 quartos",
        l: "Jardim Noroeste, Campo Grande",
        p: "R$ 71.654",
        d: "-43%",
        s: 80,
      },
    ],
  },
];

type Shown = Hit & { in: boolean; w: number };

export default function AuthDemo() {
  const [q, setQ] = useState("");
  const [meta, setMeta] = useState("");
  const [hits, setHits] = useState<Shown[]>([]);

  useEffect(() => {
    let alive = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const seed = (d: (typeof DEMOS)[number]) =>
      setHits(d.hits.map((h) => ({ ...h, in: reduce, w: reduce ? h.s : 0 })));

    async function type(text: string) {
      for (let i = 1; i <= text.length && alive; i++) {
        setQ(text.slice(0, i));
        await sleep(26 + Math.random() * 38);
      }
    }
    const erase = () => setQ("");

    async function loop() {
      if (reduce) {
        setQ(DEMOS[0].q);
        setMeta(`${DEMOS[0].hits.length} imóveis encontrados · ordenados por aderência`);
        seed(DEMOS[0]);
        return;
      }
      let i = 0;
      while (alive) {
        const d = DEMOS[i % DEMOS.length];
        await type(d.q);
        setMeta("Buscando…");
        await sleep(560);
        if (!alive) break;
        setMeta(`${d.hits.length} imóveis encontrados · ordenados por aderência`);
        seed(d);
        d.hits.forEach((_, j) =>
          setTimeout(
            () => alive && setHits((c) => c.map((x, k) => (k === j ? { ...x, in: true } : x))),
            90 + j * 130,
          ),
        );
        setTimeout(() => alive && setHits((c) => c.map((x) => ({ ...x, w: x.s }))), 260);
        await sleep(4300);
        setHits((c) => c.map((x) => ({ ...x, in: false })));
        await sleep(420);
        setMeta("");
        erase();
        await sleep(340);
        i++;
      }
    }
    loop();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="au-demo">
      <div className="au-demo-search">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="q">{q}</span>
        <span className="au-caret" />
      </div>
      <div className="au-demo-meta">{meta}</div>
      <div className="au-demo-res">
        {hits.map((h, i) => (
          <div className={`au-hit${h.in ? " in" : ""}`} key={i}>
            <span className="au-rank">{i + 1}</span>
            <div className={`au-thumb au-t${(i % 3) + 1}`}>
              <IconHome />
            </div>
            <div className="au-hitbody">
              <b>{h.t}</b>
              <span>{h.l}</span>
              <div className="au-scorebar">
                <i style={{ width: `${h.w}%` }} />
              </div>
            </div>
            <div className="au-hitprice">
              <b>{h.p}</b>
              <span className="au-disc">{h.d}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
