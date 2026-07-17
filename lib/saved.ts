"use client";

import { useCallback } from "react";
import { getFavoriteIds, setFavorite } from "@/app/actions/favorites";
import { createClientStore } from "@/lib/clientStore";

const store = createClientStore<string[]>([], () => getFavoriteIds());

export function useSaved() {
  const ids = store.useValue();

  const toggle = useCallback((id: string) => {
    const cur = store.get();
    const saved = cur.includes(id);
    store.set(saved ? cur.filter((x) => x !== id) : [...cur, id]);
    setFavorite(id, !saved).catch((err) => {
      console.warn("Failed to persist favourite", err);
      store.set(saved ? [...store.get(), id] : store.get().filter((x) => x !== id));
    });
  }, []);

  return { ids, toggle, isSaved: (id: string) => ids.includes(id) };
}
