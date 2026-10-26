import { useCallback, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { clearDepositSession, depositError, fetchDepositBalance, requestDeposit } from "../services/depositApi";

export default function useDeposit() {
  const history = useHistory();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);

  const createDeposit = useCallback(async amount => {
    if (request.current) return null;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      let initialBalance = null;
      try { initialBalance = await fetchDepositBalance(controller.signal); }
      catch (failure) { if (failure.response?.status === 401 || controller.signal.aborted) throw failure; }
      if (controller.signal.aborted) return null;
      const result = await requestDeposit(amount, controller.signal);
      if (controller.signal.aborted) return null;
      const deposit = { ...result, initialBalance };
      setData(deposit);
      return deposit;
    } catch (failure) {
      if (controller.signal.aborted) return null;
      if (failure.response?.status === 401) {
        clearDepositSession();
        history.replace("/auth/login");
      } else setError(depositError(failure));
      return null;
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
  }, [history]);
  return { data, error, loading, createDeposit, clearError: () => setError(null) };
}
