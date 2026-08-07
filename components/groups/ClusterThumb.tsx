"use client";

import Image from "next/image";
import { useState } from "react";
import { IconCollection } from "@/lib/icons";

// Own re-hosted images can go through next/image's optimizer; hotlinked fallbacks can't
// (see PropertyPhoto's `unoptimized`).
const SUPABASE_STORAGE_PREFIX = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`
  : null;
const isOwnStorage = (src: string) =>
  SUPABASE_STORAGE_PREFIX != null && src.startsWith(SUPABASE_STORAGE_PREFIX);

// Builds an uncluttered cover for a cluster by combining up to 4 property
// photos into a mosaic. The layout adapts to how many photos we have so a
// small group never looks empty and a big group never looks busy.
export default function ClusterThumb({ images, label }: { images: string[]; label: string }) {
  // Drop a photo from the mosaic instead of leaving a broken image in its cell.
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const imgs = images.filter((src) => !failed.has(src)).slice(0, 4);

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
            alt={`Imóvel da coleção ${label}`}
            fill
            sizes="(max-width: 700px) 100vw, 340px"
            unoptimized={!isOwnStorage(src)}
            onError={() => setFailed((prev) => new Set(prev).add(src))}
            style={{ objectFit: "cover" }}
          />
        </div>
      ))}
      <div className="clthumb-wash" />
    </div>
  );
}
