import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAviatorRecords } from "../services/aviatorRecords";

const REFRESH_INTERVAL_MS = 30000;
const retryInterval = failures => REFRESH_INTERVAL_MS * (2 ** Math.min(failures, 2));

export default function useAviatorRecords(chartNumber, limit = 100, candleGreaterThan, autoRefresh = false) {
  const [records, setRecords] = useState([]);
  const [sample, setSample] = useState({ key: null, records: [] });
  const sampleKey = `${chartNumber}:${limit}:${candleGreaterThan ?? ""}`;
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [paused, setPaused] = useState(document.hidden);
  const [retryDelay, setRetryDelay] = useState(REFRESH_INTERVAL_MS);
  const [error, setError] = useState(null);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const request = useRef(null);
  const pageInfo = useRef(null);
  const snapshotKey = useRef(null);
  const automaticRequest = useRef(null);
  const failures = useRef(0);

  const fetchPage = useCallback(async (page, append, { background = false, automatic = false } = {}) => {
    if ((append || background) && request.current) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    if (automatic) automaticRequest.current = controller;
    if (append) { setLoadingMore(true); setLoadMoreError(null); }
    else if (background) setRefreshing(true);
    else {
      snapshotKey.current = null;
      failures.current = 0;
      setRetryDelay(REFRESH_INTERVAL_MS);
      setLastUpdated(null);
      setRefreshError(null);
      setRefreshing(false);
      pageInfo.current = null;
      setPagination(null);
      setRecords([]);
      setSample({ key: null, records: [] });
      setLoading(true);
      setLoadingMore(false);
      setError(null);
      setLoadMoreError(null);
    }
    try {
      const result = await fetchAviatorRecords(chartNumber, controller.signal, page, limit, candleGreaterThan);
      if (controller.signal.aborted) return;
      failures.current = 0;
      setRetryDelay(REFRESH_INTERVAL_MS);
      setError(null);
      setRefreshError(null);
      pageInfo.current = result.pagination;
      setPagination(result.pagination);
      if (!append) {
        snapshotKey.current = sampleKey;
        setLastUpdated(new Date());
        setSample({ key: sampleKey, records: result.sampleRecords || [] });
      }
      setRecords(previous => {
        if (!append) return result.records;
        const ids = new Set(previous.map(record => record.id));
        return [...previous, ...result.records.filter(record => {
          if (ids.has(record.id)) return false;
          ids.add(record.id);
          return true;
        })];
      });
    } catch {
      if (controller.signal.aborted) return;
      failures.current += 1;
      setRetryDelay(retryInterval(failures.current));
      if (append) setLoadMoreError("Não foi possível carregar mais resultados. Tente novamente.");
      else if (background && snapshotKey.current === sampleKey) setRefreshError("Não foi possível atualizar. Os últimos dados foram mantidos.");
      else setError("Não foi possível carregar o histórico. Tente novamente.");
    } finally {
      if (request.current === controller && !controller.signal.aborted) {
        request.current = null;
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
      if (automaticRequest.current === controller) automaticRequest.current = null;
    }
  }, [chartNumber, limit, candleGreaterThan, sampleKey]);
  const refetch = useCallback(() => fetchPage(1, false, { background: snapshotKey.current === sampleKey }), [fetchPage, sampleKey]);
  const loadMore = useCallback(() => {
    const info = pageInfo.current;
    if (info && info.page < info.totalPages) return fetchPage(info.page + 1, true);
  }, [fetchPage]);
  useEffect(() => {
    fetchPage(1, false);
    return () => { request.current?.abort(); request.current = null; };
  }, [fetchPage]);
  useEffect(() => {
    if (!autoRefresh) return;
    let disposed = false, timer, running = false;
    const schedule = () => {
      if (!disposed && !document.hidden) timer = setTimeout(tick, retryInterval(failures.current));
    };
    const tick = async () => {
      if (disposed || document.hidden || running) return;
      running = true;
      await fetchPage(1, false, { background: true, automatic: true });
      running = false;
      schedule();
    };
    const onVisibilityChange = () => {
      clearTimeout(timer);
      setPaused(document.hidden);
      if (!document.hidden) tick();
    };
    setPaused(document.hidden);
    schedule();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      disposed = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      const controller = automaticRequest.current;
      if (controller) {
        controller.abort();
        if (request.current === controller) { request.current = null; setRefreshing(false); }
        automaticRequest.current = null;
      }
    };
  }, [autoRefresh, fetchPage]);
  return { records, sampleRecords: sample.key === sampleKey ? sample.records : [],
    sampleLoading: loading || (!error && sample.key !== sampleKey),
    pagination, loading, loadingMore, refreshing, refreshError, lastUpdated, retryDelay,
    autoRefreshPaused: autoRefresh && paused, error, loadMoreError, refetch, loadMore,
    hasMore: Boolean(pagination && pagination.page < pagination.totalPages) };
}
