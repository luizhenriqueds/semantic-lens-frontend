"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import PropertyRow from "@/components/property/PropertyRow";
import { moneyShort } from "@/lib/format";
import { useSaved } from "@/lib/saved";
import type { Property } from "@/lib/types";

const PAGE_SIZE = 25;

export default function PortfolioClient({ properties }: { properties: Property[] }) {
  const { ids } = useSaved();
  const [page, setPage] = useState(1);
  const saved = useMemo(() => properties.filter((p) => ids.includes(p.id)), [properties, ids]);
  useEffect(() => setPage(1), [ids.length]);

  const now = Date.now();
  const in30 = saved.filter((p) => {
    if (!p.dataLeilao) return false;
    const t = new Date(p.dataLeilao).getTime();
    return t >= now && t <= now + 30 * 864e5;
  }).length;
  const avgDesc = saved.length
    ? Math.round(saved.reduce((s, p) => s + (p.desc ?? 0), 0) / saved.length)
    : 0;
  const economia = saved.reduce((s, p) => s + Math.max(0, (p.aval ?? 0) - (p.lance ?? 0)), 0);

  if (!saved.length) {
    return (
      <div className="empty">
        Você ainda não salvou nenhum imóvel.
        <br />
        Abra um imóvel e toque em <b>Salvar na carteira</b> para acompanhá-lo aqui.
        <br />
        <br />
        <Link className="btn solid" href="/properties" style={{ display: "inline-flex" }}>
          Ver imóveis
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="statgrid">
        <div className="stat">
          <div className="k">Imóveis salvos</div>
          <div className="v">{saved.length}</div>
        </div>
        <div className="stat">
          <div className="k">Leilões nos próximos 30 dias</div>
          <div className="v accent">{in30}</div>
        </div>
        <div className="stat">
          <div className="k">Desconto médio</div>
          <div className="v">{avgDesc}%</div>
        </div>
        <div className="stat">
          <div className="k">Economia potencial</div>
          <div className="v accent">{moneyShort(economia)}</div>
        </div>
      </div>
      <div className="sectitle">
        <h2>Imóveis acompanhados</h2>
      </div>
      {saved.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p) => (
        <PropertyRow key={p.id} p={p} />
      ))}
      <Pagination
        page={page}
        total={saved.length}
        pageSize={PAGE_SIZE}
        onChange={(p) => {
          setPage(p);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </>
  );
}
