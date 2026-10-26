import { useCallback, useEffect, useRef, useState } from "react";
import bffApi from "../services/bffApi";

export default function useDepositRanking() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const request = useRef(null);
  const mounted = useRef(false);
  const lastAttempt = useRef(0);
  const refetch = useCallback(async () => {
    if (!mounted.current || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    lastAttempt.current = Date.now();
    setLoading(true);
    try {
      const response = await bffApi.get("api/ranking/deposits", { params: { limit: 10 }, publicRequest: true, signal: controller.signal, timeout: 12000 });
      const body = response.data;
      if (body?.success !== true || !/^\d{4}-(0[1-9]|1[0-2])$/.test(body.data?.month) || !Array.isArray(body.data?.players) ||
          body.data.players.some(player => !Number.isInteger(player.rank) || player.rank < 1 || typeof player.name !== "string" || !Number.isFinite(player.total) || player.total < 0)) throw new Error("Ranking indisponível");
      if (!mounted.current || controller.signal.aborted) return;
      setData(body.data);
      setError(null);
    } catch (failure) {
      if (!mounted.current || controller.signal.aborted) return;
      setError(failure.response?.status === 400 ? "Ranking temporariamente indisponível." : "Não foi possível carregar o ranking. Tente novamente.");
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (mounted.current && !controller.signal.aborted) setLoading(false);
      }
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const refreshVisible = () => {
      if (document.visibilityState !== "hidden" && Date.now() - lastAttempt.current >= 60000) refetch();
    };
    if (document.visibilityState !== "hidden") refetch();
    const timer = setInterval(refreshVisible, 60000);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshVisible);
      request.current?.abort();
      request.current = null;
    };
  }, [refetch]);
  return { month: data?.month, players: data?.players || [], loading, error, refetch };
}
