import Image from "next/image";
import PlaceholderImage from "@/components/property/PlaceholderImage";

export default function PropertyPhoto({
  src,
  alt,
  sizes = "(max-width: 920px) 100vw, 320px",
}: {
  src: string | null;
  alt: string;
  sizes?: string;
}) {
  if (!src) return <PlaceholderImage />;
  return (
    <Image src={src} alt={alt} fill sizes={sizes} unoptimized style={{ objectFit: "cover" }} />
  );
}
