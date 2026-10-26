import React from "react";
import { act, fireEvent, render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Register from "./Register";
import bffApi from "../services/bffApi";
import { testCpf, testEmail, testPassword, testPhone } from "../testSupport/fixtures";
import { TURNSTILE_SCRIPT_URL } from "../services/turnstile";
jest.mock("../services/bffApi", () => ({ post: jest.fn() }));
jest.mock("../hooks/useTrackingParams", () => jest.fn());
let widgets;
const ok = data => ({ data: { success: true, data } });
const fill = () => {
  [["E-mail", testEmail], ["Celular", testPhone], ["CPF", testCpf], ["Senha", testPassword], ["Confirmar senha", testPassword]].forEach(([label, value]) => fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } }));
};
const submit = () => fireEvent.submit(screen.getByLabelText("E-mail").closest("form"));
const solve = async index => act(async () => widgets[index].callback(`fixture-token-${index}`));
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks(); localStorage.clear();
  process.env.REACT_APP_TURNSTILE_SITE_KEY = "fixture-public-sitekey";
  document.querySelectorAll(`script[src="${TURNSTILE_SCRIPT_URL}"]`).forEach(script => script.remove());
  widgets = [];
  window.turnstile = { render: jest.fn((element, options) => { widgets.push(options); return String(widgets.length); }), remove: jest.fn() };
});
afterEach(() => {
  cleanup(); expect(jest.getTimerCount()).toBe(0);
  delete window.turnstile; delete process.env.REACT_APP_TURNSTILE_SITE_KEY; jest.useRealTimers();
});
const mount = () => render(<MemoryRouter><Register /></MemoryRouter>);

test("aguarda callback, usa actions e tokens separados e não duplica consultas por blur", async () => {
  mount(); fill();
  bffApi.post.mockResolvedValue(ok({ nameMasked: "Pessoa ***", cpfMasked: "***", birthDateMasked: "***" }));
  const input = screen.getByLabelText("CPF");
  fireEvent.blur(input); fireEvent.blur(input);
  expect(widgets).toHaveLength(1); expect(widgets[0].action).toBe("cpf_lookup");
  expect(screen.getAllByText("Verificando segurança…").length).toBeGreaterThan(0);
  expect(bffApi.post).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Verificando segurança…" }).disabled).toBe(true);
  await solve(0);
  expect(bffApi.post).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Pessoa ***")).toBeTruthy();
  fireEvent.blur(input); expect(widgets).toHaveLength(1);
  bffApi.post.mockResolvedValue({ data: { success: false, error: { code: "USER_ALREADY_EXISTS" } } });
  submit(); submit();
  expect(widgets).toHaveLength(2); expect(widgets[1].action).toBe("register");
  expect(bffApi.post).toHaveBeenCalledTimes(1);
  await solve(1);
  expect(bffApi.post.mock.calls.map(([, body]) => body.captcha_token)).toEqual(["fixture-token-0", "fixture-token-1"]);
  expect(bffApi.post.mock.calls[1][1]).toMatchObject({ cpf: testCpf, email: testEmail, password: testPassword, phone: testPhone, countryCode: "BR", axioAffId: "NLNYO" });
  expect(screen.getByLabelText("E-mail").value).toBe(testEmail);
  expect(screen.getByLabelText("Senha", { exact: true }).value).toBe(testPassword);
  expect(localStorage.getItem("captcha_token")).toBeNull();
  expect(document.querySelectorAll(`script[src="${TURNSTILE_SCRIPT_URL}"]`)).toHaveLength(1);
});

test("repetição de cadastro só gera dois POSTs e nova tentativa manual mantém campos", async () => {
  mount(); fill();
  bffApi.post.mockResolvedValue({ data: { success: false, error: { code: "BOT_CHECK_FAILED" } } });
  submit(); await solve(0);
  expect(widgets).toHaveLength(2); expect(widgets[1].action).toBe("register");
  await solve(1);
  expect(bffApi.post).toHaveBeenCalledTimes(2); expect(widgets).toHaveLength(2);
  expect(screen.getByRole("alert").textContent).toContain("verificação de segurança");
  expect(screen.getByRole("button", { name: "Criar conta" }).disabled).toBe(false);
  expect(screen.getByLabelText("CPF").value.replace(/\D/g, "")).toBe(testCpf);
  submit(); expect(widgets).toHaveLength(3);
});

test("alterar CPF ou desmontar cancela widget e não envia resultado/token antigo", async () => {
  const view = mount(); fill();
  const input = screen.getByLabelText("CPF");
  fireEvent.blur(input);
  fireEvent.change(input, { target: { value: "" } });
  await solve(0);
  expect(bffApi.post).not.toHaveBeenCalled();
  expect(document.getElementById("register-cpf-result")).toBeNull();
  fireEvent.change(input, { target: { value: testCpf } });
  fireEvent.blur(input);
  view.unmount(); await solve(1);
  expect(bffApi.post).not.toHaveBeenCalled();
  expect(window.turnstile.remove).toHaveBeenCalledTimes(2);
});

test("domínio não autorizado não valida CPF e permite tentar de novo manualmente", async () => {
  mount(); fill(); fireEvent.blur(screen.getByLabelText("CPF"));
  await act(async () => widgets[0]["error-callback"]("110200"));
  expect(bffApi.post).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toContain("liberar este domínio");
  expect(document.getElementById("register-cpf-result")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar validar CPF" }));
  expect(widgets).toHaveLength(2); expect(widgets[1].action).toBe("cpf_lookup");
});
