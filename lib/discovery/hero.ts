import type { Property } from "@/lib/types";
import { seededPick } from "./sample";

// The hero photo is 340px tall, so a badly-shot façade spoils the page however good the
// investment score is. Falls back to the raw pool rather than rendering no hero at all.
const VISUAL_MIN = 75;

export function pickHero(pool: readonly Property[], seed: number): Property | null {
  const shot = pool.filter((p) => p.image && (p.visualScore ?? 0) >= VISUAL_MIN);
  const from = shot.length ? shot : pool.filter((p) => p.image);
  return seededPick(from, 1, "hero", seed, { maxPerCity: from.length })[0] ?? null;
}
