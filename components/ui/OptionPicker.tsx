"use client";

// Single-select option row used by the advanced filters for small integer /
// discrete choices (instead of a slider). The first option is normally the
// "off" value (e.g. 0 = "Qualquer").
export default function OptionPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: { value: number; label: string }[];
  onChange: (v: number) => void;
}) {
  return (
    <div className="afield">
      <span>{label}</span>
      <div className="optrow">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`optbtn${value === o.value ? " on" : ""}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
