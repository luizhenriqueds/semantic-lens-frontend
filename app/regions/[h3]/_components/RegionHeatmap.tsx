import type { Region } from "@/lib/types";

function Streets() {
  return (
    <svg
      className="streets"
      preserveAspectRatio="none"
      viewBox="0 0 400 300"
      fill="none"
      stroke="var(--line)"
      strokeWidth="2"
    >
      <path d="M0 95H400M0 190H400M120 0V300M255 0V300" />
      <path d="M0 45L400 80M0 255L400 215" strokeWidth="1.4" />
    </svg>
  );
}

export default function RegionHeatmap({ region }: { region: Region }) {
  const spots = [
    { x: 50, y: 52, r: 170, i: 0.52, name: region.nome, hot: true },
    { x: 24, y: 30, r: 124, i: 0.3, name: region.neighbors[0]?.nome ?? "Arredores" },
    { x: 78, y: 28, r: 128, i: 0.28, name: region.neighbors[1]?.nome ?? "Arredores" },
    { x: 27, y: 80, r: 108, i: 0.2, name: region.neighbors[2]?.nome ?? "Arredores" },
    { x: 81, y: 76, r: 112, i: 0.24, name: "Arredores" },
  ];
  return (
    <>
      <div className="heatmap">
        <Streets />
        {spots.map((s, idx) => (
          <div
            key={idx}
            className="blob"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.r * 2,
              height: s.r * 2,
              background: `radial-gradient(circle, rgba(var(--heat),${s.i}) 0%, rgba(var(--heat),${(s.i * 0.45).toFixed(3)}) 38%, rgba(var(--heat),0) 70%)`,
            }}
          />
        ))}
        {spots.map((s, idx) => (
          <div
            key={`l${idx}`}
            className={`hlabel${s.hot ? " hot" : ""}`}
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          >
            {s.name}
          </div>
        ))}
      </div>
      <div className="heatscale">
        <span>Menos procura</span>
        <div
          className="heatbar"
          style={{
            background: "linear-gradient(90deg, rgba(var(--heat),.12), rgba(var(--heat),.85))",
          }}
        />
        <span>Mais procura</span>
      </div>
    </>
  );
}
