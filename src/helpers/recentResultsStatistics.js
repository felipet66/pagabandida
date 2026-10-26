import { mean, median, mode, range } from "./statistics";

export const RESULT_BANDS = [
  { id: "low", label: "Abaixo de 2x", includes: odd => odd < 2 },
  { id: "medium", label: "De 2x a menos de 10x", includes: odd => odd >= 2 && odd < 10 },
  { id: "high", label: "10x ou mais", includes: odd => odd >= 10 },
];

// Records arrive newest first. Filtered samples cannot describe consecutive rounds.
export function summarizeRecentResults(records = []) {
  const ordered = records.map(record => {
    const odd = Number(record?.odd);
    return Number.isFinite(odd) && odd >= 1 ? odd : null;
  });
  const odds = ordered.filter(odd => odd != null);
  if (!odds.length) return null;

  const sample = odds.map(odd => ({ odd }));
  const average = mean(sample);
  const bands = RESULT_BANDS.map(band => {
    const count = odds.filter(band.includes).length;
    let run = 0, longestRun = 0;
    ordered.forEach(odd => {
      run = odd != null && band.includes(odd) ? run + 1 : 0;
      longestRun = Math.max(longestRun, run);
    });
    return { id: band.id, label: band.label, count, percentage: count / odds.length * 100, longestRun };
  });

  const currentBand = ordered[0] == null ? null : RESULT_BANDS.find(band => band.includes(ordered[0]));
  let currentRun = 0;
  if (currentBand) {
    for (const odd of ordered) {
      if (odd == null || !currentBand.includes(odd)) break;
      currentRun++;
    }
  }

  return {
    count: odds.length,
    completeSequence: odds.length === records.length,
    mean: average,
    median: median(sample),
    mode: mode(sample).filter(value => odds.filter(odd => odd === value).length > 1),
    min: Math.min(...odds),
    max: Math.max(...odds),
    range: range(sample),
    standardDeviation: Math.sqrt(odds.reduce((sum, odd) => sum + (odd - average) ** 2, 0) / odds.length),
    bands,
    currentStreak: currentBand ? { label: currentBand.label, count: currentRun } : null,
    thresholds: [2, 5, 10, 30, 50, 100].map(threshold => {
      const count = odds.filter(odd => odd >= threshold).length;
      return { threshold, count, percentage: count / odds.length * 100,
        roundsSince: ordered.findIndex(odd => odd != null && odd >= threshold) };
    }),
  };
}
