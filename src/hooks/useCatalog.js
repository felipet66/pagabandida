import { useCallback, useEffect, useRef, useState } from "react";
import bffApi from "../services/bffApi";

const LIMIT = 24;
const MAIN_VENDORS = [
  { value: "pgsoft", label: "PG Soft" },
  { value: "spribe", label: "Spribe" },
  { value: "evolution", label: "Evolution" },
];

const useCatalog = () => {
  const [q, setQuery] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("");
  const [games, setGames] = useState([]);
  const [vendors, setVendors] = useState(MAIN_VENDORS);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const controller = useRef(null);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const nextOffset = useRef(0);
  const failedOffset = useRef(0);
  const firstRun = useRef(true);
  const filters = useRef({ q, vendor, category });

  const requestPage = useCallback(async (offset, version) => {
    if (inFlight.current || version !== generation.current) return;
    const abort = new AbortController();
    controller.current = abort;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await bffApi.get("api/games/catalog", {
        params: { ...Object.fromEntries(Object.entries(filters.current).filter(([, value]) => value)), offset, limit: LIMIT },
        signal: abort.signal,
        publicRequest: true,
      });
      if (abort.signal.aborted || version !== generation.current) return;
      if (response.data?.success === false) {
        const failure = new Error("Catalog request failed");
        failure.response = { status: response.data.error?.code === "INVALID_PARAMETERS" ? 400 : 500 };
        throw failure;
      }
      const page = response.data.data;
      if (!Array.isArray(page?.games)) throw new Error("Invalid catalog response");
      setGames(previous => {
        const combined = offset === 0 ? page.games : [...previous, ...page.games];
        return Array.from(new Map(combined.map(game => [game.id || game.launchSlug, game])).values());
      });
      setVendors(previous => Array.from(new Map([
        ...previous,
        ...page.games.filter(game => game.vendorSlug).map(game => ({ value: game.vendorSlug, label: game.vendorName || game.vendorSlug })),
      ].map(option => [option.value, option])).values()));
      setCategories(previous => Array.from(new Set([...previous, ...page.games.map(game => game.category).filter(Boolean)])));
      setTotal(Number(page.total) || 0);
      setHasMore(Boolean(page.hasMore));
      nextOffset.current = offset + (Number(page.limit) || page.games.length);
    } catch (failure) {
      if (abort.signal.aborted || version !== generation.current) return;
      failedOffset.current = offset;
      if (failure.response?.status === 400) {
        console.error("Parâmetros inválidos na consulta do catálogo");
        setHasMore(false);
      } else {
        setError("Não foi possível carregar os jogos. Tente novamente.");
      }
    } finally {
      if (version === generation.current) {
        inFlight.current = false;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    controller.current?.abort();
    const version = ++generation.current;
    filters.current = { q: q.trim().slice(0, 50), vendor, category };
    inFlight.current = false;
    nextOffset.current = 0;
    failedOffset.current = 0;
    setGames([]);
    setTotal(0);
    setHasMore(false);
    setError(null);
    setLoading(true);
    const timer = setTimeout(() => requestPage(0, version), firstRun.current ? 0 : 350);
    firstRun.current = false;
    return () => {
      clearTimeout(timer);
      controller.current?.abort();
      generation.current = version + 1;
    };
  }, [q, vendor, category, requestPage]);

  const loadMore = useCallback(() => {
    if (hasMore && !error) requestPage(nextOffset.current, generation.current);
  }, [hasMore, error, requestPage]);
  const retry = useCallback(() => requestPage(failedOffset.current, generation.current), [requestPage]);
  const setQ = useCallback(value => setQuery(value.slice(0, 50)), []);

  return { games, total, q, setQ, vendor, setVendor, category, setCategory, vendors, categories, hasMore, loading, error, loadMore, retry };
};

export default useCatalog;
