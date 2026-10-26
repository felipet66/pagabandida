import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GameCatalog from "./GameCatalog";
import useCatalog from "hooks/useCatalog";
import useStartGame from "hooks/useStartGame";
import { promptGameLogin } from "services/gameLoginPrompt";
import { testSession } from "../testSupport/fixtures";

jest.mock("hooks/useCatalog", () => jest.fn());
jest.mock("hooks/useStartGame", () => jest.fn());
jest.mock("services/gameLoginPrompt", () => ({ promptGameLogin: jest.fn() }));
jest.mock("components/BannerCarousel/BannerCarousel", () => () => <div>Destaques de teste</div>);

let catalog, startGame;
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  catalog = { q: "", vendor: "", category: "", games: [{ id: "fixture", name: "Jogo de teste", launchSlug: "fixture/game", category: "Slots", vendorName: "Teste" }],
    vendors: [{ value: "fixture", label: "Provedor de teste" }], categories: ["Slots"], total: 1, loading: false, error: null, hasMore: false,
    setQ: jest.fn(), setVendor: jest.fn(), setCategory: jest.fn(), retry: jest.fn(), loadMore: jest.fn() };
  startGame = jest.fn();
  useCatalog.mockImplementation(() => catalog);
  useStartGame.mockReturnValue({ startGame, resetGame: jest.fn(), loading: false, error: null, gameUrl: null });
  promptGameLogin.mockResolvedValue(undefined);
});
const mount = () => render(<MemoryRouter><GameCatalog /></MemoryRouter>);

test("busca, provedores, categorias e atalhos mantêm suas ações sem a seção de aulas", () => {
  render(<MemoryRouter><GameCatalog embedded /></MemoryRouter>);
  expect(screen.queryByRole("link", { name: /Assistir aula/i })).toBeNull();
  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar jogo" }), { target: { value: "teste" } });
  fireEvent.change(screen.getByRole("combobox", { name: "Provedor" }), { target: { value: "fixture" } });
  fireEvent.change(screen.getByRole("combobox", { name: "Categoria" }), { target: { value: "Slots" } });
  expect(catalog.setQ).toHaveBeenCalledWith("teste");
  expect(catalog.setVendor).toHaveBeenCalledWith("fixture");
  expect(catalog.setCategory).toHaveBeenCalledWith("Slots");
  fireEvent.click(screen.getByRole("button", { name: "Todos" }));
  expect(catalog.setCategory).toHaveBeenLastCalledWith("");
  expect(screen.getByRole("link", { name: /Histórico Completo/ }).getAttribute("href")).toBe("/admin/dashboard");
  expect(screen.getByRole("link", { name: /Análises com I.A./ }).getAttribute("href")).toBe("/admin/horarios");
});

test("sem sessão, o card de jogo pede login e não inicia o jogo", () => {
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Jogar Aviator Original" }));
  expect(promptGameLogin).toHaveBeenCalledWith(expect.objectContaining({ launchSlug: "spribe/aviator" }), expect.anything());
  expect(startGame).not.toHaveBeenCalled();
});

test("Premium aparece no destaque e pede login sem sessão", () => {
  mount();
  const premium = screen.getByRole("button", { name: "Jogar Aviator Premium" });
  expect(premium.disabled).toBe(false);
  fireEvent.click(premium);
  expect(promptGameLogin).toHaveBeenCalledWith(expect.objectContaining({ launchSlug: "spribe/aviator-premium", name: "Aviator Premium" }), expect.anything());
  expect(startGame).not.toHaveBeenCalled();
});

test("Premium em Jogos usa o slug informado e o player existente", () => {
  localStorage.setItem("access_token", testSession);
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Jogar Aviator Premium" }));
  expect(startGame).toHaveBeenCalledWith({ slug: "spribe/aviator-premium" });
  expect(screen.getByRole("dialog", { name: "Aviator Premium" })).toBeTruthy();
});

test("com sessão, abrir e fechar o player preserva o fluxo e devolve foco", () => {
  localStorage.setItem("access_token", testSession);
  const resetGame = jest.fn();
  useStartGame.mockReturnValue({ startGame, resetGame, loading: true, error: null, gameUrl: null });
  mount();
  const button = screen.getByRole("button", { name: "Jogar Aviator VIP" });
  button.focus();
  fireEvent.click(button);
  expect(startGame).toHaveBeenCalledWith({ slug: "spribe/aviator-vip" });
  expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Fechar jogo" }));
  expect(resetGame).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(button);
});

test("erro do catálogo oferece nova tentativa e resultado vazio continua legível", () => {
  catalog.error = "Não foi possível carregar os jogos.";
  catalog.games = [];
  const view = mount();
  expect(screen.getByRole("alert").textContent).toContain(catalog.error);
  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(catalog.retry).toHaveBeenCalledTimes(1);
  catalog = { ...catalog, error: null };
  view.rerender(<MemoryRouter><GameCatalog /></MemoryRouter>);
  expect(screen.getByText("Nenhum jogo encontrado")).toBeTruthy();
});
