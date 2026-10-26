import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { GamificationProvider, makeCelebrations } from "./GamificationContext";
import { dailyCheckin, gamificationApi, getGamificationSession } from "../services/gamificationApi";
import { makeProfile } from "../testSupport/gamificationFixtures";
import { testSession } from "../testSupport/fixtures";
import { MaintenanceNoticeContext } from "./MaintenanceNoticeContext";
jest.mock("../services/gamificationApi", () => ({ dailyCheckin: jest.fn(), getGamificationSession: jest.fn(), GAMIFICATION_EVENT: "gamification-earned", gamificationApi: { me: jest.fn(), seen: jest.fn() } }));
const mount = () => render(<MemoryRouter><GamificationProvider><button>Origem</button></GamificationProvider></MemoryRouter>);
beforeEach(() => { jest.clearAllMocks(); getGamificationSession.mockReturnValue(testSession); dailyCheckin.mockResolvedValue({ xpEarned: 0 }); gamificationApi.me.mockResolvedValue(makeProfile()); gamificationApi.seen.mockResolvedValue(true); });
afterEach(() => { jest.useRealTimers(); });
test("check-in com XP positivo mostra motivo da visita e zero XP não cria toast", async () => {
  dailyCheckin.mockResolvedValue({ xpEarned: 20 });
  const view = mount(); expect((await screen.findByRole("status")).textContent).toBe("+20 XP · Visita diária");
  view.unmount(); dailyCheckin.mockResolvedValue({ xpEarned: 0 }); mount(); await act(async () => {});
  expect(screen.queryByRole("status")).toBeNull();
});
test("toast só com XP positivo, um por vez, some após quatro segundos", async () => {
  jest.useFakeTimers(); mount(); await act(async () => {});
  expect(screen.queryByRole("status")).toBeNull();
  act(() => window.dispatchEvent(new CustomEvent("gamification-earned", { detail: { action: "lesson_watched", result: { xpEarned: 50 } } })));
  expect(screen.getByRole("status").textContent).toBe("+50 XP · Aula concluída");
  act(() => window.dispatchEvent(new CustomEvent("gamification-earned", { detail: { action: "bankroll_configured", result: { xpEarned: 10 } } })));
  expect(screen.getAllByRole("status")).toHaveLength(1); expect(screen.getByRole("status").textContent).toBe("+10 XP · Banca configurada");
  await act(async () => jest.advanceTimersByTime(3999)); expect(screen.getByRole("status")).toBeTruthy();
  await act(async () => jest.advanceTimersByTime(1)); expect(screen.queryByRole("status")).toBeNull();
});
test("pending entra em fila sem duplicar, Esc fecha, /seen só após toda a fila e foco volta", async () => {
  gamificationApi.me.mockResolvedValue(makeProfile({ pending: [{ type: "level_up", level: 2 }, { type: "achievement", id: "first" }] }));
  dailyCheckin.mockResolvedValue({ xpEarned: 0, leveledUp: true, level: 2, unlocked: ["first"] });
  mount(); await screen.findByRole("dialog", { name: "Você chegou ao nível 2!" });
  expect(screen.getAllByRole("dialog")).toHaveLength(1); expect(gamificationApi.seen).not.toHaveBeenCalled();
  fireEvent.keyUp(screen.getByRole("dialog"), { key: "Escape", keyCode: 27 });
  await screen.findByRole("dialog", { name: "Primeiro passo" });
  expect(gamificationApi.seen).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Fechar")); await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(gamificationApi.seen).toHaveBeenCalledTimes(1);
});
test("celebração de resultado funciona se /me falhar e visto continua silencioso", async () => {
  gamificationApi.me.mockRejectedValue(new Error()); gamificationApi.seen.mockResolvedValue(false);
  dailyCheckin.mockResolvedValue({ xpEarned: 0, leveledUp: true, level: 3, unlocked: ["unknown"] });
  mount(); await screen.findByRole("dialog", { name: "Você chegou ao nível 3!" });
  fireEvent.click(screen.getByText("Fechar")); await screen.findByRole("dialog", { name: "Conquista desbloqueada!" });
  fireEvent.click(screen.getByText("Fechar")); await waitFor(() => expect(gamificationApi.seen).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole("alert")).toBeNull();
});
test.each([7, 30])("sequência %i é celebrada uma vez e check-in já realizado não repete selo", days => {
  expect(makeCelebrations(null, { streak: { current: days }, alreadyCheckedIn: false })).toEqual([expect.objectContaining({ title: `${days} dias seguidos!`, icon: "flame" })]);
  expect(makeCelebrations(null, { streak: { current: days }, alreadyCheckedIn: true })).toEqual([]);
});
test("sem sessão não chama /me; falhas silenciosas não mostram erro global", async () => {
  getGamificationSession.mockReturnValue(null); const view = mount(); await act(async () => {}); expect(gamificationApi.me).not.toHaveBeenCalled();
  view.unmount(); getGamificationSession.mockReturnValue(testSession); dailyCheckin.mockResolvedValue(null); gamificationApi.me.mockRejectedValue(new Error());
  mount(); await act(async () => {}); expect(screen.queryByRole("alert")).toBeNull(); expect(screen.queryByRole("status")).toBeNull();
});
test("manutenção segura celebrações para depois do aviso", async () => {
  gamificationApi.me.mockResolvedValue(makeProfile({ pending: [{ type: "level_up", level: 2 }] }));
  const view = render(<MemoryRouter><MaintenanceNoticeContext.Provider value={{ maintenanceAcknowledged: false }}><GamificationProvider /></MaintenanceNoticeContext.Provider></MemoryRouter>);
  await act(async () => {}); expect(screen.queryByRole("dialog")).toBeNull(); expect(gamificationApi.seen).not.toHaveBeenCalled();
  view.rerender(<MemoryRouter><MaintenanceNoticeContext.Provider value={{ maintenanceAcknowledged: true }}><GamificationProvider /></MaintenanceNoticeContext.Provider></MemoryRouter>);
  await screen.findByRole("dialog");
});
