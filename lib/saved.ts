"use client";

import { useCallback, useEffect } from "react";
import { getFavoriteIds, setFavorite } from "@/app/actions/favorites";
import { createClientStore } from "@/lib/clientStore";

const store = createClientStore<string[]>([], () => getFavoriteIds());

/**
 * Adopts the ids a server component rendered with. Without it an in-memory copy from
 * earlier in the session can hide rows the server has just sent - the "saved on one
 * device, missing on the other" case.
 */
export function useSavedSync(serverIds: string[]) {
  const key = serverIds.join(",");
  useEffect(() => {
    if (store.get().join(",") !== key) store.set(serverIds);
    // `key` stands in for the array's identity, which is fresh on every server render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

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
