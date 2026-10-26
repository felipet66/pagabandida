import { act, renderHook } from "@testing-library/react";
import useAviatorRadar from "./useAviatorRadar";
import { fetchAviatorRecords } from "../services/aviatorRecords";

jest.mock("../services/aviatorRecords", () => ({ fetchAviatorRecords: jest.fn() }));
const NOW = Date.parse("2026-10-19T13:00:00Z");
const records = () => [-180000, -120000, 0].map((offset, index) => ({ id: String(index + 1), odd: "8", dataTime: new Date(NOW + offset).toISOString() }));
const advance = async ms => act(async () => { jest.advanceTimersByTime(ms); });
const flush = async () => act(async () => {});
const scene = (enabled = true) => renderHook(({ chartNumber, active }) => useAviatorRadar(chartNumber, active), { initialProps: { chartNumber: 1, active: enabled } });
beforeEach(() => {
  jest.useFakeTimers(); jest.setSystemTime(NOW);
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  fetchAviatorRecords.mockReset().mockResolvedValue({ records: records() });
});
afterEach(() => { jest.useRealTimers(); delete document.hidden; });

test("does not fetch while off, then polls every 5s with no duplicate forecast", async () => {
  const view = scene(false);
  expect(fetchAviatorRecords).not.toHaveBeenCalled();
  view.rerender({ chartNumber: 1, active: true }); await flush();
  expect(fetchAviatorRecords).toHaveBeenLastCalledWith(1, expect.any(AbortSignal), 1, 100);
  const window = view.result.current.window;
  expect(window).toBeTruthy();
  await advance(5000);
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(2);
  expect(view.result.current.window).toBe(window);
  view.rerender({ chartNumber: 1, active: false });
  await advance(10000);
  expect(view.result.current.status).toBe("off");
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(2);
  expect(jest.getTimerCount()).toBe(0);
});

test("aborts an old version's request and ignores its late response", async () => {
  let resolveOld;
  fetchAviatorRecords.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
  const view = scene();
  const oldSignal = fetchAviatorRecords.mock.calls[0][1];
  view.rerender({ chartNumber: 2, active: true }); await flush();
  expect(oldSignal.aborted).toBe(true);
  expect(fetchAviatorRecords).toHaveBeenLastCalledWith(2, expect.any(AbortSignal), 1, 100);
  const currentWindow = view.result.current.window;
  await act(async () => resolveOld({ records: [] }));
  expect(view.result.current.window).toBe(currentWindow);
});

test("pauses requests when hidden and immediately refreshes when visible", async () => {
  const view = scene(); await flush();
  Object.defineProperty(document, "hidden", { configurable: true, value: true });
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(view.result.current.status).toBe("paused");
  expect(view.result.current.window).toBeNull();
  await advance(15000);
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(1);
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(2);
  expect(view.result.current.window).toBeTruthy();
});

test("network failures suppress alerts and back off before recovering", async () => {
  fetchAviatorRecords.mockRejectedValueOnce(new Error("offline"));
  const view = scene(); await flush();
  expect(view.result.current.status).toBe("error");
  expect(view.result.current.window).toBeNull();
  await advance(9999); expect(fetchAviatorRecords).toHaveBeenCalledTimes(1);
  await advance(1); expect(fetchAviatorRecords).toHaveBeenCalledTimes(2);
  expect(view.result.current.status).toBe("ready");
});

test("freshness expires even before a slow refresh finishes", async () => {
  const view = scene(); await flush();
  fetchAviatorRecords.mockImplementation(() => new Promise(() => {}));
  await advance(61000);
  expect(view.result.current.status).toBe("stale");
  expect(view.result.current.window).toBeNull();
});

test("a stalled request is aborted after 10s and recovers through the retry", async () => {
  fetchAviatorRecords.mockImplementationOnce((chart, signal) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
  }));
  const view = scene();
  const signal = fetchAviatorRecords.mock.calls[0][1];
  await advance(10000);
  expect(signal.aborted).toBe(true);
  expect(view.result.current.status).toBe("error");
  await advance(10000);
  expect(fetchAviatorRecords).toHaveBeenCalledTimes(2);
  expect(view.result.current.status).toBe("ready");
});

test("returning to a version or reenabling resumes its window without recreating it", async () => {
  const view = scene(); await flush();
  const original = view.result.current.window;
  view.rerender({ chartNumber: 2, active: true }); await flush();
  view.rerender({ chartNumber: 1, active: true }); await flush();
  expect(view.result.current.window).toBe(original);
  view.rerender({ chartNumber: 1, active: false });
  view.rerender({ chartNumber: 1, active: true }); await flush();
  expect(view.result.current.window).toBe(original);
});

test("unmount cancels timers and in-flight requests", async () => {
  fetchAviatorRecords.mockImplementation(() => new Promise(() => {}));
  const view = scene();
  const signal = fetchAviatorRecords.mock.calls[0][1];
  view.unmount();
  expect(signal.aborted).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
});

test("confirmed results survive connection errors and remain isolated by version", async () => {
  const view = scene(); await flush();
  await advance(130000);
  fetchAviatorRecords.mockResolvedValue({ records: [...records(), { id: "4", odd: "4.25", dataTime: new Date(NOW + 130000).toISOString() }] });
  await advance(5000);
  const outcome = view.result.current.lastOutcome;
  expect(outcome).toMatchObject({ status: "GREEN", odd: 4.25 });
  fetchAviatorRecords.mockRejectedValueOnce(new Error("offline"));
  await advance(5000);
  expect(view.result.current.status).toBe("error");
  expect(view.result.current.lastOutcome).toBe(outcome);
  view.rerender({ chartNumber: 2, active: true }); await flush();
  expect(view.result.current.lastOutcome).toBeNull();
  view.rerender({ chartNumber: 1, active: true }); await flush();
  expect(view.result.current.lastOutcome).toBe(outcome);
});
