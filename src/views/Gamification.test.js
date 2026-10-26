import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Gamification, { formatXpDate } from "./Gamification";
import { gamificationApi } from "../services/gamificationApi";
import { makeProfile, makeHistory, makeLeaderboard } from "../testSupport/gamificationFixtures";
jest.mock("../services/gamificationApi", () => ({ gamificationApi: { me: jest.fn(), history: jest.fn(), leaderboard: jest.fn() } }));
const mount = () => render(<MemoryRouter><Gamification /></MemoryRouter>);
beforeEach(() => {
  jest.clearAllMocks();
  gamificationApi.me.mockResolvedValue(makeProfile()); gamificationApi.history.mockResolvedValue(makeHistory()); gamificationApi.leaderboard.mockResolvedValue(makeLeaderboard());
});
test("skeleton e normal: nível, sequência, bloqueio, histórico e posição fora do top 10", async () => {
  const { container } = mount(); expect(screen.getByRole("status", { name: "Carregando gamificação" })).toBeTruthy();
  expect(container.querySelectorAll(".gamification-skeleton")).toHaveLength(13);
  await screen.findByText("Aprendiz");
  expect(screen.getByText("20 / 100 XP")).toBeTruthy(); expect(screen.getByText("2 dias seguidos")).toBeTruthy();
  expect(screen.getByText("1/2")).toBeTruthy(); expect(screen.getByText("Bloqueada")).toBeTruthy(); expect(screen.getByText("23º")).toBeTruthy(); expect(screen.getByText("+20 XP")).toBeTruthy();
  expect(screen.queryByRole("switch")).toBeNull();
  expect(formatXpDate("2026-10-13T02:30:00Z")).toContain("12/10/2026"); expect(formatXpDate("bad")).toBe("Data indisponível");
});
test("primeira visita sem XP, sem sequência, sem histórico e sem participantes", async () => {
  gamificationApi.me.mockResolvedValue(makeProfile({ totalXp: 0, level: 1, streak: { current: 0, longest: 0 }, achievements: [] }));
  gamificationApi.history.mockResolvedValue(makeHistory({ items: [] })); gamificationApi.leaderboard.mockResolvedValue(makeLeaderboard({ players: [], me: { position: null, xp: 0, hidden: false } }));
  mount(); await screen.findByText("Volte amanhã para começar");
  expect(screen.getByText("Aprenda com as aulas").getAttribute("href")).toBe("/admin/aulas");
  expect(screen.getByText("Seu histórico começa com o primeiro XP.")).toBeTruthy(); expect(screen.getByText("Ainda sem posição")).toBeTruthy(); expect(screen.getByText("Ainda não há participantes nesta semana.")).toBeTruthy();
});
test("erro com tentativa e resposta inválida são contidos", async () => {
  gamificationApi.me.mockRejectedValueOnce(Object.assign(new Error("Aguarde um minuto"), { code: "RATE_LIMITED" }));
  mount(); await screen.findByRole("alert"); expect(screen.getByText("Aguarde um minuto")).toBeTruthy();
  fireEvent.click(screen.getByText("Tentar de novo")); await screen.findByText("Aprendiz");
  expect(gamificationApi.me).toHaveBeenCalledTimes(2);
});
test("nível 10 usa progresso 100% e nível máximo sem dividir por zero", async () => {
  gamificationApi.me.mockResolvedValue(makeProfile({ level: 10, progress: { current: 0, needed: 0, percentage: 100 } }));
  mount(); await screen.findByText("Nível máximo"); expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("100");
});
test("dados incompletos da tela exibem erro com nova tentativa", async () => {
  gamificationApi.history.mockResolvedValue({ items: null }); mount(); await screen.findByRole("alert");
  expect(screen.getByText("Tentar de novo")).toBeTruthy();
});
test("carregar mais usa offset e mantém os itens; falha permite repetir", async () => {
  gamificationApi.history.mockResolvedValueOnce(makeHistory({ hasMore: true })).mockRejectedValueOnce(new Error()).mockResolvedValueOnce(makeHistory({ items: [{ action: "lesson_watched", label: "Aula concluída", xp: 50, createdAt: "2026-10-12T18:00:00Z" }] }));
  mount(); fireEvent.click(await screen.findByText("Carregar mais")); await screen.findByRole("alert");
  fireEvent.click(screen.getByText("Tentar de novo")); await screen.findByText("Aula concluída");
  expect(screen.getByText("+20 XP")).toBeTruthy(); expect(screen.queryByText("Carregar mais")).toBeNull(); expect(gamificationApi.history).toHaveBeenLastCalledWith(1);
});
test("linha do usuário continua destacada sem interruptor de participação", async () => {
  gamificationApi.leaderboard.mockResolvedValue(makeLeaderboard({ players: [{ rank: 1, name: "Player", xp: 40, isMe: true }], me: { position: 1, xp: 40, hidden: false } }));
  const { container } = mount(); await screen.findByText("Você"); expect(container.querySelector("tr.is-me")).toBeTruthy(); expect(screen.queryByText("Sua posição:")).toBeNull();
  expect(screen.queryByRole("switch")).toBeNull(); expect(screen.queryByText("Aparecer no ranking")).toBeNull();
});
test("flags antigas não ocultam a linha do usuário enviada pelo BFF", async () => {
  gamificationApi.me.mockResolvedValue(makeProfile({ showInRanking: false }));
  gamificationApi.leaderboard.mockResolvedValue(makeLeaderboard({ players: [{ rank: 1, name: "Player", xp: 40, isMe: true }], me: { position: 1, xp: 40, hidden: true } }));
  const { container } = mount(); await screen.findByText("Você");
  expect(container.querySelector("tr.is-me")).toBeTruthy();
  expect(screen.queryByRole("switch")).toBeNull(); expect(screen.queryByText(/Você não aparece/)).toBeNull();
});
test("flags antigas não ocultam a posição recebida de um usuário fora do top 10", async () => {
  gamificationApi.me.mockResolvedValue(makeProfile({ showInRanking: false }));
  gamificationApi.leaderboard.mockResolvedValue(makeLeaderboard({ me: { position: 23, xp: 40, hidden: true } }));
  mount(); await screen.findByText("23º");
  expect(screen.getByText("40 XP")).toBeTruthy();
  expect(screen.queryByRole("switch")).toBeNull(); expect(screen.queryByText(/Você não aparece/)).toBeNull();
});
