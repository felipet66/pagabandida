import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import RealtimeAnalysis from "./RealtimeAnalysis";
import useStartGame from "hooks/useStartGame";
import useAviatorRadar from "hooks/useAviatorRadar";

jest.mock("hooks/useStartGame", () => jest.fn());
jest.mock("hooks/useAviatorRadar", () => jest.fn());
jest.mock("components/Home/AviatorPlayer", () => ({ title }) => <section aria-label={`Player ${title}`} />);

const NOW = Date.parse("2026-10-19T13:00:00Z");
let startGame, radar;
beforeEach(() => {
  jest.useFakeTimers(); jest.setSystemTime(NOW);
  startGame = jest.fn();
  useStartGame.mockReturnValue({ startGame, gameUrl: null, loading: false, error: null });
  radar = { status: "ready", window: null, now: NOW, historyCount: 100, updatedAt: NOW };
  useAviatorRadar.mockImplementation((chart, enabled) => enabled ? radar : { status: "off", window: null });
});
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
const activate = () => fireEvent.click(screen.getByRole("switch", { name: "Alertas de 4x a 5x" }));

test("activation enables the live radar for the selected version and never generates a fake alert", () => {
  render(<RealtimeAnalysis />);
  expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("false");
  expect(useAviatorRadar).toHaveBeenLastCalledWith(1, false);
  activate();
  expect(useAviatorRadar).toHaveBeenLastCalledWith(1, true);
  expect(screen.getByText("Aguardando oportunidade")).toBeTruthy();
  act(() => jest.advanceTimersByTime(30000));
  expect(screen.queryByText("Alvo de 4x a 5x", { exact: true })).toBeNull();
  expect(screen.queryByText(/Simular alerta|Demonstração|1,5x/)).toBeNull();
  activate();
  expect(screen.queryByText("Aguardando oportunidade")).toBeNull();
});

test("a real window shows Brasília times and notifies once, without stopping the radar", () => {
  radar.window = { id: "round-1", projectedAtMs: NOW + 30000, windowEndMs: NOW + 180000 };
  const view = render(<RealtimeAnalysis />);
  activate();
  expect(screen.getByText("Oportunidade estimada")).toBeTruthy();
  expect(screen.getByText("Começa em 00:30 · alvo 4x a 5x")).toBeTruthy();
  expect(screen.getByText("JANELA ESTIMADA · Original")).toBeTruthy();
  expect(screen.getAllByText("10:00:30 – 10:03:00")).toHaveLength(2);
  act(() => jest.advanceTimersByTime(6000));
  expect(screen.queryByText("JANELA ESTIMADA · Original")).toBeNull();
  expect(screen.getByText("Oportunidade estimada")).toBeTruthy();
  activate(); activate();
  expect(screen.queryByText("JANELA ESTIMADA · Original")).toBeNull();
  radar = { ...radar, now: NOW + 60000 };
  view.rerender(<RealtimeAnalysis />);
  expect(screen.getByText("Janela em acompanhamento")).toBeTruthy();
  expect(screen.getByText("Termina em 02:00 · alvo 4x a 5x")).toBeTruthy();
});

test("version changes update both the player and live history chart", () => {
  render(<RealtimeAnalysis />); activate();
  fireEvent.click(screen.getByRole("button", { name: "VIP", exact: true }));
  expect(startGame).toHaveBeenLastCalledWith({ slug: "spribe/aviator-vip" });
  expect(useAviatorRadar).toHaveBeenLastCalledWith(2, true);
  expect(screen.getByRole("region", { name: "Player Aviator VIP" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Premium", exact: true }));
  expect(startGame).toHaveBeenLastCalledWith({ slug: "spribe/aviator-premium" });
  expect(useAviatorRadar).toHaveBeenLastCalledWith(3, true);
});

test.each([
  ["stale", "Aguardando novos resultados"], ["error", "Sem conexão com o histórico"],
  ["paused", "Monitoramento pausado"], ["insufficient", "Aguardando base histórica"],
])("%s is visibly distinct from monitoring a fresh feed", (status, text) => {
  radar = { ...radar, status, occurrenceCount: 2 };
  render(<RealtimeAnalysis />); activate();
  expect(screen.getByText(text)).toBeTruthy();
  expect(screen.queryByText("Aguardando oportunidade")).toBeNull();
  expect(screen.queryByText(/JANELA ESTIMADA/)).toBeNull();
});

test.each([
  ["GREEN", 4.25, "GREEN · 4,25x", "RESULTADO CONFIRMADO · Original"],
  ["RED", null, "RED · alvo não atingido", "RESULTADO CONFIRMADO · Original"],
  ["NO_DATA", null, "Inconclusivo · dados insuficientes", "JANELA INCONCLUSIVA · Original"],
])("%s displays a result notification and retains the compact confirmation after dismissal", (status, odd, label, title) => {
  const view = render(<RealtimeAnalysis />); activate();
  radar = { ...radar, lastOutcome: { id: "finished-window", status, odd, occurredAt: NOW, projectedAtMs: NOW - 150000, windowEndMs: NOW } };
  view.rerender(<RealtimeAnalysis />);
  expect(screen.getByText(title)).toBeTruthy();
  expect(screen.getAllByText(label)).toHaveLength(2);
  const badge = screen.getByRole("status", { name: `Último resultado: ${label}` });
  expect(badge.className).toContain(`realtime-outcome--${status.toLowerCase()}`);
  expect(screen.getByText("Aguardando oportunidade")).toBeTruthy();
  act(() => jest.advanceTimersByTime(6000));
  expect(screen.queryByText(title)).toBeNull();
  expect(screen.getByRole("status", { name: `Último resultado: ${label}` })).toBeTruthy();
  view.rerender(<RealtimeAnalysis />);
  activate(); activate();
  expect(screen.queryByText(title)).toBeNull();
});

test("a result replaces the forecast notification and pending confirmation is explicit", () => {
  radar.window = { id: "window", projectedAtMs: NOW - 200000, windowEndMs: NOW - 50000 };
  const view = render(<RealtimeAnalysis />); activate();
  expect(screen.getByText("Conferindo resultado")).toBeTruthy();
  radar = { ...radar, window: null, lastOutcome: { id: "window", status: "RED", odd: null, occurredAt: NOW - 50000 } };
  view.rerender(<RealtimeAnalysis />);
  expect(screen.getByText("RESULTADO CONFIRMADO · Original")).toBeTruthy();
  expect(screen.queryByText("JANELA ESTIMADA · Original")).toBeNull();
});
