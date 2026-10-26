import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import useAviatorRecords from "hooks/useAviatorRecords";
import useStartGame from "hooks/useStartGame";

jest.mock("hooks/useAviatorRecords", () => jest.fn());
jest.mock("hooks/useStartGame", () => jest.fn());
jest.mock("components/HistoryOdds/HistoryOdds", () => ({ autoRefresh, onAutoRefreshChange }) => <button type="button" aria-pressed={autoRefresh} onClick={() => onAutoRefreshChange(!autoRefresh)}>Atualização automática de teste</button>);
jest.mock("components/Home/AviatorPlayer", () => ({ title }) => <h2>{title}</h2>);

beforeEach(() => { localStorage.clear(); });

test("Premium usa o histórico do gráfico 3 e o player correspondente; Original e VIP continuam disponíveis", () => {
  const startGame = jest.fn();
  useStartGame.mockReturnValue({ startGame, gameUrl: null, loading: false, error: null });
  useAviatorRecords.mockReturnValue({ records: [], loading: false, error: null, refetch: jest.fn() });
  render(<MemoryRouter><Home /></MemoryRouter>);
  const premium = screen.getByRole("button", { name: "Premium", exact: true });
  expect(premium.disabled).toBe(false);
  expect(premium.querySelector("svg")).toBeTruthy();
  expect(premium.getAttribute("aria-pressed")).toBe("false");
  expect(startGame).toHaveBeenCalledWith({ slug: "spribe/aviator" });
  fireEvent.click(premium);
  expect(useAviatorRecords).toHaveBeenLastCalledWith(3, 100, undefined, false);
  expect(startGame).toHaveBeenLastCalledWith({ slug: "spribe/aviator-premium" });
  expect(premium.getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("heading", { name: "Aviator Premium" })).toBeTruthy();
  expect(screen.queryByText("Em breve")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "VIP", exact: true }));
  expect(useAviatorRecords).toHaveBeenLastCalledWith(2, 100, undefined, false);
  expect(startGame).toHaveBeenLastCalledWith({ slug: "spribe/aviator-vip" });
  expect(screen.getByRole("heading", { name: "Aviator VIP" })).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Original", exact: true }));
  expect(useAviatorRecords).toHaveBeenLastCalledWith(1, 100, undefined, false);
  expect(startGame).toHaveBeenLastCalledWith({ slug: "spribe/aviator" });
});


test("automático inicia desligado, botão persiste preferência e restaura ao reabrir", () => {
  useStartGame.mockReturnValue({ startGame: jest.fn(), gameUrl: null, loading: false, error: null });
  useAviatorRecords.mockReturnValue({ records: [], loading: false, error: null, refetch: jest.fn() });
  const view = render(<MemoryRouter><Home /></MemoryRouter>);
  const button = screen.getByRole("button", { name: "Atualização automática de teste" });
  expect(button.getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(button);
  expect(useAviatorRecords).toHaveBeenLastCalledWith(1, 100, undefined, true);
  expect(localStorage.getItem("pagabandida:history-auto-refresh")).toBe("true");
  view.unmount();
  render(<MemoryRouter><Home /></MemoryRouter>);
  expect(screen.getByRole("button", { name: "Atualização automática de teste" }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Atualização automática de teste" }));
  expect(localStorage.getItem("pagabandida:history-auto-refresh")).toBe("false");
});
