import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import BalanceWithdrawButton from "./BalanceWithdrawButton";

let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); delete global.IS_REACT_ACT_ENVIRONMENT; });
function render(props) {
  act(() => root.render(<MemoryRouter><BalanceWithdrawButton {...props} /></MemoryRouter>));
}

test("saldo ausente ou inválido nunca aparece como NaN nem como zero fictício", () => {
  render({ balance: NaN });
  expect(container.textContent).toContain("Indisponível");
  expect(container.textContent).not.toContain("NaN");
  render({ balance: null });
  expect(container.textContent).toContain("Indisponível");
  render({ balance: 0 });
  expect(container.textContent).toMatch(/R\$\s*0,00/);
});

test("ocultar saldo protege o valor e mantém a ação de depósito", () => {
  render({ balance: 1234.56 });
  expect(container.textContent).toContain("1.234,56");
  act(() => container.querySelector('[aria-label="Ocultar saldo"]').click());
  expect(container.textContent).not.toContain("1.234,56");
  expect(container.textContent).toContain("•••••");
  expect(container.querySelector('a').getAttribute('href')).toBe("/admin/deposit");
});

test("mostra carregamento e oferece depósito por ícone sem atualização manual", () => {
  render({ balance: null, loading: true });
  expect(container.querySelector('[aria-label="Atualizar saldo"]')).toBeNull();
  expect(container.textContent).toContain("Carregando...");
  expect(container.querySelector('[aria-label="Depositar"]').getAttribute('href')).toBe("/admin/deposit");
  render({ balance: 20, loading: false });
  expect(container.textContent).toMatch(/R\$\s*20,00/);
});
