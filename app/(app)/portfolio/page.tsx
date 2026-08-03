import PortfolioClient from "./_components/PortfolioClient";
import { getPropertiesByIds } from "@/lib/data";
import { getFavoriteIds } from "@/lib/data/favorites";
import { getUser } from "@/lib/supabase/server";

export default async function PortfolioPage() {
  const { supabase, user } = await getUser();
  const ids = user ? await getFavoriteIds(supabase) : [];
  const properties = ids.length ? await getPropertiesByIds(ids) : [];
  return (
    <section className="view">
      <div className="pagehead">
        <h1>Minha carteira</h1>
        <p>
          Os imóveis que você salvou para acompanhar. Veja um resumo e clique para abrir os
          detalhes.
        </p>
      </div>
      <PortfolioClient properties={properties} savedIds={ids} />
    </section>
  );
}
