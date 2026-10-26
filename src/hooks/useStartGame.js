import { useCallback, useEffect, useRef, useState } from "react";
import bffApi from "../services/bffApi";
import { clearAppSession } from "../services/appStorage";

const OPEN_ERROR = "Não foi possível abrir o jogo. Tente novamente.";
export const getGamePlatform = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "MOBILE" : "WEB";
const useStartGame = ({ onAuthRequired } = {}) => {
  const [gameUrl, setGameUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const activeRequest = useRef(null);

  useEffect(() => () => activeRequest.current?.abort(), []);

  const resetGame = useCallback(() => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setGameUrl(null);
    setError(null);
    setLoading(false);
  }, []);

  const startGame = useCallback(async ({
    slug = "spribe/aviator", useDemo = false, source, tabId, mountedId,
  } = {}) => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setGameUrl(null);
    setLoading(true);
    setError(null);

    const requireLogin = () => {
      if (onAuthRequired) onAuthRequired();
      else window.location.href = "/auth/login";
    };

    try {
      if (!localStorage.getItem("access_token")) {
        requireLogin();
        return null;
      }
      const params = { slug, platform: getGamePlatform(), use_demo: useDemo ? 1 : 0 };
      if (source) params.source = source;
      if (tabId) params.tab_id = tabId;
      if (mountedId) params.mounted_id = mountedId;
      const response = await bffApi.get("/api/games/start-game-v2", {
        params,
        signal: controller.signal,
        handleUnauthorized: true,
      });
      if (controller.signal.aborted) return null;
      const result = response.data?.data || response.data;
      if (response.data?.success === false || result?.error) {
        const failure = new Error(OPEN_ERROR);
        failure.code = result?.error?.code || response.data?.error?.code || result?.error;
        throw failure;
      }
      const url = result?.gameURL || result?.gameUrl || result?.url || result?.link;
      if (typeof url !== "string" || !/^https?:\/\//i.test(url)) throw new Error(OPEN_ERROR);
      setGameUrl(url);
      return url;
    } catch (failure) {
      if (controller.signal.aborted) return null;
      if (failure.response?.status === 401) {
        clearAppSession();
        requireLogin();
      } else {
        const code = failure.response?.data?.error?.code || failure.code;
        setError(code === "INVALID_GAME_SLUG" ? "Jogo indisponível" : OPEN_ERROR);
      }
      return null;
    } finally {
      if (activeRequest.current === controller && !controller.signal.aborted) setLoading(false);
    }
  }, [onAuthRequired]);

  return { gameUrl, error, loading, startGame, resetGame };
};

export default useStartGame;
