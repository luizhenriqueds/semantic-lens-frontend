"use client";

import { useRef } from "react";
import Link from "next/link";
import PropertyPhoto from "@/components/property/PropertyPhoto";
import { money } from "@/lib/format";
import type { Property } from "@/lib/types";
import { IconBack } from "@/lib/icons";

export type RecItem = { p: Property; match: number };

export default function SimilarCarousel({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: RecItem[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (!items.length) return null;

  const scroll = (dir: number) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="recsec">
      <div className="rechead">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="recnav">
          <button type="button" onClick={() => scroll(-1)} aria-label="Anterior">
            <IconBack width={18} height={18} strokeWidth={2} />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Próximo">
            <IconBack width={18} height={18} strokeWidth={2} style={{ transform: "scaleX(-1)" }} />
          </button>
        </div>
      </div>

      <div className="rectrack" ref={trackRef}>
        {items.map(({ p, match }) => (
          <Link className="reccard" href={`/property/${p.id}`} key={p.id}>
            <div className="recphoto">
              <PropertyPhoto src={p.image} alt={`Foto do imóvel: ${p.title}`} sizes="220px" />
              <span className="recmatch">{match}% parecido</span>
              {p.inactive && <span className="statuspill">Inativo</span>}
            </div>
            <div className="recbody">
              <div className="rectype">{p.propertyType}</div>
              <div className="rectitle">{p.title}</div>
              <div className="recloc">
                {p.neighborhood} · {p.city}/{p.uf}
              </div>
              <div className="recprice">{money(p.saleValue)}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
