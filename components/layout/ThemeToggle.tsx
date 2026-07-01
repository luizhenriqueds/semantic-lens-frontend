"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@/lib/icons";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("matricula-theme");
    } catch (err) {
      console.warn("Failed to read theme from localStorage", err);
    }
    const theme = saved === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    setDark(theme === "dark");
  }, []);

  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("matricula-theme", next);
    } catch (err) {
      console.warn("Failed to persist theme to localStorage", err);
    }
    setDark(!dark);
  }

  return (
    <button
      className="iconbtn"
      onClick={toggle}
      aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}
    >
      {dark ? (
        <IconSun width={20} height={20} strokeWidth={1.7} />
      ) : (
        <IconMoon width={20} height={20} strokeWidth={1.7} />
      )}
    </button>
  );
}
