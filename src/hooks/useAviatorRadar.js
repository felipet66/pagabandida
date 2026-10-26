import { useEffect, useRef, useState } from "react";
import { fetchAviatorRecords } from "../services/aviatorRecords";
import { advanceRadar, createRadarState, RADAR_HISTORY_SIZE, RADAR_MAX_LAG_MS, RADAR_MIN_OCCURRENCES } from "../services/aviatorRadar";

export const RADAR_POLL_MS = 5000;
const REQUEST_TIMEOUT_MS = 10000;

export default function useAviatorRadar(chartNumber, enabled) {
  const engines = useRef(new Map());
  const [snapshot, setSnapshot] = useState(null);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!enabled) return;
    let disposed = false, timer, requestTimeout, controller, sequence = 0, failures = 0;
    const connecting = () => setSnapshot({ chartNumber, status: "loading", result: null, updatedAt: null });
    const stop = () => { sequence += 1; clearTimeout(timer); clearTimeout(requestTimeout); controller?.abort(); };
    const poll = async () => {
      if (disposed || document.hidden) return;
      const ownSequence = ++sequence;
      const request = new AbortController();
      controller = request;
      let timedOut = false;
      const timeout = setTimeout(() => { timedOut = true; request.abort(); }, REQUEST_TIMEOUT_MS);
      requestTimeout = timeout;
      try {
        const { records } = await fetchAviatorRecords(chartNumber, request.signal, 1, RADAR_HISTORY_SIZE);
        if (disposed || ownSequence !== sequence || request.signal.aborted) return;
        const time = Date.now();
        const result = advanceRadar(engines.current.get(chartNumber) || createRadarState(), records, time);
        engines.current.set(chartNumber, result.state);
        failures = 0;
        setNow(time);
        setSnapshot({ chartNumber, status: result.feedStatus, result, updatedAt: time });
      } catch {
        if (disposed || ownSequence !== sequence || (request.signal.aborted && !timedOut)) return;
        failures += 1;
        setSnapshot({ chartNumber, status: "error", result: null, updatedAt: null });
      } finally {
        clearTimeout(timeout);
        if (!disposed && ownSequence === sequence && !document.hidden) {
          timer = setTimeout(poll, Math.min(RADAR_POLL_MS * 2 ** failures, 30000));
        }
      }
    };
    const visibility = () => {
      stop();
      setNow(Date.now());
      if (document.hidden) setSnapshot({ chartNumber, status: "paused", result: null, updatedAt: null });
      else { connecting(); poll(); }
    };
    const clock = setInterval(() => setNow(Date.now()), 1000);
    document.addEventListener("visibilitychange", visibility);
    visibility();
    return () => { disposed = true; stop(); clearInterval(clock); document.removeEventListener("visibilitychange", visibility); };
  }, [chartNumber, enabled]);

  const lastOutcome = engines.current.get(chartNumber)?.lastOutcome || null;
  if (!enabled) return { lastOutcome, status: "off", window: null, now, historyCount: 0 };
  if (!snapshot || snapshot.chartNumber !== chartNumber) return { lastOutcome, status: "loading", window: null, now, historyCount: 0 };
  const { result } = snapshot;
  let status = snapshot.status;
  if (status === "ready" && now - result.latestAt > RADAR_MAX_LAG_MS) status = "stale";
  if (status === "ready" && result.occurrenceCount < RADAR_MIN_OCCURRENCES) status = "insufficient";
  const window = status === "ready" && result.state.window ? result.state.window : null;
  return { status, window, now, lastOutcome, historyCount: result?.historyCount || 0,
    occurrenceCount: result?.occurrenceCount || 0, updatedAt: snapshot.updatedAt };
}
