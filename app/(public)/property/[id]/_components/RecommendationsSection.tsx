"use client";

import SimilarCarousel from "@/components/property/SimilarCarousel";
import type { Rails } from "@/lib/property/rails";
import { useGatedSection } from "./useGatedSection";

// No wall and no skeleton: the rails sit at the end of the page, where both read as a dead end.
export default function RecommendationsSection({ id }: { id: string }) {
  const state = useGatedSection<{ rails: Rails }>(id, "recommendations", "recommendations");
  if (state.status !== "ready") return null;

  const { visual, similar, region, price } = state.data.rails;
  return (
    <>
      <SimilarCarousel
        title="Mais imóveis como este"
        subtitle="Imóveis com aparência parecida com este."
        items={visual}
      />
      <SimilarCarousel
        title="Quem viu este também considerou"
        subtitle="Outras oportunidades parecidas em perfil e preço."
        items={similar}
      />
      <SimilarCarousel title="Na mesma região" subtitle={region.subtitle} items={region.items} />
      <SimilarCarousel
        title="Na mesma faixa de preço"
        subtitle="Imóveis na mesma faixa de preço."
        items={price}
      />
    </>
  );
}
