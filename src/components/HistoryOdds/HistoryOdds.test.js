import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import HistoryOdds from "./HistoryOdds";

let root, host;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); delete global.IS_REACT_ACT_ENVIRONMENT; });
const render = props => act(() => root.render(<HistoryOdds numberVelas={10} {...props} />));

test.each([
  ["Azul · ODD < 2", "blue"],
  ["Roxo · 2 ≤ ODD < 10", "purple"],
  ["Rosa · ODD ≥ 10", "pink"],
  ["ODD > 20", 20],
  ["Todas as odds", undefined],
])("selecionar %s comunica o filtro correto ao histórico", (label, value) => {
  const onOddFilterChange = jest.fn();
  render({ onOddFilterChange });
  act(() => host.querySelector('#history-odd-filter').click());
  act(() => [...host.querySelectorAll('[role="option"]')].find(option => option.textContent === label).click());
  expect(onOddFilterChange).toHaveBeenCalledWith(value);
});

test.each([
  ["blue", "azuis (abaixo de 2x)"],
  ["purple", "roxas (de 2x até abaixo de 10x)"],
  ["pink", "rosas (10x ou mais)"],
])("filtro %s vazio informa a faixa correta e permite limpar", (filter, description) => {
  const onOddFilterChange = jest.fn();
  render({ candleGreaterThan: filter, onOddFilterChange });
  expect(host.textContent).toContain(description);
  expect(host.querySelector('#history-pattern').disabled).toBe(true);
  act(() => host.querySelector('.app-empty-state button').click());
  expect(onOddFilterChange).toHaveBeenCalledWith(undefined);
});

test.each([50, 200, 500, 1000])("controles continuam disponíveis durante a busca e comunicam %s velas para o pai", quantity => {
  const onQuantityChange = jest.fn();
  render({ loading: true, onQuantityChange });
  expect(host.textContent).toContain("Carregando resultados...");
  const select = host.querySelector('#history-candle-quantity');
  expect(select.disabled).toBe(false);
  act(() => select.click());
  act(() => [...host.querySelectorAll('[role="option"]')].find(option => option.textContent === String(quantity)).click());
  expect(onQuantityChange).toHaveBeenCalledWith(quantity);
});

test("filtro não calcula padrões com lacunas e permite recuperar histórico vazio", () => {
  const onOddFilterChange = jest.fn();
  render({ candleGreaterThan: 10, records: [], onOddFilterChange });
  expect(host.querySelector('#history-pattern').disabled).toBe(true);
  expect(host.textContent).toContain("Nenhuma vela encontrada");
  expect(host.querySelector('.aviator-statistics')).toBeNull();
  act(() => host.querySelector('.app-empty-state button').click());
  expect(onOddFilterChange).toHaveBeenCalledWith(undefined);
});

test("velas são selecionáveis por botão e estatísticas acompanham a amostra", () => {
  render({ records: [{ id: 'round-test', odd: '2.5', hour: '19:45:00', dataTime: '2026-10-10T22:45:00Z' }] });
  const candle = host.querySelector('.aviator-candle');
  expect(candle.getAttribute('aria-label')).toContain('2.50x às 19:45:00');
  act(() => candle.click());
  expect(candle.getAttribute('aria-pressed')).toBe('true');
  expect(host.querySelector('.aviator-statistics').textContent).toContain('2.50x');
});

test("padrões e seleção têm indicadores e permanecem independentes", () => {
  render({ records: [
    { id: "a", odd: "10.00", hour: "19:45:00" },
    { id: "b", odd: "20.00", hour: "19:44:00" },
    { id: "c", odd: "1.10", hour: "19:43:00" },
  ] });
  act(() => host.querySelector("#history-pattern").click());
  act(() => [...host.querySelectorAll('[role="option"]')].find(option => option.textContent === "Espelhamento de rosas").click());
  expect(host.querySelectorAll(".aviator-candle.is-pattern")).toHaveLength(2);
  const candle = host.querySelector(".aviator-candle.is-pattern");
  expect(candle.getAttribute("aria-label")).toContain("padrão destacado");
  expect(candle.querySelectorAll(".aviator-candle-marker svg")).toHaveLength(1);
  act(() => candle.click());
  expect(candle.getAttribute("aria-pressed")).toBe("true");
  expect(candle.querySelectorAll(".aviator-candle-marker svg")).toHaveLength(2);
  act(() => candle.click());
  expect(candle.getAttribute("aria-pressed")).toBe("false");
  expect(candle.classList.contains("is-pattern")).toBe(true);
});

test("toggle mostra a rodada real de cada vela e a oculta sem perder seleção nem acionar buscas", () => {
  const onRefresh = jest.fn(), onQuantityChange = jest.fn(), onOddFilterChange = jest.fn();
  render({ onRefresh, onQuantityChange, onOddFilterChange, records: [
    { id: "storage-row", roundId: "90817", odd: "2.46", hour: "19:45:00" },
    { id: "another-row", roundId: "90816", odd: "1.13", hour: "19:44:00" },
  ] });
  const toggle = host.querySelector('[role="switch"]');
  const candle = host.querySelector('.aviator-candle');
  expect(toggle.textContent).toContain("Exibir rodadas");
  expect(toggle.getAttribute("aria-checked")).toBe("false");
  act(() => toggle.click());
  expect(toggle.getAttribute("aria-checked")).toBe("true");
  expect([...host.querySelectorAll('.aviator-candle .aviator-candle-round')].map(node => node.textContent)).toEqual(["90817", "90816"]);
  expect(candle.getAttribute("aria-label")).toContain("rodada 90817");
  act(() => candle.click());
  act(() => toggle.click());
  expect(toggle.getAttribute("aria-checked")).toBe("false");
  expect(host.querySelector('.aviator-candle-round')).toBeNull();
  expect(candle.getAttribute("aria-label")).not.toContain("rodada");
  expect(candle.getAttribute("aria-pressed")).toBe("true");
  act(() => toggle.click());
  expect(host.querySelector('.aviator-candle-round').textContent).toBe("90817");
  expect(onRefresh).not.toHaveBeenCalled();
  expect(onQuantityChange).not.toHaveBeenCalled();
  expect(onOddFilterChange).not.toHaveBeenCalled();
});

test("rodada zero é válida e dado ausente não inventa número sequencial", () => {
  render({ records: [
    { id: "zero", roundId: 0, odd: "2.5", hour: "19:45:00" },
    { odd: "1.2", hour: "19:44:00" },
  ] });
  act(() => host.querySelector('[role="switch"]').click());
  expect([...host.querySelectorAll('.aviator-candle-round')].map(node => node.textContent)).toEqual(["0", "—"]);
});

test("botão automático informa estado, permite desligar durante consulta e mantém velas e estatísticas", () => {
  const onAutoRefreshChange = jest.fn();
  render({ autoRefresh: true, onAutoRefreshChange, refreshing: true, lastUpdated: new Date("2026-10-16T15:30:00Z"),
    refreshError: "Os últimos dados foram mantidos.", records: [{ id: "a", odd: "2.5", hour: "12:30:00" }] });
  const button = host.querySelector('.aviator-auto-refresh');
  expect(button.getAttribute("aria-pressed")).toBe("true");
  expect(button.textContent).toContain("Desativar atualização automática");
  expect(button.disabled).toBe(false);
  act(() => button.click());
  expect(onAutoRefreshChange).toHaveBeenCalledWith(false);
  expect(host.textContent).toContain("a cada 30s");
  expect(host.textContent).toContain("12:30:00");
  expect(host.textContent).toContain("Os últimos dados foram mantidos.");
  expect(host.querySelector('.aviator-candle')).toBeTruthy();
  expect(host.querySelector('.aviator-statistics')).toBeTruthy();
  expect(host.querySelector('.aviator-loading-state')).toBeNull();
});
