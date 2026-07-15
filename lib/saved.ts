"use client";

import { useCallback } from "react";
import { createStore } from "@/lib/localStore";

const store = createStore<string[]>("matricula-saved", []);

export function useSaved() {
  const ids = store.useValue();

  const toggle = useCallback((id: string) => {
    const cur = store.read();
    store.write(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }, []);

  return { ids, toggle, isSaved: (id: string) => ids.includes(id) };
}
