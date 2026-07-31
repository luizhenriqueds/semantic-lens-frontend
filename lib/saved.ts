"use client";

import { useCallback } from "react";
import { getFavoriteIds, setFavorite } from "@/app/actions/favorites";
import { createClientStore } from "@/lib/clientStore";

const store = createClientStore<string[]>([], () => getFavoriteIds());

export function useSaved() {
  const ids = store.useValue();

  const toggle = useCallback(async (id: string): Promise<boolean> => {
    const cur = store.get();
    const saved = cur.includes(id);
    store.set(saved ? cur.filter((x) => x !== id) : [...cur, id]);
    const rollback = () =>
      store.set(saved ? [...store.get(), id] : store.get().filter((x) => x !== id));
    try {
      const ok = await setFavorite(id, !saved);
      if (!ok) rollback();
      return ok;
    } catch (err) {
      console.warn("Failed to persist favourite", err);
      rollback();
      return false;
    }
  }, []);

  return { ids, toggle, isSaved: (id: string) => ids.includes(id) };
}
