import LavraLogo from "@/components/brand/LavraLogo";
import PrintBar from "./PrintBar";
import { fmtDay } from "@/lib/format";

/** Frame shared by every report. Server-only, so `generatedAt` cannot hydrate differently. */
export default function ReportShell({
  title,
  subtitle,
  filters,
  generatedAt,
  children,
}: {
  title: string;
  subtitle?: string | null;
  filters?: string | null;
  generatedAt: Date;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="report-head">
        <div className="report-brand">
          <LavraLogo size={26} />
          <span>Lavra</span>
          <small>Relatório</small>
        </div>
        <h1>{title}</h1>
        {subtitle && <p className="report-sub">{subtitle}</p>}
        {filters && (
          <p className="report-filters">
            <b>Filtros aplicados:</b> {filters}
          </p>
        )}
        <p className="report-when">Gerado em {fmtDay(generatedAt.toISOString())}</p>
      </header>

      <PrintBar />

      {children}

      <footer className="report-foot">
        Lavra · Dados públicos dos editais da Caixa Econômica Federal. Relatório informativo; não
        constitui recomendação de investimento. Confira sempre o edital antes de dar um lance.
      </footer>
    </>
  );
}
