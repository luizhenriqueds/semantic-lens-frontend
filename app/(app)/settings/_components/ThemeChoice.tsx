"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@/lib/icons";
import { applyTheme, readTheme, THEMES, type Theme } from "@/lib/theme";

const COPY: Record<Theme, { label: string; Icon: typeof IconSun }> = {
  light: { label: "Claro", Icon: IconSun },
  dark: { label: "Escuro", Icon: IconMoon },
};

export default function ThemeChoice() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => setTheme(readTheme()), []);

  const pick = (next: Theme) => {
    applyTheme(next);
    setTheme(next);
  };

  return (
    <div className="setchannels">
      {THEMES.map((t) => {
        const { label, Icon } = COPY[t];
        return (
          <label className={`checkitem setchannel${theme === t ? " on" : ""}`} key={t}>
            <input type="radio" name="theme" checked={theme === t} onChange={() => pick(t)} />
            <div>
              <b>
                <Icon width={16} height={16} strokeWidth={1.8} /> {label}
              </b>
              <span>
                {t === "light"
                  ? "Fundo claro, para ambientes bem iluminados."
                  : "Fundo escuro, mais confortável à noite."}
              </span>
            </div>
          </label>
        );
      })}
    </div>
  );
}
