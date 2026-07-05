import { NextResponse } from "next/server";
import { getSemanticCacheStats } from "@/lib/semanticCache";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getSemanticCacheStats());
}
