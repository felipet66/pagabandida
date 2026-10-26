import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import useAviatorProAnalysis from "./useAviatorProAnalysis";
import { fetchAviatorRecords } from "../services/aviatorRecords";
jest.mock("../services/aviatorRecords", () => ({ fetchAviatorRecords: jest.fn() }));
let root, current;
function Harness({ chartNumber, limit }) { current = useAviatorProAnalysis(chartNumber, limit); return null; }
const render = async (chartNumber, limit = 100) => { await act(async () => root.render(<Harness chartNumber={chartNumber} limit={limit} />)); };
const advance = async ms => { await act(async () => { jest.advanceTimersByTime(ms); }); };
const analyzeAndFinish = async () => {
  let completion;
  act(() => { completion = current.analyze(); });
  await advance(4000);
  await act(async () => completion);
};
beforeEach(() => {
  jest.useFakeTimers(); jest.setSystemTime(new Date("2026-10-13T05:00:00Z"));
  global.IS_REACT_ACT_ENVIRONMENT = true; fetchAviatorRecords.mockReset(); root = createRoot(document.createElement("div"));
});
afterEach(() => { act(() => root.unmount()); jest.useRealTimers(); delete global.IS_REACT_ACT_ENVIRONMENT; });

test("consulta manual bloqueia cliques duplicados e mantém loader por exatamente 4s em resposta rápida", async () => {
  fetchAviatorRecords.mockResolvedValue({ records: [] });
  await render(2, 100);
  expect(fetchAviatorRecords).not.toHaveBeenCalled();
  act(() => { current.analyze(); current.analyze(); });
  expect(current.loading).toBe(true); expect(current.canAnalyze).toBe(false);
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(1);
  expect(fetchAviatorRecords).toHaveBeenCalledWith(2, expect.any(AbortSignal), 1, 100);
  await advance(3999); expect(current.loading).toBe(true); expect(current.result).toBeNull();
  await advance(1); expect(current.loading).toBe(false); expect(current.result.records).toEqual([]); expect(current.canAnalyze).toBe(true);
});

test("consulta lenta continua bloqueada após a animação, até receber o histórico", async () => {
  let resolve;
  fetchAviatorRecords.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await render(1); act(() => { current.analyze(); });
  await advance(5000); expect(current.loading).toBe(true);
  await act(async () => resolve({ records: [] })); expect(current.loading).toBe(false);
});

test("troca de versão ou quantidade cancela consulta, timer e resposta antiga", async () => {
  let resolve;
  fetchAviatorRecords.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await render(1); act(() => { current.analyze(); });
  const signal = fetchAviatorRecords.mock.calls[0][1];
  await render(2, 100);
  expect(signal.aborted).toBe(true); expect(current.loading).toBe(false);
  await act(async () => resolve({ records: [{ odd: "99" }] }));
  expect(current.result).toBeNull();
  fetchAviatorRecords.mockResolvedValueOnce({ records: [] });
  await analyzeAndFinish();
  expect(fetchAviatorRecords).toHaveBeenLastCalledWith(2, expect.any(AbortSignal), 1, 100);
  await render(2, 50); expect(current.result).toBeNull();
});

test("erro aguarda os 4s e permite nova tentativa sem inventar horário de bloqueio", async () => {
  fetchAviatorRecords.mockRejectedValueOnce(new Error("Network"));
  await render(1); act(() => { current.analyze(); });
  await advance(3999); expect(current.error).toBeNull(); expect(current.loading).toBe(true);
  await advance(1); expect(current.error).toContain("Não foi possível carregar"); expect(current.canAnalyze).toBe(true);
  fetchAviatorRecords.mockResolvedValueOnce({ records: [] }); await analyzeAndFinish(); expect(current.error).toBeNull();
});

const sample = now => [-60000, -30000, 0].map((offset, index) => ({ odd: index === 1 ? "4" : "12", dataTime: new Date(now + offset).toISOString() }));
test("espera os dois horários da última análise e libera automaticamente, inclusive na virada do dia", async () => {
  const now = Date.parse("2026-10-14T02:59:30Z"); jest.setSystemTime(now);
  fetchAviatorRecords.mockResolvedValue({ records: sample(now) });
  await render(1); await analyzeAndFinish();
  expect(current.result.timings.map(t => t.next)).toEqual(["00:00:00", "00:00:30"]);
  expect(current.unlockAt).toBe(now + 60000); expect(current.canAnalyze).toBe(false);
  await act(async () => current.analyze()); expect(fetchAviatorRecords).toHaveBeenCalledTimes(1);
  await advance(26000); expect(current.canAnalyze).toBe(false);
  await advance(29999); expect(current.canAnalyze).toBe(false);
  await advance(1); expect(current.canAnalyze).toBe(true);
  await analyzeAndFinish(); expect(fetchAviatorRecords).toHaveBeenCalledTimes(2);
});

test("voltar à versão anterior preserva o resultado e o bloqueio", async () => {
  fetchAviatorRecords.mockResolvedValue({ records: sample(Date.now()) });
  await render(1); await analyzeAndFinish(); const result = current.result;
  await render(2); expect(current.result).toBeNull(); expect(current.canAnalyze).toBe(true);
  await render(1); expect(current.result).toBe(result); expect(current.canAnalyze).toBe(false);
});

test("sair da tela cancela consulta e remove o timer da animação", async () => {
  fetchAviatorRecords.mockResolvedValue({ records: [] });
  await render(1); act(() => { current.analyze(); });
  const signal = fetchAviatorRecords.mock.calls[0][1];
  await act(async () => root.render(null)); expect(signal.aborted).toBe(true); expect(jest.getTimerCount()).toBe(0);
});
