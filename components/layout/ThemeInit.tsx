"use client";

import { useEffect } from "react";
import { readTheme, showTheme } from "@/lib/theme";

/** The control moved to /settings, so the saved theme still needs applying on every page. */
export default function ThemeInit() {
  useEffect(() => showTheme(readTheme()), []);
  return null;
}
