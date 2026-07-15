export default function MapExpandButton({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="mapexpand"
      onClick={onToggle}
      aria-label={expanded ? "Fechar mapa" : "Expandir mapa"}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {expanded ? (
          <path d="M6 6l12 12M18 6 6 18" />
        ) : (
          <path d="M15 3h6v6M9 21H3v-6M21 3l-8 8M3 21l8-8" />
        )}
      </svg>
    </button>
  );
}
