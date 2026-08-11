"use client";

import PropertiesAnalysis from "@/app/(app)/properties/_components/PropertiesAnalysis";
import type { AnalysisData, ProximityData } from "@/lib/facets/analysis";

/** PropertiesAnalysis needs an `onPickRange` callback, which cannot cross the RSC boundary. */
export default function AnalysisReportBody({
  data,
  proximity,
}: {
  data: AnalysisData;
  proximity?: ProximityData;
}) {
  return (
    <PropertiesAnalysis data={data} proximity={proximity} onPickRange={() => {}} hideScatter />
  );
}
