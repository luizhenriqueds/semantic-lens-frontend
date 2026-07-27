import Link from "next/link";

export type SectionHeadProps = {
  title: string;
  why?: string;
  /** Small uppercase badge next to the title, e.g. "raro". */
  pill?: string;
  pillTone?: "primary" | "warn";
  /** Rendered between the title and the "Ver todos" link. */
  aside?: React.ReactNode;
  moreHref?: string | null;
  moreLabel?: string;
};

export default function SectionHead({
  title,
  why,
  pill,
  pillTone = "primary",
  aside,
  moreHref,
  moreLabel,
}: SectionHeadProps) {
  return (
    <div className="sectitle wide">
      <div className="tx">
        <h2>
          {title}
          {pill && <span className={`tagpill${pillTone === "warn" ? " warn" : ""}`}>{pill}</span>}
        </h2>
        {why && <div className="why">{why}</div>}
      </div>
      <div className="grow" />
      {aside}
      {moreHref && (
        <Link className="more" href={moreHref}>
          {moreLabel ?? "Ver todos"} →
        </Link>
      )}
    </div>
  );
}
