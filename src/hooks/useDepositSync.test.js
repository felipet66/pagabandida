import { newTestSession, testSession } from "../testSupport/fixtures";

import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import useDepositSync from "./useDepositSync";
import { syncDeposits, fetchDepositBalance, clearDepositSession } from "../services/depositApi";
const mockHistory = { replace: jest.fn() };
jest.mock("react-router-dom", () => ({ useHistory: () => mockHistory }));
jest.mock("../services/depositApi", () => ({ syncDeposits: jest.fn(), fetchDepositBalance: jest.fn(), clearDepositSession: jest.fn() }));
let root, current;
const deposit = () => ({ initialBalance: 10, paymentPayload: { expiresAt: new Date(Date.now() + 60000).toISOString() } });
function Harness({ pix, once = false }) { current = useDepositSync(pix, { once }); return null; }
const mount = async props => act(async () => root.render(<Harness {...props} />));
const advance = async ms => act(async () => jest.advanceTimersByTime(ms));
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true; jest.useFakeTimers(); localStorage.clear();
  root = createRoot(document.createElement("div"));
  syncDeposits.mockReset().mockResolvedValue({ confirmed: 2, pending: 1 });
  fetchDepositBalance.mockReset().mockResolvedValue(10);
  mockHistory.replace.mockReset(); clearDepositSession.mockReset();
});
afterEach(() => { act(() => root.unmount()); jest.useRealTimers(); delete global.IS_REACT_ACT_ENVIRONMENT; });
test("primeira sincronização estabelece baseline; aumento confirma e encerra consultas", async () => {
  const refresh = jest.fn(); window.addEventListener("wallet-balance-updated", refresh);
  await mount({ pix: deposit() }); expect(current.status).toBe("pending");
  await advance(5000); expect(current.status).toBe("pending");
  syncDeposits.mockResolvedValue({ confirmed: 3, pending: 0 });
  await advance(5000); expect(current.status).toBe("confirmed"); expect(refresh).toHaveBeenCalledTimes(1);
  await advance(15000); expect(syncDeposits).toHaveBeenCalledTimes(3);
  window.removeEventListener("wallet-balance-updated", refresh);
});
test("falha silenciosa não inventa baseline e 401 encerra a sessão", async () => {
  syncDeposits.mockRejectedValueOnce(new Error("Network"));
  await mount({ pix: deposit() }); expect(current.error).toBeNull();
  syncDeposits.mockResolvedValueOnce({ confirmed: 8, pending: 0 });
  await advance(5000); expect(current.status).toBe("pending");
  syncDeposits.mockRejectedValueOnce({ response: { status: 401 } });
  await advance(5000); expect(clearDepositSession).toHaveBeenCalledTimes(1);
  expect(mockHistory.replace).toHaveBeenCalledWith("/auth/login");
  await advance(10000); expect(syncDeposits).toHaveBeenCalledTimes(3);
});
test("501 interrompe sync mas mantém confirmação por saldo", async () => {
  syncDeposits.mockRejectedValueOnce({ response: { status: 501 } });
  await mount({ pix: deposit() }); fetchDepositBalance.mockResolvedValue(60);
  await advance(5000); expect(current.status).toBe("confirmed"); expect(syncDeposits).toHaveBeenCalledTimes(1);
});
test("início do app sincroniza uma vez por sessão mesmo após remontar", async () => {
  localStorage.setItem("access_token", testSession);
  await mount({ once: true }); expect(syncDeposits).toHaveBeenCalledTimes(1);
  act(() => root.unmount()); root = createRoot(document.createElement("div"));
  await mount({ once: true }); await advance(120000);
  expect(syncDeposits).toHaveBeenCalledTimes(1);
  localStorage.setItem("access_token", newTestSession);
  await mount({ once: true }); expect(syncDeposits).toHaveBeenCalledTimes(2);
});

test("Já paguei faz POST de sincronização, preserva pending e não sobrepõe consultas", async () => {
  await mount({ pix: deposit() });
  await act(async () => current.checkPayment());
  expect(syncDeposits).toHaveBeenCalledTimes(2);
  expect(current.status).toBe("pending");
  let resolve;
  syncDeposits.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  act(() => { current.checkPayment(); current.checkPayment(); });
  expect(syncDeposits).toHaveBeenCalledTimes(3);
  expect(current.checking).toBe(true);
  await act(async () => resolve({ confirmed: 2, pending: 1 }));
  expect(current.checking).toBe(false);
});
