import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Switch, useLocation } from "react-router-dom";
import Register from "./Register";
import useTurnstile from "../hooks/useTurnstile";
import { registerAccount, validateRegistrationDocument, saveRegistrationSession } from "../services/registration";
import { testCpf, testEmail, testPassword, testPhone } from "../testSupport/fixtures";

jest.mock("../hooks/useTurnstile", () => jest.fn());
jest.mock("../hooks/useTrackingParams", () => jest.fn());
jest.mock("../services/registration", () => ({
  ...jest.requireActual("../services/registration"),
  registerAccount: jest.fn(), validateRegistrationDocument: jest.fn(), saveRegistrationSession: jest.fn(),
}));

function LoginDestination() {
  const { state } = useLocation();
  return <input aria-label="E-mail do login" value={state?.email || ""} readOnly />;
}

beforeEach(() => {
  jest.resetAllMocks();
  useTurnstile.mockReturnValue({ getToken: jest.fn(), checking: false, containerRef: { current: null } });
  render(<MemoryRouter initialEntries={["/auth/register"]}>
    <Switch>
      <Route path="/auth/register"><Register /></Route>
      <Route path="/auth/login"><LoginDestination /></Route>
      <Route path="/admin/dashboard"><p>Painel de teste</p></Route>
    </Switch>
  </MemoryRouter>);
});

function fillFields() {
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: testEmail } });
  fireEvent.change(screen.getByLabelText("Celular"), { target: { value: testPhone } });
  fireEvent.change(screen.getByLabelText("CPF"), { target: { value: testCpf } });
  fireEvent.change(screen.getByLabelText("Senha", { exact: true }), { target: { value: testPassword } });
  fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: testPassword } });
}

const form = () => screen.getByRole("button", { name: "Criar conta" }).closest("form");

test("senhas divergentes mostram erro associado ao campo sem enviar cadastro", () => {
  fillFields();
  fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "" } });
  fireEvent.submit(form());
  expect(screen.getByRole("alert").textContent).toContain("As senhas não conferem.");
  const confirmation = screen.getByLabelText("Confirmar senha");
  expect(confirmation.getAttribute("aria-invalid")).toBe("true");
  expect(confirmation.getAttribute("aria-describedby")).toBe("register-confirm-password-message");
  expect(registerAccount).not.toHaveBeenCalled();
});

test("cada botão de mostrar senha controla seu campo sem enviar o formulário", () => {
  fillFields();
  const toggles = screen.getAllByRole("button", { name: "Mostrar senha" });
  fireEvent.click(toggles[1]);
  expect(screen.getByLabelText("Confirmar senha").type).toBe("text");
  expect(screen.getByLabelText("Senha", { exact: true }).type).toBe("password");
  expect(screen.getByLabelText("Confirmar senha").value).toBe(testPassword);
  expect(registerAccount).not.toHaveBeenCalled();
});

test("bloqueia envio duplicado e permite ir ao login com e-mail após conta existente", async () => {
  fillFields();
  let rejectRequest;
  registerAccount.mockReturnValue(new Promise((resolve, reject) => { rejectRequest = reject; }));
  const registrationForm = form();
  fireEvent.submit(registrationForm);
  expect(registrationForm.getAttribute("aria-busy")).toBe("true");
  expect(registrationForm.querySelector("fieldset").disabled).toBe(true);
  expect(screen.getByRole("button", { name: "Criando conta..." }).disabled).toBe(true);
  expect(screen.getByRole("status").textContent).toContain("Criando sua conta");
  fireEvent.submit(registrationForm);
  expect(registerAccount).toHaveBeenCalledTimes(1);
  await act(async () => rejectRequest({ apiError: { code: "USER_ALREADY_EXISTS" } }));
  expect(screen.getByRole("alert").textContent).toContain("Esta conta já existe");
  expect(screen.getByRole("button", { name: "Criar conta" }).disabled).toBe(false);
  expect(saveRegistrationSession).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("link", { name: "Fazer login" }));
  expect(screen.getByLabelText("E-mail do login").value).toBe(testEmail);
});

test("cancelamento da consulta de CPF impede resultado antigo de aparecer", async () => {
  let resolveDocument;
  validateRegistrationDocument.mockReturnValue(new Promise(resolve => { resolveDocument = resolve; }));
  const cpfInput = screen.getByLabelText("CPF");
  fireEvent.change(cpfInput, { target: { value: testCpf } });
  fireEvent.blur(cpfInput);
  const signal = validateRegistrationDocument.mock.calls[0][1].signal;
  expect(validateRegistrationDocument).toHaveBeenCalledWith(testCpf, { signal, getToken: expect.any(Function) });
  expect(screen.getAllByRole("status").some(item => item.textContent === "Conferindo CPF...")).toBe(true);
  fireEvent.change(cpfInput, { target: { value: "" } });
  expect(signal.aborted).toBe(true);
  await act(async () => resolveDocument({ nameMasked: "***", cpfMasked: "***", birthDateMasked: "***" }));
  expect(document.getElementById("register-cpf-result")).toBeNull();
});

test("cadastro concluído salva sessão e segue para o painel", async () => {
  fillFields();
  const session = { user: { id: "fixture" } };
  registerAccount.mockResolvedValue(session);
  await act(async () => fireEvent.submit(form()));
  expect(saveRegistrationSession).toHaveBeenCalledWith(session);
  expect(screen.getByText("Painel de teste")).toBeTruthy();
});

test("consulta de CPF mantém o resultado mascarado associado ao campo", async () => {
  validateRegistrationDocument.mockResolvedValue({ nameMasked: "***", cpfMasked: "***", birthDateMasked: "***" });
  const input = screen.getByLabelText("CPF");
  fireEvent.change(input, { target: { value: testCpf } });
  await act(async () => fireEvent.blur(input));
  const result = document.getElementById("register-cpf-result");
  expect(result.textContent).toContain("CPF: ***");
  expect(result.textContent).toContain("Nascimento: ***");
  expect(input.getAttribute("aria-describedby")).toContain("register-cpf-result");
});

test("CPF inválido mantém mensagem e estado acessível de erro", async () => {
  validateRegistrationDocument.mockRejectedValue({ apiError: { code: "INVALID_DOCUMENT" } });
  const input = screen.getByLabelText("CPF");
  fireEvent.change(input, { target: { value: testCpf } });
  await act(async () => fireEvent.blur(input));
  expect(screen.getByRole("alert").textContent).toBe("CPF inválido. Confira os números.");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(input.closest(".auth-field").classList.contains("auth-field--invalid")).toBe(true);
});
