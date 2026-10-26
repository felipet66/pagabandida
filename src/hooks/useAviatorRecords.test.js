import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import useAviatorRecords from "./useAviatorRecords";
import { fetchAviatorRecords } from "../services/aviatorRecords";
jest.mock("../services/aviatorRecords", () => ({ fetchAviatorRecords: jest.fn() }));
let root, current;
function Harness({ chartNumber, limit, filter, autoRefresh }) { current = useAviatorRecords(chartNumber, limit, filter, autoRefresh); return null; }
const page = (number, ids, totalPages = 2) => ({ records: ids.map(id => ({ id, odd: "2" })), pagination: { page: number, limit: 100, total: 1000, totalPages } });
const render = async (chartNumber, limit, filter, autoRefresh = false) => { await act(async () => root.render(<Harness chartNumber={chartNumber} limit={limit} filter={filter} autoRefresh={autoRefresh} />)); };
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  fetchAviatorRecords.mockReset();
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  root = createRoot(document.createElement("div"));
});
afterEach(() => { act(() => root.unmount()); jest.useRealTimers(); delete document.hidden; delete global.IS_REACT_ACT_ENVIRONMENT; });

test("carrega próxima página, elimina duplicados e para no totalPages", async () => {
  fetchAviatorRecords.mockResolvedValueOnce(page(1, ["a", "b"])).mockResolvedValueOnce(page(2, ["b", "c"]));
  await render(1);
  expect(current.hasMore).toBe(true);
  await act(async () => current.loadMore());
  expect(fetchAviatorRecords).toHaveBeenLastCalledWith(1, expect.any(AbortSignal), 2, 100, undefined);
  expect(current.records.map(item => item.id)).toEqual(["a", "b", "c"]);
  expect(current.hasMore).toBe(false);
  await act(async () => current.loadMore());
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(2);
});

test("bloqueia cliques simultâneos e permite repetir a mesma página após falha", async () => {
  let reject;
  fetchAviatorRecords.mockResolvedValueOnce(page(1, ["a"])).mockImplementationOnce(() => new Promise((resolve, fail) => { reject = fail; }));
  await render(1);
  act(() => { current.loadMore(); current.loadMore(); });
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(2);
  await act(async () => reject(new Error("Network")));
  expect(current.records.map(item => item.id)).toEqual(["a"]);
  expect(current.loadMoreError).toBeTruthy();
  fetchAviatorRecords.mockResolvedValueOnce(page(2, ["b"]));
  await act(async () => current.loadMore());
  expect(fetchAviatorRecords).toHaveBeenLastCalledWith(1, expect.any(AbortSignal), 2, 100, undefined);
});

test("troca de plataforma cancela paginação anterior e atualização volta à página 1", async () => {
  let resolveOld;
  fetchAviatorRecords.mockResolvedValueOnce(page(1, ["a"])).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; })).mockResolvedValueOnce(page(1, ["vip"]));
  await render(1);
  act(() => { current.loadMore(); });
  const signal = fetchAviatorRecords.mock.calls[1][1];
  await render(2);
  expect(signal.aborted).toBe(true);
  await act(async () => resolveOld(page(2, ["old"])));
  expect(current.records.map(item => item.id)).toEqual(["vip"]);
  fetchAviatorRecords.mockResolvedValueOnce(page(1, ["fresh"]));
  await act(async () => current.refetch());
  expect(fetchAviatorRecords).toHaveBeenLastCalledWith(2, expect.any(AbortSignal), 1, 100, undefined);
  expect(current.records.map(item => item.id)).toEqual(["fresh"]);
});

test("alterar quantidade cancela chamada anterior e reinicia página com novo limit", async () => {
  fetchAviatorRecords.mockResolvedValueOnce(page(1, ["a"])).mockResolvedValueOnce(page(1, ["b"]));
  await render(1, 10);
  expect(fetchAviatorRecords).toHaveBeenLastCalledWith(1, expect.any(AbortSignal), 1, 10, undefined);
  await render(1, 50);
  expect(fetchAviatorRecords).toHaveBeenLastCalledWith(1, expect.any(AbortSignal), 1, 50, undefined);
  expect(current.records.map(record => record.id)).toEqual(["b"]);
});

test("alterar filtro reinicia a consulta na primeira página com a quantidade atual", async () => {
  fetchAviatorRecords.mockResolvedValueOnce(page(1, ["a"])).mockResolvedValueOnce(page(1, ["pink"]));
  await render(2, 50);
  await render(2, 50, 10);
  expect(fetchAviatorRecords).toHaveBeenLastCalledWith(2, expect.any(AbortSignal), 1, 50, 10);
  expect(current.records.map(record => record.id)).toEqual(["pink"]);
});

test("preserva amostra sem filtro e não reutiliza dados antigos na troca de versão", async () => {
  const source = [{ id: "a", odd: "2" }, { id: "b", odd: "15" }];
  fetchAviatorRecords.mockResolvedValueOnce({ ...page(1, ["b"]), sampleRecords: source });
  await render(1, 10, 10);
  expect(current.records.map(record => record.id)).toEqual(["b"]);
  expect(current.sampleRecords).toEqual(source);
  expect(current.sampleLoading).toBe(false);
  let resolve;
  fetchAviatorRecords.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await render(2, 10, 10);
  expect(current.sampleRecords).toEqual([]);
  expect(current.sampleLoading).toBe(true);
  await act(async () => resolve({ ...page(1, ["vip"]), sampleRecords: [{ id: "vip", odd: "20" }] }));
  expect(current.sampleRecords.map(record => record.id)).toEqual(["vip"]);
  expect(current.sampleLoading).toBe(false);
});

const advance = async ms => { await act(async () => jest.advanceTimersByTime(ms)); };
const visibility = async hidden => {
  Object.defineProperty(document, "hidden", { configurable: true, value: hidden });
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
};

test("automático desligado não consulta; ligado consulta após 30s e atualiza a amostra junto", async () => {
  jest.useFakeTimers();
  fetchAviatorRecords.mockResolvedValue(page(1, ["a"]));
  await render(1);
  await advance(60000);
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(1);
  await render(1, undefined, undefined, true);
  await advance(29999);
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(1);
  const previousUpdate = current.lastUpdated;
  fetchAviatorRecords.mockResolvedValue({ ...page(1, ["b"]), sampleRecords: [{ id: "b", odd: "20" }] });
  await advance(1);
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(2);
  expect(current.records[0].id).toBe("b");
  expect(current.sampleRecords[0].id).toBe("b");
  expect(current.lastUpdated.getTime()).toBeGreaterThan(previousUpdate.getTime());
  await render(1);
  await advance(60000);
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(2);
});

test("consulta pendente preserva velas, impede sobreposição e é cancelada ao desativar", async () => {
  jest.useFakeTimers();
  let resolve;
  fetchAviatorRecords.mockResolvedValueOnce(page(1, ["a"])).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await render(1, 100, undefined, true);
  await advance(30000);
  expect(current.loading).toBe(false);
  expect(current.refreshing).toBe(true);
  expect(current.records[0].id).toBe("a");
  await act(async () => current.refetch());
  await advance(90000);
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(2);
  const signal = fetchAviatorRecords.mock.calls[1][1];
  await render(1, 100);
  expect(signal.aborted).toBe(true);
  expect(current.refreshing).toBe(false);
  await act(async () => resolve(page(1, ["old"])));
  expect(current.records[0].id).toBe("a");
});

test("pausa na aba oculta, consulta ao retornar e encerra temporizador ao desmontar", async () => {
  jest.useFakeTimers();
  fetchAviatorRecords.mockResolvedValue(page(1, ["a"]));
  await render(1, 100, undefined, true);
  await visibility(true);
  expect(current.autoRefreshPaused).toBe(true);
  await advance(90000);
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(1);
  await visibility(false);
  expect(current.autoRefreshPaused).toBe(false);
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(2);
  await act(async () => root.render(null));
  await advance(60000);
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(2);
});

test("falha mantém dados e horário, espaça tentativas e recuperação restaura 30s", async () => {
  jest.useFakeTimers();
  fetchAviatorRecords.mockResolvedValueOnce(page(1, ["a"])).mockRejectedValue(new Error("Network"));
  await render(1, 100, undefined, true);
  const updated = current.lastUpdated;
  await advance(30000);
  expect(current.records[0].id).toBe("a");
  expect(current.lastUpdated).toBe(updated);
  expect(current.error).toBeNull();
  expect(current.refreshError).toContain("mantidos");
  expect(current.retryDelay).toBe(60000);
  await advance(30000);
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(2);
  await advance(30000);
  expect(current.retryDelay).toBe(120000);
  fetchAviatorRecords.mockResolvedValue(page(1, ["fresh"]));
  await advance(120000);
  expect(current.refreshError).toBeNull();
  expect(current.retryDelay).toBe(30000);
  expect(current.records[0].id).toBe("fresh");
  await advance(30000);
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(5);
});

test("troca de versão cancela atualização automática e ignora resposta antiga", async () => {
  jest.useFakeTimers();
  let resolve;
  fetchAviatorRecords.mockResolvedValueOnce(page(1, ["original"])).mockImplementationOnce(() => new Promise(done => { resolve = done; })).mockResolvedValue(page(1, ["vip"]));
  await render(1, 50, 10, true);
  await advance(30000);
  const signal = fetchAviatorRecords.mock.calls[1][1];
  await render(2, 50, 10, true);
  expect(signal.aborted).toBe(true);
  await act(async () => resolve(page(1, ["old"])));
  expect(current.records[0].id).toBe("vip");
  await advance(30000);
  expect(fetchAviatorRecords).toHaveBeenLastCalledWith(2, expect.any(AbortSignal), 1, 50, 10);
});

test("atualização manual também preserva o histórico durante a busca", async () => {
  let resolve;
  fetchAviatorRecords.mockResolvedValueOnce(page(1, ["a"])).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  await render(1);
  act(() => { current.refetch(); });
  expect(current.refreshing).toBe(true);
  expect(current.loading).toBe(false);
  expect(current.records[0].id).toBe("a");
  await act(async () => resolve(page(1, ["fresh"])));
  expect(current.records[0].id).toBe("fresh");
});
