// Adapted from api-aviator/src/services/bot5xSchedule.js.
// The >5x reference, upper median, trigger and 150s window match that radar.
// This screen monitors continuously, using each selected Aviator's own history.
export const RADAR_HISTORY_SIZE = 100;
export const RADAR_REFERENCE = 5;
export const RADAR_MIN_OCCURRENCES = 3;
export const RADAR_WINDOW_MS = 150000;
export const RADAR_MAX_LAG_MS = 60000;
export const RADAR_TARGET_MIN = 4;
export const RADAR_MIN_WINDOW_ROUNDS = 5;

export const createRadarState = () => ({ cursor: null, seenIds: [], window: null, lastOutcome: null });

export function normalizeRadarRecords(records, now = Date.now()) {
  const unique = new Map();
  for (const record of Array.isArray(records) ? records : []) {
    const id = String(record.roundId ?? record.id ?? "").trim();
    const odd = Number(String(record.odd ?? "").replace(",", "."));
    const timestamp = record.dataTime ? new Date(record.dataTime).getTime() : NaN;
    if (!id || !Number.isFinite(odd) || odd < 1 || !Number.isFinite(timestamp) || timestamp > now) continue;
    unique.set(id, { id, odd, timestamp });
  }
  return [...unique.values()].sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id, undefined, { numeric: true }))
    .slice(-RADAR_HISTORY_SIZE);
}

export function calculateRadarSchedule(history, now) {
  const occurrences = history.filter(row => row.odd > RADAR_REFERENCE);
  if (occurrences.length < RADAR_MIN_OCCURRENCES) return null;
  const intervals = occurrences.slice(1).map((row, index) => row.timestamp - occurrences[index].timestamp).filter(interval => interval > 0);
  if (!intervals.length) return null;
  const sorted = [...intervals].sort((a, b) => a - b);
  const medianIntervalMs = sorted[Math.floor(sorted.length / 2)];
  const lastOccurrence = occurrences[occurrences.length - 1];
  const steps = Math.max(1, Math.floor((now - lastOccurrence.timestamp) / medianIntervalMs) + 1);
  const projectedAtMs = lastOccurrence.timestamp + steps * medianIntervalMs;
  return { occurrenceCount: occurrences.length, historyCount: history.length, medianIntervalMs,
    projectedAtMs, windowEndMs: projectedAtMs + RADAR_WINDOW_MS };
}

// Positive results can be confirmed from an observed round. A negative result
// needs a round after the deadline and sufficient coverage, never just a timer.
function observeWindow(window, history, now) {
  const latest = history[history.length - 1];
  if (!latest) return { window, outcome: null };
  const rounds = new Map((window.observedRounds || []).map(row => [row.id, row]));
  for (const row of history) {
    if (row.timestamp > window.triggerTimestamp && row.timestamp >= window.projectedAtMs && row.timestamp <= window.windowEndMs) rounds.set(row.id, row);
  }
  const observedRounds = [...rounds.values()].sort((a, b) => a.timestamp - b.timestamp);
  const coverageLost = Boolean(window.coverageLost || (latest.timestamp >= window.projectedAtMs && history[0].timestamp > Math.max(window.projectedAtMs, window.coveredThrough || window.triggerTimestamp)));
  const hit = observedRounds.find(row => row.odd >= RADAR_TARGET_MIN);
  const ended = latest.timestamp > window.windowEndMs;
  if (hit || ended) {
    const status = hit ? "GREEN" : observedRounds.length >= RADAR_MIN_WINDOW_ROUNDS && !coverageLost ? "RED" : "NO_DATA";
    return { window: null, outcome: { id: window.id, status, odd: hit?.odd ?? null, roundId: hit?.id ?? null,
      occurredAt: hit?.timestamp ?? window.windowEndMs, confirmedAt: now,
      projectedAtMs: window.projectedAtMs, windowEndMs: window.windowEndMs,
      roundCount: observedRounds.length, coverageLost } };
  }
  // Keep a stable object while waiting for the window to start.
  if (latest.timestamp < window.projectedAtMs) return { window, outcome: null };
  return { window: { ...window, observedRounds, coverageLost, coveredThrough: Math.max(window.coveredThrough || 0, latest.timestamp) }, outcome: null };
}

export function advanceRadar(previous, records, now = Date.now()) {
  const history = normalizeRadarRecords(records, now);
  const latest = history[history.length - 1];
  let window = previous.window;
  let lastOutcome = previous.lastOutcome || null;
  if (!latest) return { state: { ...previous, window, lastOutcome }, feedStatus: "empty", occurrenceCount: 0, historyCount: 0, latestAt: null };
  const seen = new Set(previous.seenIds);
  const incoming = previous.cursor ? history.filter(row => row.timestamp >= previous.cursor.timestamp && !seen.has(row.id)) : [latest];
  for (const row of incoming) {
    const index = history.indexOf(row);
    if (window) {
      const resolved = observeWindow(window, history.slice(0, index + 1), now);
      window = resolved.window;
      if (resolved.outcome) lastOutcome = resolved.outcome;
      // The resolving round cannot also trigger another forecast.
      continue;
    }
    if (row.odd <= RADAR_REFERENCE || now - row.timestamp > RADAR_MAX_LAG_MS) continue;
    const analysis = calculateRadarSchedule(history.slice(0, index + 1), row.timestamp);
    if (!analysis || analysis.windowEndMs < now) continue;
    window = { ...analysis, id: `${row.id}:${analysis.projectedAtMs}`, triggerId: row.id, triggerTimestamp: row.timestamp };
  }
  if (window) {
    const resolved = observeWindow(window, history, now);
    window = resolved.window;
    if (resolved.outcome) lastOutcome = resolved.outcome;
  }
  const cursor = !previous.cursor || latest.timestamp >= previous.cursor.timestamp ? latest : previous.cursor;
  const seenIds = [...new Set([...previous.seenIds, ...history.map(row => row.id)])].slice(-200);
  return { state: { cursor, seenIds, window, lastOutcome }, feedStatus: now - latest.timestamp > RADAR_MAX_LAG_MS ? "stale" : "ready",
    occurrenceCount: history.filter(row => row.odd > RADAR_REFERENCE).length, historyCount: history.length, latestAt: latest.timestamp };
}

export const formatRadarTime = timestamp => new Date(timestamp).toLocaleTimeString("pt-BR", {
  timeZone: "America/Sao_Paulo", hourCycle: "h23",
});
export function radarCountdown(timestamp, now) {
  const seconds = Math.max(0, Math.ceil((timestamp - now) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
