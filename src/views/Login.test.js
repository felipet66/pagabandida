import { testEmail, testPassword, testSession } from "../testSupport/fixtures";

import React from "react";
import { createRoot } from "react-dom/client";
import { act, Simulate } from "react-dom/test-utils";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import Login from "./Login";
import bffApi from "../services/bffApi";

jest.mock("../services/bffApi", () => ({ post: jest.fn() }));
jest.mock("../hooks/useTrackingParams", () => jest.fn());

let root, host, history;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  bffApi.post.mockReset();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  history = createMemoryHistory({ initialEntries: ["/auth/login"] });
  act(() => root.render(<Router history={history}><Login /></Router>));
  act(() => {
    Simulate.change(host.querySelector('[name="email"]'), { target: { value: testEmail } });
    Simulate.change(host.querySelector('[name="password"]'), { target: { value: testPassword } });
  });
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
const submit = () => act(async () => Simulate.submit(host.querySelector("form")));

test("login bem-sucedido mantém a navegação no router e abre o catálogo autenticado", async () => {
  bffApi.post.mockResolvedValue({ data: { success: true, data: {
    access_token: testSession, cookie_key: "fixture", expires_in: 3600,
    user: { id: 42, name: "Fixture", email: testEmail, token: testSession },
  } } });
  await submit();
  expect(localStorage.getItem("access_token")).toBe(testSession);
  expect(history.location.pathname).toBe("/admin/jogos");
  expect(history.action).toBe("PUSH");
});

test("401 de credenciais permanece no formulário e usa chamada pública", async () => {
  bffApi.post.mockRejectedValue({ response: { status: 401, data: {} } });
  await submit();
  expect(bffApi.post).toHaveBeenCalledWith("api/auth/login", { email: testEmail, password: testPassword }, { publicRequest: true });
  expect(host.querySelector('[role="alert"]').textContent).toContain("E-mail ou senha inválidos");
  expect(host.querySelector('[name="email"]').value).toBe(testEmail);
  expect(host.querySelector('[type="submit"]').disabled).toBe(false);
  expect(localStorage.getItem("access_token")).toBeNull();
  await submit();
  expect(bffApi.post).toHaveBeenCalledTimes(2);
});

test("exibe a mensagem de credenciais retornada pelo BFF", async () => {
  bffApi.post.mockRejectedValue({ response: { status: 401, data: { error: { message: "Login ou senha incorretos." } } } });
  await submit();
  expect(host.querySelector('[role="alert"]').textContent).toBe("Login ou senha incorretos.");
});

test("resposta success false não grava sessão e libera nova tentativa", async () => {
  bffApi.post.mockResolvedValue({ data: { success: false, error: { message: "Credenciais inválidas." } } });
  await submit();
  expect(host.querySelector('[role="alert"]').textContent).toBe("Credenciais inválidas.");
  expect(host.querySelector('[type="submit"]').disabled).toBe(false);
  expect(localStorage.getItem("user_id")).toBeNull();
});

test("mostrar senha mantém o valor e não envia o formulário", () => {
  const input = host.querySelector('[name="password"]');
  const toggle = host.querySelector('[aria-controls="login-password"]');
  act(() => Simulate.click(toggle));
  expect(input.type).toBe("text");
  expect(input.value).toBe(testPassword);
  expect(toggle.getAttribute("aria-label")).toBe("Ocultar senha");
  expect(toggle.getAttribute("aria-pressed")).toBe("true");
  expect(bffApi.post).not.toHaveBeenCalled();
  act(() => Simulate.click(toggle));
  expect(input.type).toBe("password");
});

test("anuncia carregamento, bloqueia os controles e impede envio duplicado", async () => {
  let finishRequest;
  bffApi.post.mockReturnValue(new Promise((resolve, reject) => { finishRequest = reject; }));
  act(() => Simulate.submit(host.querySelector("form")));
  expect(host.querySelector("form").getAttribute("aria-busy")).toBe("true");
  expect(host.querySelector("fieldset").disabled).toBe(true);
  expect(host.querySelector('[aria-controls="login-password"]').disabled).toBe(true);
  expect(host.querySelector('[type="submit"]').textContent).toBe("Entrando...");
  expect(host.querySelector('[role="status"]').textContent).toContain("Verificando seu acesso");
  act(() => Simulate.submit(host.querySelector("form")));
  expect(bffApi.post).toHaveBeenCalledTimes(1);
  await act(async () => finishRequest({ response: { status: 401, data: {} } }));
  expect(host.querySelector("fieldset").disabled).toBe(false);
  expect(host.querySelector('[role="status"]').textContent).toBe("");
  expect(host.querySelector('[role="alert"]').textContent).toContain("E-mail ou senha inválidos");
});
