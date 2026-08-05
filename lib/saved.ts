"use client";

import { useCallback, useEffect } from "react";
import { getFavoriteIds, setFavorite } from "@/app/actions/favorites";
import { createClientStore } from "@/lib/clientStore";

const store = createClientStore<string[]>([], () => getFavoriteIds());

/** Shared "remove from carteira" ConfirmDialog copy (SaveButton, and FavoriteButton on portfolio). */
export const REMOVE_FAVORITE_CONFIRM = {
  title: "Remover da carteira?",
  message: "O imóvel sai da sua carteira e você deixa de acompanhar as datas e avisos dele.",
  confirmLabel: "Remover",
} as const;

/** Adopts the server's ids, so a stale in-memory copy cannot hide rows it just sent. */
export function useSavedSync(serverIds: string[]) {
  const key = serverIds.join(",");
  useEffect(() => {
    if (store.get().join(",") !== key) store.set(serverIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands in for `serverIds`
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
