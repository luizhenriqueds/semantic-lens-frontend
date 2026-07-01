export default function Spinner({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="spinbox">
      <div className="spinner" role="status" aria-label="Carregando" />
      {label && <span>{label}</span>}
    </div>
  );
}
