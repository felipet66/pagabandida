import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import useDepositRanking from "./useDepositRanking";
import bffApi from "../services/bffApi";
jest.mock("../services/bffApi", () => ({ get: jest.fn() }));
let root, current;
function Harness() { current = useDepositRanking(); return null; }
const response = { data: { success: true, data: { month: "2026-10", players: [{ rank: 1, name: "Ana", total: 11300 }] } } };
const advance = async ms => act(async () => jest.advanceTimersByTime(ms));
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  root = createRoot(document.createElement("div"));
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  bffApi.get.mockReset().mockResolvedValue(response);
});
afterEach(() => { act(() => root.unmount()); jest.useRealTimers(); delete document.visibilityState; delete global.IS_REACT_ACT_ENVIRONMENT; });
const mount = async () => act(async () => root.render(<Harness />));
test("consulta pública usa limit 10 e atualiza só enquanto visível a cada 60s", async () => {
  await mount();
  expect(current.players[0].total).toBe(11300);
  expect(bffApi.get).toHaveBeenCalledWith("api/ranking/deposits", expect.objectContaining({ publicRequest: true, params: { limit: 10 } }));
  await advance(59000); expect(bffApi.get).toHaveBeenCalledTimes(1);
  await advance(1000); expect(bffApi.get).toHaveBeenCalledTimes(2);
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
  await advance(120000); expect(bffApi.get).toHaveBeenCalledTimes(2);
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  expect(bffApi.get).toHaveBeenCalledTimes(3);
});
test("falha permite tentar de novo e retorno vazio é sucesso", async () => {
  bffApi.get.mockRejectedValueOnce(new Error("Network"));
  await mount(); expect(current.error).toContain("Não foi possível");
  bffApi.get.mockResolvedValueOnce({ data: { success: true, data: { month: "2026-10", players: [] } } });
  await act(async () => current.refetch());
  expect(current.error).toBeNull(); expect(current.players).toEqual([]);
});
test("não sobrepõe chamadas e aborta ao sair", async () => {
  bffApi.get.mockImplementation(() => new Promise(() => {}));
  await mount(); const signal = bffApi.get.mock.calls[0][1].signal;
  await advance(120000); expect(bffApi.get).toHaveBeenCalledTimes(1);
  act(() => root.unmount()); expect(signal.aborted).toBe(true);
  root = createRoot(document.createElement("div"));
});
