import { useCallback, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import bffApi from "../services/bffApi";
import { clearAppSession } from "../services/appStorage";

const POLL_INTERVAL_MS = 120000;

export default function useWalletBalances() {
  const history = useHistory();
  const [balance, setBalance] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [currency, setCurrency] = useState("BRL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const request = useRef(null);
  const mounted = useRef(false);

  const refetch = useCallback(async () => {
    if (!mounted.current || request.current) return;
    const expireSession = () => {
      clearAppSession();
      history.replace("/auth/login");
    };
    if (!localStorage.getItem("access_token")) {
      expireSession();
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      const response = await bffApi.get("api/wallet/balances", {
        signal: controller.signal,
        handleUnauthorized: true,
      });
      if (controller.signal.aborted || !mounted.current) return;
      const body = response.data;
      if (body?.success !== true) throw new Error("Saldo indisponível");
      const selectedCurrency = "BRL";
      const selected = body.data?.balances?.find(item => item.currency === selectedCurrency);
      const raw = selected?.available;
      const amount = raw == null || String(raw).trim() === "" ? NaN : Number(raw);
      if (!Number.isFinite(amount)) throw new Error("Saldo indisponível");
      setWallet(selected);
      setCurrency(selectedCurrency);
      setBalance(amount);
      setError(null);
    } catch (failure) {
      if (controller.signal.aborted || !mounted.current) return;
      setBalance(null);
      setWallet(null);
      if (failure.response?.status === 401) expireSession();
      else setError("Não foi possível atualizar o saldo. Tente novamente.");
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (mounted.current && !controller.signal.aborted) setLoading(false);
      }
    }
  }, [history]);

  useEffect(() => {
    mounted.current = true;
    refetch();
    const timer = window.setInterval(refetch, POLL_INTERVAL_MS);
    window.addEventListener("wallet-balance-updated", refetch);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
      window.removeEventListener("wallet-balance-updated", refetch);
      request.current?.abort();
      request.current = null;
    };
  }, [refetch]);

  return { balance, wallet, currency, loading, error, refetch };
}
