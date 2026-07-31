import Link from "next/link";
import { FEATURE_COPY } from "@/lib/entitlements/copy";
import { requiredPlan } from "@/lib/entitlements";

/** Not UpgradeWall: that draws app chrome. Renders no AutoPrint, so no dialog opens on a denial. */
export default function ReportDenied() {
  return (
    <div className="report-empty">
      <h1>Relatório indisponível</h1>
      <p>{FEATURE_COPY.export.blurb}</p>
      <p>
        Disponível no plano <b>{requiredPlan("export").label}</b>.
      </p>
      <Link className="btn solid" href="/settings">
        Ver planos
      </Link>
    </div>
  );
}
