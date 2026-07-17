const FREQ_TO_CADENCE: Record<string, string> = {
  "Aviso diário": "daily",
  "Aviso semanal": "weekly",
  "Aviso mensal": "monthly",
};
const CADENCE_TO_FREQ: Record<string, string> = Object.fromEntries(
  Object.entries(FREQ_TO_CADENCE).map(([freq, cadence]) => [cadence, freq]),
);

export const FREQS = Object.keys(FREQ_TO_CADENCE);

export const toCadence = (freq: string) => FREQ_TO_CADENCE[freq] ?? "daily";
export const toFreq = (cadence: string) => CADENCE_TO_FREQ[cadence] ?? "Aviso diário";
