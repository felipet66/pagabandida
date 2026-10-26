import { testCookie, testSession } from "../testSupport/fixtures";

import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import useWalletBalances from "./useWalletBalances";
import bffApi from "../services/bffApi";

const mockHistory = { replace: jest.fn() };
jest.mock("react-router-dom", () => ({ useHistory: () => mockHistory }));
jest.mock("../services/bffApi", () => ({ get: jest.fn() }));
let root, current;
const response = { data: { success: true, data: {
  selectedCurrency: "USD", balances: [{ currency: "USD", totalAvailable: "99" }, { currency: "BRL", available: "10", bonus: "2.34" }],
} } };
function Harness() { current = useWalletBalances(); return null; }
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  localStorage.clear();
  localStorage.setItem("access_token", testSession);
  bffApi.get.mockReset().mockResolvedValue(response);
  mockHistory.replace.mockReset();
  root = createRoot(document.createElement("div"));
});
afterEach(() => {
  act(() => root.unmount());
  jest.useRealTimers();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
const mount = async () => { await act(async () => root.render(<Harness />)); };
const advance = async ms => { await act(async () => jest.advanceTimersByTime(ms)); };

test("consulta autenticada escolhe a moeda e lê reais e mantém bônus separado sem dividir por 100", async () => {
  await mount();
  expect(current.balance).toBe(10);
  expect(current.wallet.bonus).toBe("2.34");
  expect(current.currency).toBe("BRL");
  expect(bffApi.get).toHaveBeenCalledWith("api/wallet/balances", expect.objectContaining({ handleUnauthorized: true, signal: expect.any(AbortSignal) }));
  await advance(119999);
  expect(bffApi.get).toHaveBeenCalledTimes(1);
  await advance(1);
  expect(bffApi.get).toHaveBeenCalledTimes(2);
  await act(async () => current.refetch());
  expect(bffApi.get).toHaveBeenCalledTimes(3);
});

test("não sobrepõe chamadas pendentes e cancela polling/requisição ao desmontar", async () => {
  bffApi.get.mockImplementation(() => new Promise(() => {}));
  await mount();
  const signal = bffApi.get.mock.calls[0][1].signal;
  await advance(240000);
  await act(async () => current.refetch());
  expect(bffApi.get).toHaveBeenCalledTimes(1);
  act(() => root.unmount());
  expect(signal.aborted).toBe(true);
  await advance(240000);
  expect(bffApi.get).toHaveBeenCalledTimes(1);
});

test("401 limpa sessão e leva ao login preservando atribuição", async () => {
  localStorage.setItem("cookie_key", testCookie);
  localStorage.setItem("axioAffId", "WLJIE");
  bffApi.get.mockRejectedValue({ response: { status: 401 } });
  await mount();
  expect(localStorage.getItem("access_token")).toBeNull();
  expect(localStorage.getItem("cookie_key")).toBeNull();
  expect(localStorage.getItem("axioAffId")).toBe("WLJIE");
  expect(mockHistory.replace).toHaveBeenCalledWith("/auth/login");
});

test("falha de rede ou moeda ausente exibe indisponibilidade sem inventar saldo zero", async () => {
  bffApi.get.mockResolvedValue({ data: { success: true, data: { selectedCurrency: "USD", balances: [] } } });
  await mount();
  expect(current.balance).toBeNull();
  expect(current.error).toBeTruthy();
  bffApi.get.mockRejectedValue(new Error("Network"));
  await act(async () => current.refetch());
  expect(current.balance).toBeNull();
  expect(mockHistory.replace).not.toHaveBeenCalled();
});

test("atualiza imediatamente após confirmação de um Pix", async () => {
  await mount();
  await act(async () => window.dispatchEvent(new Event("wallet-balance-updated")));
  expect(bffApi.get).toHaveBeenCalledTimes(2);
});
