import Image from "next/image";
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
  if (!src) return <PlaceholderImage />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized
      style={{ objectFit: "cover" }}
    />
  );
}
