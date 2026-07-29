const CADENCES = [
  { freq: "Aviso diário", cadence: "daily" },
  { freq: "Aviso semanal", cadence: "weekly" },
  { freq: "Aviso mensal", cadence: "monthly", retired: true },
] as const;

const FREQ_TO_CADENCE: Record<string, string> = Object.fromEntries(
  CADENCES.map((c) => [c.freq, c.cadence]),
);
const CADENCE_TO_FREQ: Record<string, string> = Object.fromEntries(
  CADENCES.map((c) => [c.cadence, c.freq]),
);

// A retired cadence still resolves both ways, so alerts already saved with it keep
// their label — it is just no longer offered.
export const FREQS: string[] = CADENCES.filter((c) => !("retired" in c)).map((c) => c.freq);

export const freqOptions = (current: string): string[] =>
  FREQS.includes(current) ? FREQS : [...FREQS, current];

export const toCadence = (freq: string) => FREQ_TO_CADENCE[freq] ?? "daily";
export const toFreq = (cadence: string) => CADENCE_TO_FREQ[cadence] ?? "Aviso diário";
