import { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { clearDepositSession, fetchDepositBalance, syncDeposits } from "../services/depositApi";

// Only in memory: remounting the admin layout must not sync the same session again.
let syncedSession = null;
const notifyBalance = () => window.dispatchEvent(new Event("wallet-balance-updated"));

export default function useDepositSync(deposit = null, { once = false } = {}) {
  const history = useHistory();
  const [status, setStatus] = useState("idle");
  const [remaining, setRemaining] = useState(null);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const manualCheck = useRef(null);
  const sessionToken = once ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (once) {
      const token = sessionToken;
      if (!token) { syncedSession = null; return; }
      if (!token || syncedSession === token) return;
      syncedSession = token;
      const controller = new AbortController();
      let settled = false;
      syncDeposits(controller.signal).then(() => {
        if (!controller.signal.aborted) notifyBalance();
      }).catch(failure => {
        if (controller.signal.aborted) return;
        if (failure.response?.status === 401) {
          clearDepositSession(); history.replace("/auth/login");
        }
      }).finally(() => { settled = true; });
      return () => {
        controller.abort();
        // Allow a new mount to retry a canceled startup request.
        if (!settled && syncedSession === token) syncedSession = null;
      };
    }
    setError(null);
    setChecking(false);
    if (!deposit) { setStatus("idle"); setRemaining(null); return; }
    const expiresAt = Date.parse(deposit.paymentPayload.expiresAt);
    const hasExpiry = Number.isFinite(expiresAt);
    let balanceBaseline = deposit.initialBalance;
    let confirmedBaseline = null;
    let syncSupported = true;
    let stopped = false;
    let activeRequest = null;
    let clockTimer, pollTimer;
    const stop = () => {
      stopped = true;
      clearInterval(clockTimer);
      clearInterval(pollTimer);
      activeRequest?.abort();
      manualCheck.current = null;
    };
    const updateClock = () => {
      const seconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setRemaining(seconds);
      if (!seconds) { setStatus("expired"); stop(); }
    };
    const confirm = () => { setStatus("confirmed"); stop(); notifyBalance(); };
    const poll = async (manual = false) => {
      if (stopped || activeRequest) return;
      if (hasExpiry && Date.now() >= expiresAt) { updateClock(); return; }
      const controller = new AbortController();
      activeRequest = controller;
      if (manual) { setChecking(true); setError(null); }
      const handleFailure = failure => {
        if (stopped || controller.signal.aborted) return;
        if (failure.response?.status === 401) {
          stop(); clearDepositSession(); history.replace("/auth/login");
        } else if (manual) setError("Não foi possível verificar o pagamento. Tente novamente.");
      };
      const sync = syncSupported ? syncDeposits(controller.signal).then(data => {
        if (stopped || controller.signal.aborted) return;
        if (hasExpiry && Date.now() >= expiresAt) { updateClock(); return; }
        if (confirmedBaseline == null) confirmedBaseline = data.confirmed;
        else if (data.confirmed > confirmedBaseline) confirm();
      }).catch(failure => {
        if (failure.response?.status === 501) syncSupported = false;
        handleFailure(failure);
      }) : Promise.resolve();
      const balance = fetchDepositBalance(controller.signal).then(amount => {
        if (stopped || controller.signal.aborted) return;
        if (hasExpiry && Date.now() >= expiresAt) { updateClock(); return; }
        if (balanceBaseline == null) balanceBaseline = amount;
        else if (amount > balanceBaseline) confirm();
      }).catch(handleFailure);
      await Promise.allSettled([sync, balance]);
      if (activeRequest === controller) activeRequest = null;
      if (!controller.signal.aborted) setChecking(false);
    };
    setStatus("pending");
    manualCheck.current = () => poll(true);
    if (hasExpiry) updateClock();
    else setRemaining(null);
    if (!stopped) {
      if (hasExpiry) clockTimer = setInterval(updateClock, 1000);
      pollTimer = setInterval(poll, 5000);
      poll();
    }
    return stop;
  }, [deposit, history, once, sessionToken]);
  return { status, remaining, error, checking, checkPayment: () => manualCheck.current?.() };
}
