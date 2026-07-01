import Link from "next/link";
import type { Cluster } from "@/lib/types";
import { PROFILE_LABEL } from "@/lib/format";
import { IconCollection } from "@/lib/icons";

export default function CollectionCard({ c }: { c: Cluster }) {
  return (
    <Link className="plcard" href={`/properties?cluster=${c.clusterId}`}>
      <div className="plcover">
        <div className="ph-cover" aria-hidden>
          <IconCollection />
        </div>
        <span className="plcount">{c.size} imóveis</span>
      </div>
      <div className="plbody">
        <h3>{c.label}</h3>
        {c.description && <p>{c.description}</p>}
        <div className="foot">
          {c.profile && <span className="perfil">{PROFILE_LABEL[c.profile]}</span>}
          <span className="open">Ver imóveis ›</span>
        </div>
      </div>
    </Link>
  );
}
