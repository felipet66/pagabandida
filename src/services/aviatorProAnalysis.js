const clock = timestamp => new Date(timestamp).toLocaleTimeString("pt-BR", {
  timeZone: "America/Sao_Paulo", hourCycle: "h23"
});

// Use full timestamps: sorting clock strings loses the date at midnight.
export function analyzeAviatorTiming(records, threshold, now = Date.now()) {
  const hits = [...new Set(records
    .filter(record => Number.isFinite(Number(record.odd)) && Number(record.odd) > threshold && record.dataTime)
    .map(record => new Date(record.dataTime).getTime())
    .filter(timestamp => Number.isFinite(timestamp) && timestamp <= now))].sort((a, b) => a - b);
  if (hits.length < 2) return { count: hits.length, interval: null, next: null };
  // Equivalent to the arithmetic mean of all consecutive gaps (n hits = n - 1 gaps).
  const interval = (hits[hits.length - 1] - hits[0]) / (hits.length - 1);
  const last = hits[hits.length - 1];
  // A future point on this interval grid, not a prediction of the next qualifying round.
  const steps = Math.max(1, Math.floor((now - last) / interval) + 1);
  const nextTimestamp = last + steps * interval;
  const seconds = Math.round(interval / 1000);
  return {
    count: hits.length,
    interval: `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`,
    next: clock(nextTimestamp),
    nextTimestamp,
    nextDate: new Date(nextTimestamp).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
  };
}
