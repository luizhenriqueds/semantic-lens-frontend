"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import UsageMeter from "@/components/plan/UsageMeter";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import PropertyRow from "@/components/property/PropertyRow";
import { IconStar } from "@/lib/icons";
import { auctionInstant } from "@/lib/auctionTime";
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
    const t = auctionInstant(p.auctionDate);
    return t != null && t >= now && t <= now + 30 * 864e5;
  }).length;
  const avgDesc = saved.length
    ? Math.round(saved.reduce((s, p) => s + (p.discount ?? 0), 0) / saved.length)
    : 0;
  const economia = saved.reduce(
    (s, p) => s + Math.max(0, (p.appraisedValue ?? 0) - (p.saleValue ?? 0)),
    0,
  );

  if (!saved.length) {
    return (
      <EmptyState
        icon={<IconStar />}
        title="Sua carteira está vazia"
        action={
          <Link className="btn solid" href="/properties">
            Ver imóveis
          </Link>
        }
      >
        Abra um imóvel e toque em <b>Salvar na carteira</b> para acompanhar datas de praça, preços e
        avisos por aqui.
      </EmptyState>
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
        <UsageMeter used={saved.length} quota="favorites" noun="salvos" />
      </div>
      <div className="wlist">
        {saved.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p) => (
          <PropertyRow key={p.id} p={p} />
        ))}
      </div>
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
