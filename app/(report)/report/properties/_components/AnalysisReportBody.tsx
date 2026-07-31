"use client";

import PropertiesAnalysis from "@/app/(app)/properties/_components/PropertiesAnalysis";
import type { AnalysisData } from "@/lib/facets/analysis";

/** PropertiesAnalysis needs an `onPickRange` callback, which cannot cross the RSC boundary. */
export default function AnalysisReportBody({ data }: { data: AnalysisData }) {
  return <PropertiesAnalysis data={data} onPickRange={() => {}} hideScatter />;
}
