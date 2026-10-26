import { testSession, testCookie, testPassword, testEmail, testName, testCpf, testPhone } from "../testSupport/fixtures";
import bffApi from "./bffApi";
import { registerAccount, validateRegistrationDocument, registrationError, saveRegistrationSession } from "./registration";
import { BET_HOUSE } from "../config/betHouse";
import { securityError } from "./turnstile";
jest.mock("./bffApi", () => ({ post: jest.fn() }));
const fields = () => ({ email: testEmail, password: testPassword, cpf: testCpf, phone: testPhone });
let getToken, sequence;
const ok = data => ({ data: { success: true, data } });
const failure = code => ({ data: { success: false, error: { code, message: "Verifique os dados" } } });
beforeEach(() => {
  localStorage.clear(); jest.resetAllMocks(); window.history.replaceState({}, "", "/");
  sequence = 0;
  getToken = jest.fn(async ({ action }) => `${action}-fixture-${++sequence}`);
});

test("cadastro usa token register e preserva tracking, normalização e sessão sem consulta extra de CPF", async () => {
  window.history.replaceState({}, "", "/?axioClickId=click-fixture");
  const result = { access_token: testSession, cookie_key: testCookie, expires_in: 100, user: { id: "fixture", email: testEmail, name: testName } };
  bffApi.post.mockResolvedValue(ok(result));
  const data = await registerAccount({ ...fields(), cpf: testCpf.split("").join("."), phone: testPhone.split("").join(" ") }, { getToken });
  expect(getToken).toHaveBeenCalledWith({ action: "register", signal: undefined });
  expect(bffApi.post.mock.calls).toEqual([["api/auth/register-simplified", {
    ...fields(), countryCode: "BR", axioClickId: "click-fixture", axioAffId: "NLNYO", captcha_token: "register-fixture-1",
  }, { publicRequest: true, signal: undefined }]]);
  saveRegistrationSession(data);
  expect(localStorage.getItem("access_token")).toBe(testSession);
  expect(localStorage.getItem("cookie_key")).toBe(testCookie);
  ["cpf", "password", "captcha_token"].forEach(key => expect(localStorage.getItem(key)).toBeNull());
});

test("afiliação padrão e tracking atual têm prioridade sobre valores salvos", async () => {
  bffApi.post.mockResolvedValue(ok({}));
  await registerAccount(fields(), { getToken });
  expect(bffApi.post.mock.calls[0][1]).toMatchObject({ axioAffId: "NLNYO", axioClickId: "e5050517-3f86-4335-9fc7-5d0adaf550f4" });
  expect(BET_HOUSE.registrationUrl).toBe("https://go.ganhebetbr.com/c/7ul");
  localStorage.setItem("axioClickId", "saved-fixture");
  localStorage.setItem("axioAffId", "saved-affiliate");
  localStorage.setItem("utm_source", "current-campaign");
  localStorage.setItem("landingUrl", "https://app.example.invalid/lp");
  localStorage.setItem("ga_client_id", "analytics-fixture");
  window.history.replaceState({}, "", "/?axioClickId=current-click&axioAffId=current-affiliate");
  await registerAccount(fields(), { getToken });
  expect(bffApi.post.mock.calls[1][1]).toMatchObject({ axioAffId: "current-affiliate", axioClickId: "current-click", utm_source: "current-campaign", ga_client_id: "analytics-fixture", landingUrl: "https://app.example.invalid/lp" });
  const target = new URL(BET_HOUSE.registrationUrl);
  expect(target.toString()).toBe("https://go.ganhebetbr.com/c/7ul");
});

test("CPF usa token cpf_lookup novo, rota pública, máscara retornada e cancelamento", async () => {
  const signal = new AbortController().signal;
  const masked = { cpfMasked: "***", nameMasked: "***", birthDateMasked: "***" };
  bffApi.post.mockResolvedValue(ok(masked));
  expect(await validateRegistrationDocument(testCpf.split("").join("."), { getToken, signal })).toEqual(masked);
  expect(bffApi.post).toHaveBeenCalledWith("api/auth/validate-document", { number: testCpf, captcha_token: "cpf_lookup-fixture-1" }, { publicRequest: true, signal });
  await registerAccount(fields(), { getToken });
  expect(bffApi.post.mock.calls[1][1].captcha_token).toBe("register-fixture-2");
});

test.each(["cpf_lookup", "register"])("BOT_CHECK_FAILED em %s permite somente uma repetição com token novo", async action => {
  bffApi.post.mockResolvedValue(failure("BOT_CHECK_FAILED"));
  const operation = () => action === "register" ? registerAccount(fields(), { getToken }) : validateRegistrationDocument(testCpf, { getToken });
  await expect(operation()).rejects.toMatchObject({ apiError: { code: "BOT_CHECK_FAILED" } });
  expect(bffApi.post).toHaveBeenCalledTimes(2);
  expect(getToken.mock.calls.map(([options]) => options.action)).toEqual([action, action]);
  expect(bffApi.post.mock.calls.map(([, body]) => body.captcha_token)).toEqual([`${action}-fixture-1`, `${action}-fixture-2`]);
});

test("erro HTTP estruturado BOT_CHECK_FAILED também repete e mantém body/tracking", async () => {
  bffApi.post.mockRejectedValueOnce({ response: { status: 403, data: failure("BOT_CHECK_FAILED").data } }).mockResolvedValueOnce(ok({ user: {} }));
  await registerAccount(fields(), { getToken });
  const [first, second] = bffApi.post.mock.calls.map(([, body]) => body);
  expect({ ...second, captcha_token: first.captcha_token }).toEqual(first);
  expect(second.captcha_token).not.toBe(first.captcha_token);
});

test.each(["INVALID_DOCUMENT", "USER_ALREADY_EXISTS", "INVALID_CREDENTIALS", undefined])("não repete erro genérico ou outro código %s", async code => {
  bffApi.post.mockResolvedValue(failure(code));
  await expect(registerAccount(fields(), { getToken })).rejects.toMatchObject({ apiError: { code } });
  expect(bffApi.post).toHaveBeenCalledTimes(1);
  expect(getToken).toHaveBeenCalledTimes(1);
  expect(registrationError({ apiError: { code } }).code).toBe(code);
});

test("falha de rede não repete cadastro automaticamente", async () => {
  bffApi.post.mockRejectedValue(new Error("Network error"));
  await expect(registerAccount(fields(), { getToken })).rejects.toThrow();
  expect(bffApi.post).toHaveBeenCalledTimes(1);
  expect(getToken).toHaveBeenCalledTimes(1);
  expect(registrationError(new Error("Network error")).message).toContain("confirmar o resultado");
});

test("CPF incompleto não gera token nem chega ao BFF; erros de campo/rate limit mantidos", async () => {
  await expect(registerAccount({ ...fields(), cpf: "" }, { getToken })).rejects.toMatchObject({ apiError: { code: "INVALID_DOCUMENT" } });
  await expect(validateRegistrationDocument("123", { getToken })).rejects.toMatchObject({ apiError: { code: "INVALID_DOCUMENT" } });
  expect(getToken).not.toHaveBeenCalled(); expect(bffApi.post).not.toHaveBeenCalled();
  const apiError = { code: "VALIDATION_ERROR", message: "Verifique os dados", details: [{ field: "phone", message: "Telefone inválido" }] };
  expect(registrationError({ apiError })).toEqual({ code: apiError.code, message: apiError.message, fields: { phone: "Telefone inválido" } });
  expect(registrationError({ response: { status: 429 } }).message).toBe("Aguarde alguns minutos e tente novamente.");
});

test("falha ou token vazio bloqueia o BFF, inclusive na repetição", async () => {
  getToken.mockResolvedValueOnce("");
  await expect(registerAccount(fields(), { getToken })).rejects.toMatchObject({ securityError: true });
  expect(bffApi.post).not.toHaveBeenCalled();
  bffApi.post.mockResolvedValueOnce(failure("BOT_CHECK_FAILED"));
  getToken.mockResolvedValueOnce("fixture-first").mockRejectedValueOnce(securityError("TURNSTILE_FAILED", "Tente novamente."));
  await expect(registerAccount(fields(), { getToken })).rejects.toMatchObject({ securityError: true });
  expect(bffApi.post).toHaveBeenCalledTimes(1);
});

test("cancelamento enquanto aguarda token bloqueia chamada HTTP", async () => {
  const controller = new AbortController();
  getToken.mockImplementation(async () => { controller.abort(); return "fixture"; });
  await expect(validateRegistrationDocument(testCpf, { getToken, signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
  expect(bffApi.post).not.toHaveBeenCalled();
});
