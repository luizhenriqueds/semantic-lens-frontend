import "@/app/(report)/report.css";

// No ToastProvider or PlanProvider: nothing under a report may draw app chrome into the PDF.
export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <div className="report">{children}</div>;
}
