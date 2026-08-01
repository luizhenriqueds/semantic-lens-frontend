"use client";

import Image from "next/image";
import { useState } from "react";
import PlaceholderImage from "@/components/property/PlaceholderImage";

export default function PropertyPhoto({
  src,
  alt,
  sizes = "(max-width: 920px) 100vw, 320px",
  priority = false,
}: {
  src: string | null;
  alt: string;
  sizes?: string;
  /** Only for an above-the-fold LCP image; everything else stays lazy. */
  priority?: boolean;
}) {
  // Listings keep their photo URL after the source takes the file down. Keyed by src so a
  // new photo isn't hidden by the previous one's failure.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || src === failedSrc) return <PlaceholderImage />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      // Hotlinked on purpose: the optimizer has to fetch from Caixa server-side, which fails in
      // production and leaves every card on the placeholder.
      unoptimized
      onError={() => setFailedSrc(src)}
      style={{ objectFit: "cover" }}
    />
  );
}
