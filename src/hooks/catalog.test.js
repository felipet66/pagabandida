import { makeFixtureUrl, testSession } from "../testSupport/fixtures";
const fixtureGameUrl0 = makeFixtureUrl();
const fixtureGameUrl1 = makeFixtureUrl();
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import bffApi from "../services/bffApi";
import useCatalog from "./useCatalog";
import useStartGame from "./useStartGame";

jest.mock("../services/bffApi", () => ({ get: jest.fn() }));
let root;
let container;
let current;
const renderHook = hook => {
  function Harness() { current = hook(); return null; }
  act(() => root.render(<Harness />));
};
const advance = async ms => { await act(async () => { jest.advanceTimersByTime(ms); }); };
const page = (offset, hasMore = true) => ({ data: { success: true, data: {
  offset, limit: 24, total: 49, hasMore,
  games: [{ id: String(offset), name: `Game ${offset}`, launchSlug: `vendor/game-${offset}`, vendorSlug: "vendor", vendorName: "Vendor", category: "Slots" }],
} } });

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  bffApi.get.mockReset();
  localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

it("debounces search, cancels the old request and ignores its late response", async () => {
  let resolveOld;
  bffApi.get.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
  bffApi.get.mockResolvedValueOnce(page(0, false));
  renderHook(useCatalog);
  await advance(0);
  const oldSignal = bffApi.get.mock.calls[0][1].signal;
  act(() => current.setQ("tiger"));
  expect(oldSignal.aborted).toBe(true);
  await advance(349);
  expect(bffApi.get).toHaveBeenCalledTimes(1);
  await advance(1);
  expect(bffApi.get.mock.calls[1][1].params).toEqual({ q: "tiger", offset: 0, limit: 24 });
  await act(async () => resolveOld(page(24)));
  expect(current.games.map(game => game.id)).toEqual(["0"]);
});

it("requests each next offset once and stops at hasMore=false", async () => {
  let resolveNext;
  bffApi.get.mockResolvedValueOnce(page(0));
  bffApi.get.mockImplementationOnce(() => new Promise(resolve => { resolveNext = resolve; }));
  renderHook(useCatalog);
  await advance(0);
  act(() => { current.loadMore(); current.loadMore(); });
  expect(bffApi.get).toHaveBeenCalledTimes(2);
  expect(bffApi.get.mock.calls[1][1].params.offset).toBe(24);
  await act(async () => resolveNext(page(24, false)));
  act(() => current.loadMore());
  expect(bffApi.get).toHaveBeenCalledTimes(2);
  expect(current.games).toHaveLength(2);
});

it("resets pagination for filters and retries the failed page", async () => {
  bffApi.get.mockResolvedValueOnce(page(0));
  bffApi.get.mockRejectedValueOnce({ response: { status: 503 } });
  bffApi.get.mockResolvedValueOnce(page(0, false));
  renderHook(useCatalog);
  await advance(0);
  act(() => { current.setVendor("pgsoft"); current.setCategory("Live casino"); });
  expect(current.games).toEqual([]);
  await advance(350);
  expect(current.error).toBeTruthy();
  await act(async () => { current.retry(); });
  expect(bffApi.get.mock.calls[2][1].params).toMatchObject({ vendor: "pgsoft", category: "Live casino", offset: 0 });
  expect(current.error).toBeNull();
  expect(bffApi.get.mock.calls[2][1].publicRequest).toBe(true);
});

it("launches with a token without a cookie and generates a fresh URL every time", async () => {
  localStorage.setItem("access_token", testSession);
  bffApi.get.mockResolvedValueOnce({ data: { success: true, data: { gameURL: fixtureGameUrl0 } } });
  bffApi.get.mockResolvedValueOnce({ data: { gameURL: fixtureGameUrl1 } });
  renderHook(useStartGame);
  await act(async () => current.startGame({ slug: "pgsoft/fortune-tiger" }));
  expect(current.gameUrl).toBe(fixtureGameUrl0);
  expect(bffApi.get.mock.calls[0][1].params.slug).toBe("pgsoft/fortune-tiger");
  await act(async () => current.startGame({ slug: "pgsoft/fortune-tiger" }));
  expect(bffApi.get).toHaveBeenCalledTimes(2);
  expect(current.gameUrl).toBe(fixtureGameUrl1);
  act(() => current.resetGame());
  expect(current.gameUrl).toBeNull();
});

it("requires login before launch and clears an expired session on 401", async () => {
  const onAuthRequired = jest.fn();
  renderHook(() => useStartGame({ onAuthRequired }));
  await act(async () => current.startGame({ slug: "spribe/aviator" }));
  expect(onAuthRequired).toHaveBeenCalledTimes(1);
  expect(bffApi.get).not.toHaveBeenCalled();
  localStorage.setItem("access_token", testSession);
  bffApi.get.mockRejectedValueOnce({ response: { status: 401 } });
  await act(async () => current.startGame({ slug: "spribe/aviator" }));
  expect(onAuthRequired).toHaveBeenCalledTimes(2);
  expect(localStorage.getItem("access_token")).toBeNull();
});

it("shows unavailable games and rejects error envelopes without exposing launch URLs", async () => {
  localStorage.setItem("access_token", testSession);
  bffApi.get.mockRejectedValueOnce({ response: { status: 400, data: { error: { code: "INVALID_GAME_SLUG" } } } });
  bffApi.get.mockResolvedValueOnce({ data: { success: false, error: { message: "internal details", code: "UNKNOWN" } } });
  renderHook(useStartGame);
  await act(async () => current.startGame({ slug: "removed/game" }));
  expect(current.error).toBe("Jogo indisponível");
  await act(async () => current.startGame({ slug: "vendor/game" }));
  expect(current.error).toBe("Não foi possível abrir o jogo. Tente novamente.");
  expect(current.gameUrl).toBeNull();
});

it("detecta WEB e MOBILE pelo navegador sem aceitar plataformas antigas", async () => {
  localStorage.setItem("access_token", testSession);
  bffApi.get.mockResolvedValue({ data: { success: true, data: { gameURL: fixtureGameUrl0 } } });
  const userAgent = Object.getOwnPropertyDescriptor(navigator, "userAgent");
  renderHook(useStartGame);
  try {
    Object.defineProperty(navigator, "userAgent", { configurable: true, value: "Desktop" });
    await act(async () => current.startGame({ slug: "spribe/aviator" }));
    expect(bffApi.get.mock.calls[0][1].params.platform).toBe("WEB");
    Object.defineProperty(navigator, "userAgent", { configurable: true, value: "Android Mobile" });
    await act(async () => current.startGame({ slug: "spribe/aviator-vip" }));
    expect(bffApi.get.mock.calls[1][1].params.platform).toBe("MOBILE");
  } finally {
    if (userAgent) Object.defineProperty(navigator, "userAgent", userAgent);
    else delete navigator.userAgent;
  }
});
