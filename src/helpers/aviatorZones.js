export const ZONE_WINDOWS = [20, 50];
export const ZONE_COLD_RATE = 0.05;
export const ZONE_HOT_RATE = 0.2;

const roundId = record => {
  const value = String(record?.roundId ?? record?.id ?? "");
  const number = Number(value);
  return /^\d+$/.test(value) && Number.isSafeInteger(number) ? number : null;
};
const timestamp = record => record?.dataTime ? new Date(record.dataTime).getTime() : NaN;

// Analyze only the uninterrupted prefix, newest first. Never bridge missing rounds.
export function analyzeAviatorZones(records = []) {
  const consecutive = [];
  let interrupted = false;
  for (const record of records) {
    const odd = Number(record?.odd);
    if (!Number.isFinite(odd) || odd < 1 || roundId(record) == null || !Number.isFinite(timestamp(record))) {
      interrupted = true;
      break;
    }
    const newer = consecutive[consecutive.length - 1];
    if (newer && (roundId(newer) - roundId(record) !== 1 || timestamp(newer) <= timestamp(record))) {
      interrupted = true;
      break;
    }
    consecutive.push(record);
  }
  const lastOccurrence = consecutive.findIndex(record => Number(record.odd) > 10);
  return {
    available: consecutive.length,
    interrupted,
    latest: consecutive[0] || null,
    roundsSince: lastOccurrence >= 0 ? lastOccurrence : null,
    windows: ZONE_WINDOWS.map(size => {
      const sample = consecutive.slice(0, size);
      const count = sample.filter(record => Number(record.odd) > 10).length;
      const complete = sample.length === size;
      const rate = complete ? count / size : null;
      return { size, count, available: sample.length, complete, rate,
        zone: !complete ? "unavailable" : rate >= ZONE_HOT_RATE ? "hot" : rate <= ZONE_COLD_RATE ? "cold" : "neutral" };
    }),
  };
}
