import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AviatorPRO from "./AviatorPRO";
import useAviatorProAnalysis from "hooks/useAviatorProAnalysis";
import useStartGame from "hooks/useStartGame";

jest.mock("hooks/useAviatorProAnalysis", () => jest.fn());
jest.mock("hooks/useStartGame", () => jest.fn());
jest.mock("components/Home/AviatorPlayer", () => ({ title }) => <section aria-label={`Player ${title}`} />);
let analysis, startGame, analyze;
beforeEach(() => {
  jest.clearAllMocks();
  analyze = jest.fn(); startGame = jest.fn();
  analysis = { loading: false, error: null, result: null, analyze };
  useAviatorProAnalysis.mockImplementation(() => analysis);
  useStartGame.mockReturnValue({ startGame, gameUrl: null, loading: false, error: null });
});
const scene = () => <MemoryRouter><AviatorPRO /></MemoryRouter>;

test("mantém amostra fixa, análise manual e navegação para histórico", () => {
  render(scene());
  expect(useAviatorProAnalysis).toHaveBeenCalledWith(1, 100);
  expect(screen.getByText("Amostra de 100 velas")).toBeTruthy();
  expect(screen.getByText("Escolha a versão e clique em Analisar agora.")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Voltar ao histórico" }).getAttribute("href")).toBe("/admin/dashboard");
  expect(analyze).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Analisar agora" }));
  expect(analyze).toHaveBeenCalledTimes(1);
});
test("troca de versão usa o gráfico e o player correspondentes", () => {
  render(scene());
  expect(startGame).toHaveBeenCalledWith({ slug: "spribe/aviator" });
  fireEvent.click(screen.getByRole("button", { name: "VIP" }));
  expect(useAviatorProAnalysis).toHaveBeenLastCalledWith(2, 100);
  expect(startGame).toHaveBeenLastCalledWith({ slug: "spribe/aviator-vip" });
  expect(screen.getByRole("region", { name: "Player Aviator VIP" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Premium", exact: true }));
  expect(useAviatorProAnalysis).toHaveBeenLastCalledWith(3, 100);
  expect(startGame).toHaveBeenLastCalledWith({ slug: "spribe/aviator-premium" });
  expect(screen.getByRole("region", { name: "Player Aviator Premium" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Premium", exact: true }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByText("Compare os intervalos dos últimos resultados de Aviator Premium.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Analisar agora" }));
  expect(analyze).toHaveBeenCalledTimes(1);
});
test("carregamento bloqueia análise duplicada e erro mantém recuperação", () => {
  analysis.loading = true;
  const view = render(scene());
  expect(screen.getByRole("button", { name: "Analisando..." }).disabled).toBe(true);
  expect(screen.getByRole("status", { name: "Analisando horários" }).textContent).toContain("Consultando o histórico");
  analysis = { ...analysis, loading: false, error: "Falha de teste" };
  view.rerender(scene());
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(analyze).toHaveBeenCalledTimes(1);
});
test("cards mostram apenas a ODD e o próximo horário, com estado de dados insuficientes", () => {
  analysis.result = { records: [{}], analyzedAt: "2026-10-12T12:00:00Z", timings: [
    { threshold: 3, next: "09:12:00", nextDate: "12/10/2026", interval: "00:01:30", count: 8 },
    { threshold: 10, next: null, interval: null, count: 1 },
  ] };
  render(scene());
  expect(screen.getByText("09:12:00")).toBeTruthy();
  expect(screen.getByText("ODD > 3x")).toBeTruthy();
  expect(screen.getByText("ODD > 10x")).toBeTruthy();
  expect(screen.getAllByText("Próximo horário estimado")).toHaveLength(2);
  expect(screen.queryByText("00:01:30")).toBeNull();
  expect(screen.queryByText("Intervalo médio")).toBeNull();
  expect(screen.queryByText("Ocorrências")).toBeNull();
  expect(screen.queryByText("12/10/2026 · horário de Brasília")).toBeNull();
  expect(screen.getByText("Dados insuficientes").className).toBe("aviator-pro__insufficient");
  expect(screen.queryByText(/São necessárias pelo menos duas ocorrências/)).toBeNull();
  expect(screen.getByText(/Não prevê o resultado das próximas rodadas/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Atualizar análise" }));
  expect(analyze).toHaveBeenCalledTimes(1);
});
test("amostra vazia oferece atualizar análise", () => {
  analysis.result = { records: [], timings: [] };
  render(scene());
  expect(screen.getByText("Nenhum resultado disponível")).toBeTruthy();
  fireEvent.click(screen.getAllByRole("button", { name: "Atualizar análise" })[1]);
  expect(analyze).toHaveBeenCalledTimes(1);
});

test("botão fica bloqueado até o horário liberado pelo hook e informa Brasília", () => {
  analysis = { ...analysis, canAnalyze: false, unlockAt: Date.parse("2026-10-14T03:00:30Z"), result: { records: [{}], analyzedAt: Date.now(), timings: [] } };
  const view = render(scene());
  const button = screen.getByRole("button", { name: "Atualizar análise" });
  expect(button.disabled).toBe(true);
  expect(screen.getByText("00:00:30")).toBeTruthy();
  expect(button.getAttribute("aria-describedby")).toBe("aviator-pro-unlock");
  fireEvent.click(button); expect(analyze).not.toHaveBeenCalled();
  analysis = { ...analysis, canAnalyze: true }; view.rerender(scene());
  expect(screen.getByRole("button", { name: "Atualizar análise" }).disabled).toBe(false);
  expect(screen.queryByText(/Nova análise disponível/)).toBeNull();
});
