import AutoPrint from "@/app/(report)/_components/AutoPrint";
import ReportDenied from "@/app/(report)/_components/ReportDenied";
import ReportShell from "@/app/(report)/_components/ReportShell";
import AnalysisReportBody from "./_components/AnalysisReportBody";
import { describeCriteria, hasAnyCriteria } from "@/lib/alerts";
import { getAnalysis, getProximity } from "@/lib/data";
import { getEntitlements } from "@/lib/entitlements/server";
import { toRpcFilters } from "@/lib/filters/contract";
import { gateFilters } from "@/lib/filters/gate";
import { parsePropertySearchParams } from "@/lib/filters/propertiesUrl";

export const dynamic = "force-dynamic"; // getEntitlements reads cookies

export const metadata = { title: "Relatório · Análise dos filtros" };

export default async function PropertiesReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ent = await getEntitlements();
  if (!ent.can("export")) return <ReportDenied />;

  // Same parse and same plan gate as /properties, so the button can forward the query verbatim.
  const { filters } = gateFilters(parsePropertySearchParams(await searchParams).filters, ent);
  const rpc = toRpcFilters(filters);
  // A missing pair of charts is not worth failing a print job for.
  const [data, proximity] = await Promise.all([
    getAnalysis(filters),
    getProximity(filters).catch(() => undefined),
  ]);

  return (
    <ReportShell
      title="Análise dos imóveis filtrados"
      subtitle={`${data.count.toLocaleString("pt-BR")} ${
        data.count === 1 ? "imóvel" : "imóveis"
      } no recorte`}
      // describeCriteria answers "Novos imóveis" for an empty set - alert language, wrong here.
      filters={hasAnyCriteria(rpc) ? describeCriteria(rpc) : "Todos os imóveis"}
      generatedAt={new Date()}
    >
      <section className="report-section">
        <AnalysisReportBody data={data} proximity={proximity} />
      </section>

      <AutoPrint />
    </ReportShell>
  );
}
