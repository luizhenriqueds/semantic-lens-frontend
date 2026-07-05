import Image from "next/image";
import { IconCollection } from "@/lib/icons";

// Builds an uncluttered cover for a cluster by combining up to 4 property
// photos into a mosaic. The layout adapts to how many photos we have so a
// small group never looks empty and a big group never looks busy.
export default function ClusterThumb({ images, label }: { images: string[]; label: string }) {
  const imgs = images.slice(0, 4);

  if (imgs.length === 0) {
    return (
      <div className="ph-cover" aria-hidden>
        <IconCollection />
      </div>
    );
  }

  return (
    <div className={`clthumb n${imgs.length}`} aria-hidden>
      {imgs.map((src, i) => (
        <div className="clcell" key={`${src}-${i}`}>
          <Image
            src={src}
            alt={`Imóvel do grupo ${label}`}
            fill
            sizes="(max-width: 700px) 100vw, 340px"
            unoptimized
            style={{ objectFit: "cover" }}
          />
        </div>
      ))}
      <div className="clthumb-wash" />
    </div>
  );
}
