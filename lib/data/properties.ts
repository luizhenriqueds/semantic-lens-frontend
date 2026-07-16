import { supabase } from "@/lib/supabase";
import { deriveTitle, titleCase } from "@/lib/format";
import type { ProfileKey, Property } from "@/lib/types";
import { cached, CLUSTER_RUN, fetchAllRows, num } from "./client";

const PROPERTY_COLS = [
  "property_id,property_type,uf,city,neighborhood,raw_address",
  "area_m2,bedrooms,parking_spots,year_built,occupancy_status,canonical_description",
  "h3_r8,image_path,image_source_url,lat,lon,is_active",
  "visual_score,visual_note,visual_age,price_rank,size_rank,center_proximity_m",
].join(",");

const LISTING_COLS = [
  "property_id,appraised_value,sale_value,discount,modality",
  "auction_date,link,snapshot_date,accepts_financing,accepts_fgts",
].join(",");

const SCORE_COLS =
  "property_id,flip,liquidity,airbnb,student,family,commercial,convenience,investment";

// property_id -> { category: nearest distance in metres }, aggregated in Postgres.
async function loadNearestPoi(): Promise<Map<string, Record<string, number>>> {
  const list = await fetchAllRows<{ property_id: string; nearest: Record<string, number> | null }>(
    "property_nearest_poi",
    (from, to) => supabase.rpc("property_nearest_poi").order("property_id").range(from, to),
  );
  return new Map(list.map((r) => [r.property_id, r.nearest ?? {}]));
}

function pickImage(p: {
  image_source_url?: string | null;
  image_path?: string | null;
}): string | null {
  if (p.image_source_url) return p.image_source_url;
  if (p.image_path?.startsWith("http")) return p.image_path;
  return null;
}

async function loadProperties(): Promise<Property[]> {
  const [props, listingRows, scoreRows, profileRows, pclRows, clusterRows, nearestPoiMap] =
    await Promise.all([
      fetchAllRows<any>("properties", (f, t) =>
        supabase.from("properties").select(PROPERTY_COLS).order("property_id").range(f, t),
      ),
      fetchAllRows<any>("listings", (f, t) =>
        supabase.from("listings").select(LISTING_COLS).order("id").range(f, t),
      ),
      fetchAllRows<any>("property_scores", (f, t) =>
        supabase
          .from("property_scores")
          .select(SCORE_COLS)
          .eq("score_version", 1)
          .order("property_id")
          .range(f, t),
      ),
      fetchAllRows<any>("property_profiles", (f, t) =>
        supabase
          .from("property_profiles")
          .select("property_id,profile,score,is_primary")
          .eq("is_primary", true)
          .order("property_id")
          .range(f, t),
      ),
      fetchAllRows<any>("property_clusters", (f, t) =>
        supabase
          .from("property_clusters")
          .select("property_id,cluster_id")
          .eq("cluster_run_id", CLUSTER_RUN)
          .order("property_id")
          .range(f, t),
      ),
      fetchAllRows<any>("clusters", (f, t) =>
        supabase
          .from("clusters")
          .select("cluster_id,label,profile")
          .eq("cluster_run_id", CLUSTER_RUN)
          .order("cluster_id")
          .range(f, t),
      ),
      loadNearestPoi(),
    ]);

  const listingMap = new Map<string, any>();
  for (const l of listingRows) {
    const cur = listingMap.get(l.property_id);
    if (!cur || (l.snapshot_date ?? "") > (cur.snapshot_date ?? "")) {
      listingMap.set(l.property_id, l);
    }
  }
  const scoreMap = new Map(scoreRows.map((s) => [s.property_id, s]));
  const profileMap = new Map(profileRows.map((p) => [p.property_id, p]));
  const pclMap = new Map(pclRows.map((c) => [c.property_id, c.cluster_id]));
  const clusterMap = new Map(clusterRows.map((c) => [c.cluster_id, c]));

  return (props as any[]).map((p): Property => {
    const l = listingMap.get(p.property_id);
    const s = scoreMap.get(p.property_id);
    const prof = profileMap.get(p.property_id);
    const cid = pclMap.get(p.property_id);
    const cl = cid != null && cid !== -1 ? clusterMap.get(cid) : undefined;
    return {
      id: p.property_id,
      propertyType: p.property_type ?? "Imóvel",
      uf: p.uf ?? "",
      city: titleCase(p.city ?? ""),
      neighborhood: p.neighborhood ?? "",
      rawAddress: p.raw_address || null,
      area: num(p.area_m2),
      bedrooms: num(p.bedrooms),
      parkingSpots: num(p.parking_spots),
      yearBuilt: num(p.year_built),
      occupancyStatus: p.occupancy_status || null,
      title: deriveTitle(p.property_type ?? "Imóvel", num(p.bedrooms), p.neighborhood ?? ""),
      description: p.canonical_description || null,
      image: pickImage(p),
      appraisedValue: num(l?.appraised_value),
      saleValue: num(l?.sale_value),
      discount: num(l?.discount),
      modality: l?.modality || null,
      auctionDate: l?.auction_date || null,
      link: l?.link || null,
      inactive: p.is_active === false,
      acceptsFinancing: l?.accepts_financing === true,
      acceptsFgts: l?.accepts_fgts === true,
      scores: {
        flip: num(s?.flip),
        liquidity: num(s?.liquidity),
        airbnb: num(s?.airbnb),
        student: num(s?.student),
        family: num(s?.family),
        commercial: num(s?.commercial),
        convenience: num(s?.convenience),
        investment: num(s?.investment),
      },
      profile: (prof?.profile as ProfileKey) ?? null,
      profileScore: num(prof?.score),
      clusterId: cid != null && cid !== -1 ? cid : null,
      clusterLabel: cl?.label ?? null,
      h3: p.h3_r8 || null,
      lat: num(p.lat),
      lon: num(p.lon),
      visualScore: num(p.visual_score),
      visualNote: p.visual_note || null,
      visualAge: (["novo", "intermediario", "antigo"].includes(p.visual_age)
        ? p.visual_age
        : null) as Property["visualAge"],
      priceRank: num(p.price_rank),
      sizeRank: num(p.size_rank),
      centerProximity: num(p.center_proximity_m),
      nearestPoi: nearestPoiMap.get(p.property_id) ?? {},
    };
  });
}

export const getProperties = cached(loadProperties, "properties");

export async function getProperty(id: string): Promise<Property | null> {
  const all = await getProperties();
  return all.find((p) => p.id === id) ?? null;
}
