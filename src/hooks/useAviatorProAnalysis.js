import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAviatorRecords } from "../services/aviatorRecords";
import { analyzeAviatorTiming } from "../services/aviatorProAnalysis";

const initialState = { loading: false, error: null, result: null };
export const ANALYSIS_ANIMATION_MS = 4000;

const unlockTime = result => Math.max(0, ...(result?.timings || [])
  .map(timing => timing.nextTimestamp).filter(Number.isFinite));

function waitForAnimation(signal) {
  return new Promise(resolve => {
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, ANALYSIS_ANIMATION_MS);
    signal.addEventListener("abort", finish, { once: true });
  });
}

export default function useAviatorProAnalysis(chartNumber, limit) {
  const activeRequest = useRef(null);
  const results = useRef(new Map());
  const latestResult = useRef(null);
  const [state, setState] = useState(initialState);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const result = results.current.get(`${chartNumber}:${limit}`) || null;
    latestResult.current = result;
    setNow(Date.now());
    setState({ ...initialState, result });
    return () => activeRequest.current?.abort();
  }, [chartNumber, limit]);

  const unlockAt = unlockTime(state.result);
  const waitingForEstimate = now < unlockAt;
  useEffect(() => {
    if (!waitingForEstimate) return;
    const updateClock = () => setNow(Date.now());
    const timer = setTimeout(updateClock, Math.max(0, unlockAt - Date.now()));
    document.addEventListener("visibilitychange", updateClock);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", updateClock); };
  }, [unlockAt, waitingForEstimate]);

  const analyze = useCallback(async () => {
    if (activeRequest.current && !activeRequest.current.signal.aborted) return;
    if (unlockTime(latestResult.current) > Date.now()) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    setState({ loading: true, error: null, result: latestResult.current });
    const animation = waitForAnimation(controller.signal);
    try {
      const { records } = await fetchAviatorRecords(chartNumber, controller.signal, 1, limit);
      await animation;
      if (controller.signal.aborted) return;
      const now = Date.now();
      const result = {
        records, analyzedAt: now,
        timings: [3, 10].map(threshold => ({ threshold, ...analyzeAviatorTiming(records, threshold, now) }))
      };
      latestResult.current = result;
      results.current.set(`${chartNumber}:${limit}`, result);
      setNow(now);
      setState({ loading: false, error: null, result });
    } catch {
      await animation;
      if (!controller.signal.aborted) setState({ loading: false, error: "Não foi possível carregar o histórico. Tente novamente.", result: latestResult.current });
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }, [chartNumber, limit]);
  return { ...state, analyze, unlockAt, canAnalyze: !state.loading && now >= unlockAt };
}
