import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import DepositRanking, { formatRankingMonth } from "./DepositRanking";
import useDepositRanking from "../hooks/useDepositRanking";
jest.mock("../hooks/useDepositRanking", () => jest.fn());
let root, container;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement("div"); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); delete global.IS_REACT_ACT_ENVIRONMENT; });
const render = props => { useDepositRanking.mockReturnValue({ players: [], month: "2026-10", loading: false, error: null, ...props }); act(() => root.render(<MemoryRouter><DepositRanking /></MemoryRouter>)); };
test("mês, moeda, medalhas e três colunas respeitam contrato público", () => {
  expect(formatRankingMonth("2026-10")).toBe("Outubro de 2026");
  render({ players: [{ rank: 1, name: "Ana", total: 11300 }, { rank: 2, name: "Lavinia", total: 6919.5 }, { rank: 3, name: "João", total: 900 }, { rank: 4, name: "Pedro", total: 500 }] });
  expect([...container.querySelectorAll("th")].map(e => e.textContent)).toEqual(["Rank", "Player", "Valor"]);
  expect(container.textContent).toContain("11.300,00"); expect(container.textContent).toContain("6.919,50");
  expect(container.querySelectorAll(".deposit-ranking__medal")).toHaveLength(3);
  expect(container.textContent).toContain("4º");
});
test("vazio, skeleton e tentativa após erro", () => {
  render({}); expect(container.textContent).toContain("Ainda não há depósitos neste mês. Seja o primeiro!");
  render({ loading: true }); expect(container.querySelectorAll(".deposit-ranking__skeleton")).toHaveLength(10);
  const retry = jest.fn(); render({ error: "Falha de rede", refetch: retry });
  act(() => container.querySelector("button").click()); expect(retry).toHaveBeenCalledTimes(1);
});
