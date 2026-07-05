"use client";

// A labelled range slider used by the advanced property filters. `off` marks
// the value that means "no filter" (shown greyed with the `offLabel`), and the
// filled portion of the track is drawn relative to the active range so the
// control reads clearly in both light and dark themes.
export default function Slider({
  label,
  value,
  min,
  max,
  step,
  off,
  offLabel = "Qualquer",
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  off: number;
  offLabel?: string;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const isOff = value === off;
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <label className="afield sliderfield">
      <span className="slabel">
        {label}
        <b className={isOff ? "off" : ""}>{isOff ? offLabel : format(value)}</b>
      </span>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ["--fill" as string]: `${pct}%` }}
        aria-label={label}
      />
    </label>
  );
}
