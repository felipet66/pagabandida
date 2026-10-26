import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import InvestmentTable from "./InvestmentTable";
import Swal from "sweetalert2";
import { trackGamification } from "../../services/gamificationApi";
jest.mock("../../services/gamificationApi", () => ({ trackGamification: jest.fn().mockResolvedValue(null) }));

jest.mock("sweetalert2", () => ({ fire: jest.fn() }));
const money = value => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const getAmount = value => screen.getByText((_, node) => node.tagName === "STRONG" && node.textContent === money(value));
beforeEach(() => { jest.clearAllMocks(); render(<InvestmentTable />); });

test("mantém a divisão 80/20 das entradas e os percentuais dos perfis", () => {
  expect(screen.getByRole("button", { name: /Conservador/ }).getAttribute("aria-pressed")).toBe("true");
  expect(getAmount(8)).toBeTruthy();
  expect(getAmount(2)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Valor da banca"), { target: { value: "2000" } });
  fireEvent.click(screen.getByRole("button", { name: /Moderado/ }));
  expect(screen.getByRole("button", { name: /Moderado/ }).getAttribute("aria-pressed")).toBe("true");
  expect(getAmount(32)).toBeTruthy();
  expect(getAmount(8)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Agressivo/ }));
  expect(getAmount(48)).toBeTruthy();
  expect(getAmount(12)).toBeTruthy();
});

test.each([
  ["Conservador", 50, 100, 1050, 4321.94],
  ["Moderado", 100, 200, 1100, 17449.40],
  ["Agressivo", 150, 300, 1150, 66211.77],
])("preserva o plano de 30 dias do perfil %s", (profile, goal, stop, firstFinal, final) => {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(profile) }));
  fireEvent.click(screen.getByRole("button", { name: "Calcular plano" }));
  const rows = document.querySelectorAll(".bankroll-table tbody tr");
  expect(rows).toHaveLength(30);
  const first = rows[0].querySelectorAll("td");
  expect(first[1].textContent).toBe(money(1000));
  expect(first[2].textContent).toBe(money(goal));
  expect(first[3].textContent).toBe(money(stop));
  expect(first[4].textContent).toBe(money(firstFinal));
  expect(rows[29].querySelectorAll("td")[4].textContent).toBe(money(final));
  expect(screen.getByText("Saldo projetado").parentElement.querySelector("strong").textContent).toBe(money(final));
  expect(screen.getByText(/Os valores são projeções, sem garantia de resultado/)).toBeTruthy();
});

test("banca inválida mantém aviso e não gera tabela", () => {
  fireEvent.change(screen.getByLabelText("Valor da banca"), { target: { value: "0" } });
  fireEvent.click(screen.getByRole("button", { name: "Calcular plano" }));
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: "Informe uma banca válida", icon: "warning" }));
  expect(document.querySelector(".bankroll-table")).toBeNull();
  expect(trackGamification).not.toHaveBeenCalled();
});

test("primeiro plano válido chama track uma vez, e falha silenciosa não altera a simulação", () => {
  fireEvent.click(screen.getByRole("button", { name: "Calcular plano" }));
  fireEvent.click(screen.getByRole("button", { name: "Calcular plano" }));
  expect(trackGamification).toHaveBeenCalledTimes(1);
  expect(trackGamification).toHaveBeenCalledWith("bankroll_configured");
  expect(document.querySelectorAll(".bankroll-table tbody tr")).toHaveLength(30);
});

test("detalhes exibem as mesmas 30 linhas e valores do plano", () => {
  fireEvent.click(screen.getByRole("button", { name: "Calcular plano" }));
  fireEvent.click(screen.getByRole("button", { name: "Ver detalhes" }));
  const popup = Swal.fire.mock.calls[0][0];
  const preview = document.createElement("div");
  preview.innerHTML = popup.html;
  expect(preview.querySelectorAll("tbody tr")).toHaveLength(30);
  const popupRows = preview.querySelectorAll("tbody tr");
  const pageRows = document.querySelectorAll(".bankroll-table tbody tr");
  expect(popupRows[0].querySelectorAll("td")[4].textContent).toBe(pageRows[0].querySelectorAll("td")[4].textContent);
  expect(popupRows[29].querySelectorAll("td")[4].textContent).toBe(pageRows[29].querySelectorAll("td")[4].textContent);
  expect(popup.customClass.popup).toContain("bankroll-popup--details");
  expect(preview.querySelector('[role="region"]').getAttribute("tabindex")).toBe("0");
});
