import { testSession, testCookie, testPassword, testEmail, testName, testCpf, testPhone } from "../testSupport/fixtures";
import bffApi from "./bffApi";
import { registerAccount, validateRegistrationDocument, registrationError, saveRegistrationSession } from "./registration";
import { BET_HOUSE } from "../config/betHouse";
jest.mock("./bffApi", () => ({ post: jest.fn() }));
const fields = () => ({ email: testEmail, password: testPassword, cpf: testCpf, phone: testPhone });
beforeEach(() => { localStorage.clear(); jest.clearAllMocks(); window.history.replaceState({}, "", "/"); });

test("valida CPF antes do cadastro público, preserva tracking recebido e não persiste CPF ou senha", async () => {
  window.history.replaceState({}, "", "/?axioClickId=click-fixture");
  const result = { access_token: testSession, cookie_key: testCookie, expires_in: 100, user: { id: "fixture", email: testEmail, name: testName } };
  bffApi.post.mockResolvedValueOnce({ data: { success: true, data: {} } }).mockResolvedValueOnce({ data: { success: true, data: result } });
  const data = await registerAccount({ ...fields(), cpf: testCpf.split("").join("."), phone: testPhone.split("").join(" ") });
  expect(bffApi.post.mock.calls[0]).toEqual(["api/auth/validate-document", { number: testCpf }, { publicRequest: true, signal: undefined }]);
  expect(bffApi.post.mock.calls[1]).toEqual(["api/auth/register-simplified", {
    ...fields(), countryCode: "BR", axioClickId: "click-fixture", axioAffId: "NLNYO",
  }, { publicRequest: true }]);
  saveRegistrationSession(data);
  expect(localStorage.getItem("access_token")).toBe(testSession);
  expect(localStorage.getItem("cookie_key")).toBe(testCookie);
  expect(localStorage.getItem("cpf")).toBeNull();
  expect(localStorage.getItem("password")).toBeNull();
});

test("usa a afiliação fornecida por padrão; URL atual tem prioridade sobre tracking salvo", async () => {
  bffApi.post.mockResolvedValue({ data: { success: true, data: {} } });
  await registerAccount(fields());
  expect(bffApi.post.mock.calls[1][1]).toMatchObject({
    axioAffId: "NLNYO", axioClickId: "e5050517-3f86-4335-9fc7-5d0adaf550f4",
  });
  expect(BET_HOUSE.registrationUrl).toBe("https://www.ganhebetbr.com/?modal=register&axioClickId=e5050517-3f86-4335-9fc7-5d0adaf550f4&axioAffId=NLNYO");
  const site = new URL(BET_HOUSE.siteUrl);
  expect(site.searchParams.get("axioAffId")).toBe("NLNYO");
  expect(site.searchParams.get("modal")).toBeNull();
  localStorage.setItem("axioClickId", "saved-fixture");
  localStorage.setItem("axioAffId", "saved-affiliate");
  localStorage.setItem("utm_source", "current-campaign");
  localStorage.setItem("landingUrl", "https://app.example.invalid/lp");
  localStorage.setItem("ga_client_id", "analytics-fixture");
  window.history.replaceState({}, "", "/?axioClickId=current-click&axioAffId=current-affiliate");
  await registerAccount(fields());
  expect(bffApi.post.mock.calls[3][1]).toMatchObject({ axioAffId: "current-affiliate", axioClickId: "current-click", utm_source: "current-campaign", ga_client_id: "analytics-fixture", landingUrl: "https://app.example.invalid/lp" });
  const target = new URL(BET_HOUSE.registrationUrl);
  expect(target.origin).toBe("https://www.ganhebetbr.com");
  expect(target.searchParams.get("axioClickId")).toBe("current-click");
  expect(target.searchParams.get("axioAffId")).toBe("current-affiliate");
  expect(target.searchParams.get("modal")).toBe("register");
  expect(target.searchParams.get("utm_source")).toBe("current-campaign");
});

test("CPF usa rota pública sem captcha e permite cancelamento", async () => {
  const signal = new AbortController().signal;
  const masked = { cpfMasked: "***", nameMasked: "***", birthDateMasked: "***" };
  bffApi.post.mockResolvedValue({ data: { success: true, data: masked } });
  expect(await validateRegistrationDocument(testCpf, signal)).toEqual(masked);
  expect(bffApi.post).toHaveBeenCalledWith("api/auth/validate-document", { number: testCpf }, { publicRequest: true, signal });
});

test.each(["INVALID_DOCUMENT", "USER_ALREADY_EXISTS", "INVALID_CREDENTIALS"])("preserva error.code %s e impede cadastro se validação falhar", async code => {
  const apiError = { code, message: "Verifique os dados" };
  bffApi.post.mockResolvedValue({ data: { success: false, error: apiError } });
  await expect(registerAccount(fields())).rejects.toMatchObject({ apiError });
  expect(bffApi.post).toHaveBeenCalledTimes(1);
  expect(registrationError({ apiError })).toMatchObject({ code });
});

test("CPF incompleto não chega ao BFF; erros de campo e rate limit são preservados", async () => {
  await expect(registerAccount({ ...fields(), cpf: "" })).rejects.toMatchObject({ apiError: { code: "INVALID_DOCUMENT" } });
  expect(bffApi.post).not.toHaveBeenCalled();
  const apiError = { code: "VALIDATION_ERROR", message: "Verifique os dados", details: [{ field: "phone", message: "Telefone inválido" }] };
  expect(registrationError({ apiError })).toEqual({ code: apiError.code, message: apiError.message, fields: { phone: "Telefone inválido" } });
  expect(registrationError({ response: { status: 429 } }).message).toBe("Aguarde alguns minutos e tente novamente.");
});

test("falha de rede não repete cadastro automaticamente", async () => {
  bffApi.post.mockRejectedValue(new Error("Network error"));
  await expect(registerAccount(fields())).rejects.toThrow();
  expect(bffApi.post).toHaveBeenCalledTimes(1);
  expect(registrationError(new Error("Network error")).message).toContain("confirmar o resultado");
});
