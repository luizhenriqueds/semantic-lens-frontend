"use client";

function pageList(page: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(count - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < count - 1) out.push("…");
  out.push(count);
  return out;
}

export default function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const count = Math.ceil(total / pageSize);
  if (count <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="pager">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Página anterior">
        ‹
      </button>
      {pageList(page, count).map((p, i) =>
        p === "…" ? (
          <span className="dots" key={`d${i}`}>
            …
          </span>
        ) : (
          <button key={p} className={p === page ? "on" : ""} onClick={() => onChange(p)}>
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === count}
        aria-label="Próxima página"
      >
        ›
      </button>
      <div className="info">
        Mostrando {from}-{to} de {total}
      </div>
    </div>
  );
}
