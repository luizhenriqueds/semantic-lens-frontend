import Link from "next/link";
import { money } from "@/lib/format";
import { groupByAddress } from "@/lib/geo";
import { IconPin } from "@/lib/icons";
import type { Property } from "@/lib/types";

export default function SameAddressGroups({ properties }: { properties: Property[] }) {
  const groups = groupByAddress(properties)
    .filter((g) => g.length > 1)
    .sort((a, b) => b.length - a.length);
  if (!groups.length) return null;

  return (
    <div className="sameaddr">
      <div className="sameaddr-head">
        <IconPin width={16} height={16} strokeWidth={1.8} />
        Mais de um imóvel no mesmo endereço
      </div>
      <p className="sameaddr-note">
        No mapa esses imóveis aparecem empilhados num único ponto porque estão no mesmo local.
      </p>
      {groups.map((g) => (
        <div className="sameaddr-group" key={g[0].id}>
          <span className="sameaddr-badge">{g.length} imóveis</span>
          <div className="sameaddr-list">
            {g.map((p) => (
              <Link className="sameaddr-item" key={p.id} href={`/property/${p.id}`}>
                <span className="sa-title">{p.title}</span>
                <span className="sa-price">{money(p.saleValue)}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
