import { useCallback, useEffect, useRef, useState } from "react";
import { gamificationApi } from "../services/gamificationApi";
import { useGamificationContext } from "../contexts/GamificationContext";

export default function useGamification() {
  const context = useGamificationContext();
  const acceptProfile = context?.acceptProfile;
  const revision = context?.revision || 0;
  const session = context?.session;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moreError, setMoreError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const generation = useRef(0);
  const fetchingMore = useRef(false);
  const currentData = useRef(null);
  const update = useCallback(next => { currentData.current = next; setData(next); }, []);

  const refetch = useCallback(async () => {
    const attempt = ++generation.current;
    setLoading(true); setError(null); setMoreError(null);
    fetchingMore.current = false; setLoadingMore(false);
    try {
      const [me, history, leaderboard] = await Promise.all([gamificationApi.me(), gamificationApi.history(), gamificationApi.leaderboard()]);
      if (attempt !== generation.current) return;
      if (!Array.isArray(me.achievements) || !me.progress || !me.streak || !Array.isArray(history.items) || !Array.isArray(leaderboard.players) || !leaderboard.me) throw new Error("Resposta inválida");
      update({ me, history, leaderboard }); acceptProfile?.(me);
    } catch (failure) { if (attempt === generation.current) setError(failure.code ? failure.message : "Não foi possível carregar a gamificação. Tente de novo."); }
    finally { if (attempt === generation.current) setLoading(false); }
  }, [acceptProfile, update]);
  useEffect(() => {
    update(null); refetch();
    return () => { generation.current += 1; };
  }, [refetch, revision, session, update]);

  const loadMore = async () => {
    if (fetchingMore.current || !currentData.current?.history.hasMore) return;
    const attempt = generation.current;
    fetchingMore.current = true; setLoadingMore(true); setMoreError(null);
    try {
      const page = await gamificationApi.history(currentData.current.history.items.length);
      if (attempt !== generation.current) return;
      if (!Array.isArray(page.items)) throw new Error("Histórico indisponível");
      update({ ...currentData.current, history: { items: [...currentData.current.history.items, ...page.items], hasMore: page.hasMore } });
    } catch { if (attempt === generation.current) setMoreError("Não foi possível carregar mais XP. Tente de novo."); }
    finally { if (attempt === generation.current) { fetchingMore.current = false; setLoadingMore(false); } }
  };
  return { data, loading, error, refetch, loadMore, loadingMore, moreError };
}
