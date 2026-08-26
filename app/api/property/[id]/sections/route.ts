import { NextResponse } from "next/server";
import { getFreshness, getMarketComparables, getPropertyById } from "@/lib/data";
import { PLANS } from "@/lib/entitlements/plans";
import { getEntitlements } from "@/lib/entitlements/server";
import { recommendationRails } from "@/lib/property/rails";

// /property/[id] is cached, so its HTML cannot carry the per-plan sections. They are fetched from
// here once the browser knows who is asking; the gate stays on this side.
export const dynamic = "force-dynamic";

export const maxDuration = 20;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const section = new URL(request.url).searchParams.get("section");

  // Must stay ahead of getEntitlements(): reading auth attaches Set-Cookie, which stops the CDN
  // from absorbing the repeat views this adds.
  if (section === "freshness") {
    return NextResponse.json(await getFreshness(id), {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
    });
  }

  const ent = await getEntitlements();

  if (section === "market") {
    if (!ent.can("marketCompare")) return NextResponse.json({ locked: true });
    const p = await getPropertyById(id);
    if (!p) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const stats = await getMarketComparables(p.uf, p.city, p.neighborhood, p.propertyType, p.area);
    return NextResponse.json({
      stats,
      lance: p.saleValue,
      area: p.area,
      appraised: p.appraisedValue,
    });
  }

  if (section === "recommendations") {
    if (!ent.can("recommendations")) return NextResponse.json({ locked: true });
    const p = await getPropertyById(id);
    if (!p) return NextResponse.json({ error: "not_found" }, { status: 404 });
    // `limit()` is null for admins, who get the largest rail rather than an unbounded one.
    const take = ent.limit("recommendations") ?? PLANS.professional.limits.recommendations;
    return NextResponse.json({ rails: await recommendationRails(p, take) });
  }

  return NextResponse.json({ error: "unknown_section" }, { status: 400 });
}
