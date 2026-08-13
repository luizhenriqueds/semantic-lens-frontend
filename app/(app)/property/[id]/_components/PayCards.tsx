import { IconCheck, IconClose } from "@/lib/icons";
import type { Property } from "@/lib/types";

// `false` here means the edital says no, not "unknown": both columns come back non-null.
export default function PayCards({ p }: { p: Property }) {
  const conditions = [
    { k: "Financiamento", on: p.acceptsFinancing },
    { k: "FGTS", on: p.acceptsFgts },
  ];

  return (
    <div className="paycards">
      {conditions.map((c) => (
        <div className={`paycard${c.on ? " on" : ""}`} key={c.k}>
          <span className="pc-ic">
            {c.on ? <IconCheck width={17} height={17} /> : <IconClose width={17} height={17} />}
          </span>
          <div>
            <div className="pc-k">{c.k}</div>
            <div className="pc-v">{c.on ? "Aceita" : "Não aceita"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
