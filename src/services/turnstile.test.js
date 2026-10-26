import { getTurnstileToken, TURNSTILE_SCRIPT_URL, TURNSTILE_TIMEOUT_MS } from "./turnstile";
let container, options;
const request = (overrides = {}) => getTurnstileToken({ container, action: "cpf_lookup", sitekey: "fixture-public-key", ...overrides });
const tick = () => jest.advanceTimersByTime(50);
beforeEach(() => {
  jest.useFakeTimers();
  document.querySelectorAll(`script[src="${TURNSTILE_SCRIPT_URL}"]`).forEach(script => script.remove());
  container = document.createElement("div"); document.body.appendChild(container);
  options = [];
  window.turnstile = {
    render: jest.fn((element, config) => { options.push(config); return String(options.length); }),
    remove: jest.fn(),
  };
});
afterEach(() => {
  expect(jest.getTimerCount()).toBe(0);
  container.remove(); delete window.turnstile;
  jest.useRealTimers();
});

test("script único, espera API disponível e entrega somente tokens do callback", async () => {
  const api = window.turnstile; delete window.turnstile;
  let resolved = false;
  const first = request().then(token => { resolved = true; return token; });
  const other = document.createElement("div"); container.appendChild(other);
  const second = request({ container: other, action: "register" });
  expect(document.querySelectorAll(`script[src="${TURNSTILE_SCRIPT_URL}"]`)).toHaveLength(1);
  expect(resolved).toBe(false);
  window.turnstile = api; tick();
  expect(options.map(option => option.action)).toEqual(["cpf_lookup", "register"]);
  expect(options[0]).toMatchObject({ appearance: "interaction-only", retry: "auto", "response-field": false });
  options[0].callback("fixture-cpf-token"); options[1].callback("fixture-register-token");
  expect(await first).toBe("fixture-cpf-token"); expect(await second).toBe("fixture-register-token");
  expect(api.remove.mock.calls).toEqual([["1"], ["2"]]);
});

test.each([
  ["expired-callback", undefined, "TURNSTILE_EXPIRED"],
  ["timeout-callback", undefined, "TURNSTILE_TIMEOUT"],
  ["error-callback", "110200", "TURNSTILE_DOMAIN_UNAUTHORIZED"],
  ["error-callback", "110100", "TURNSTILE_SITEKEY_INVALID"],
  ["error-callback", "300001", "TURNSTILE_FAILED"],
  ["callback", "", "TURNSTILE_FAILED"],
])("%s falha sem token, remove widget e timers", async (callback, input, code) => {
  const promise = request();
  options[0][callback](input);
  await expect(promise).rejects.toMatchObject({ code, securityError: true });
  expect(window.turnstile.remove).toHaveBeenCalledWith("1");
});

test("tempo máximo de 120 segundos inclui carregamento da API", async () => {
  delete window.turnstile;
  const promise = request();
  jest.advanceTimersByTime(TURNSTILE_TIMEOUT_MS);
  await expect(promise).rejects.toMatchObject({ code: "TURNSTILE_TIMEOUT" });
});

test("timeout também remove widget renderizado", async () => {
  const promise = request();
  jest.advanceTimersByTime(TURNSTILE_TIMEOUT_MS);
  await expect(promise).rejects.toMatchObject({ code: "TURNSTILE_TIMEOUT" });
  expect(window.turnstile.remove).toHaveBeenCalledTimes(1);
});

test.each([true, false])("abort cancela durante espera ou widget (API disponível: %s)", async available => {
  const api = window.turnstile;
  if (!available) delete window.turnstile;
  const controller = new AbortController();
  const promise = request({ signal: controller.signal });
  controller.abort();
  await expect(promise).rejects.toMatchObject({ name: "AbortError" });
  expect(api.remove).toHaveBeenCalledTimes(available ? 1 : 0);
});

test("erro de download permite nova tentativa manual sem scripts duplicados", async () => {
  delete window.turnstile;
  const promise = request();
  document.getElementById("pagabandida-turnstile").dispatchEvent(new Event("error"));
  await expect(promise).rejects.toMatchObject({ code: "TURNSTILE_SCRIPT_FAILED" });
  const controller = new AbortController();
  const retry = request({ signal: controller.signal });
  expect(document.querySelectorAll(`script[src="${TURNSTILE_SCRIPT_URL}"]`)).toHaveLength(1);
  controller.abort(); await expect(retry).rejects.toMatchObject({ name: "AbortError" });
});

test("configuração ausente e API que lança erro encerram com falha", async () => {
  await expect(request({ sitekey: "" })).rejects.toMatchObject({ code: "TURNSTILE_NOT_CONFIGURED" });
  window.turnstile.render.mockImplementation(() => { throw new Error("fixture"); });
  await expect(request()).rejects.toMatchObject({ code: "TURNSTILE_FAILED" });
});

test("callback síncrono e callbacks tardios não duplicam limpeza nem retornam outro token", async () => {
  window.turnstile.render.mockImplementation((element, config) => { options.push(config); config.callback("fixture"); return "sync"; });
  const promise = request();
  expect(await promise).toBe("fixture");
  options[0]["expired-callback"]();
  expect(window.turnstile.remove).toHaveBeenCalledTimes(1);
  expect(window.turnstile.remove).toHaveBeenCalledWith("sync");
});
