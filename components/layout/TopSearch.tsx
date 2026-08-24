"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { MAX_QUERY_CHARS } from "@/lib/facets/limits";
import { IconSearch } from "@/lib/icons";

export default function TopSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitting, startSubmit] = useTransition();

  // Route client-side instead of letting the GET form do a full document navigation.
  const onSubmit = (e: React.FormEvent) => {
    const q = inputRef.current?.value.trim();
    if (!q) return;
    e.preventDefault();
    startSubmit(() => router.push(`/search?q=${encodeURIComponent(q)}`));
  };

  // Unlike the same-page search on /search, this is a cross-route jump with cold chunks.
  return (
    <form
      className={`topsearch${submitting ? " busy" : ""}`}
      action="/search"
      method="get"
      onSubmit={onSubmit}
    >
      <IconSearch width={18} height={18} strokeWidth={1.7} />
      <input
        ref={inputRef}
        name="q"
        placeholder="Buscar imóveis - descreva o que procura"
        aria-label="Buscar imóveis"
        maxLength={MAX_QUERY_CHARS}
        autoComplete="off"
        onFocus={() => router.prefetch("/search")}
      />
    </form>
  );
}
