import React from "react";
import { createRoot } from "react-dom/client";
import { act, Simulate } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import Withdraw from "./Withdraw";
import { requestWithdraw } from "../services/withdrawApi";
import { testEmail } from "../testSupport/fixtures";
jest.mock("../services/withdrawApi", () => ({ requestWithdraw: jest.fn(), PIX_KEY_TYPES: ["CPF", "EMAIL", "PHONE", "CNPJ", "RANDOM"] }));
jest.mock("sweetalert2", () => ({ fire: jest.fn() }));
let root, host;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear(); requestWithdraw.mockReset();
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  act(() => root.render(<MemoryRouter><Withdraw /></MemoryRouter>));
});
afterEach(() => { act(() => root.unmount()); host.remove(); delete global.IS_REACT_ACT_ENVIRONMENT; });
const input = (selector, value) => act(() => Simulate.change(host.querySelector(selector), { target: { value } }));
const submit = () => act(async () => Simulate.submit(host.querySelector("form")));

test("valor inválido não envia saque", async () => {
  input("#withdraw-amount", "-1"); await submit();
  expect(requestWithdraw).not.toHaveBeenCalled();
  expect(host.querySelector('[role="alert"]').textContent).toContain("saque mínimo");
});

test("bloqueia saques duplicados e confirma solicitação sem repetir automaticamente", async () => {
  let resolve;
  requestWithdraw.mockImplementation(() => new Promise(done => { resolve = done; }));
  input("#withdraw-amount", "30,50");
  act(() => { Simulate.submit(host.querySelector("form")); Simulate.submit(host.querySelector("form")); });
  expect(requestWithdraw).toHaveBeenCalledTimes(1);
  expect(requestWithdraw).toHaveBeenCalledWith(30.5, { type: "CPF" }, expect.any(AbortSignal));
  await act(async () => resolve({}));
  expect(host.querySelector('[role="status"]').textContent).toContain("Solicitação de saque enviada");
  expect(host.querySelector("form")).toBeNull();
});

test("chave Pix fica em memória e a mensagem do BFF aparece após falha", async () => {
  requestWithdraw.mockRejectedValue({ apiError: { code: "VALIDATION_ERROR", message: "Confira a chave Pix." } });
  input("#withdraw-amount", "30"); input("#withdraw-pix-type", "EMAIL"); input("#withdraw-pix-key", testEmail);
  await submit();
  expect(requestWithdraw).toHaveBeenCalledWith(30, { type: "EMAIL", key: testEmail }, expect.any(AbortSignal));
  expect(host.querySelector('[role="alert"]').textContent).toBe("Confira a chave Pix.");
  expect(localStorage.length).toBe(0);
  expect(requestWithdraw).toHaveBeenCalledTimes(1);
});


test.each(["0", "5", "29,99", "abc"])("bloqueia %s antes de enviar e foca o valor", async value => {
  input("#withdraw-amount", value); await submit();
  expect(requestWithdraw).not.toHaveBeenCalled();
  expect(host.querySelector('[role="alert"]').textContent).toContain("R$ 30,00");
  expect(document.activeElement.id).toBe("withdraw-amount");
});

test("mostra o mínimo e aceita exatamente R$ 30", async () => {
  expect(host.querySelector('#withdraw-amount-message').textContent).toBe("Saque mínimo: R$ 30,00.");
  requestWithdraw.mockResolvedValue({});
  input("#withdraw-amount", "30,00"); await submit();
  expect(requestWithdraw).toHaveBeenCalledWith(30, { type: "CPF" }, expect.any(AbortSignal));
});
