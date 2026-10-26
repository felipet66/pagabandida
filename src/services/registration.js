import bffApi from "./bffApi";
import { abortError, securityError } from "./turnstile";
import { BET_HOUSE } from "../config/betHouse";

export function unwrapRegistration(response) {
  const body = response.data;
  if (!body?.success) {
    const error = new Error(body?.error?.message || "Tente novamente.");
    error.apiError = body?.error;
    throw error;
  }
  return body.data;
}

export function registrationError(error) {
  if (error.securityError) return { message: error.message, fields: {}, code: error.code };
  const apiError = error.apiError || error.response?.data?.error || {};
  const code = apiError.code;
  const status = error.response?.status;
  let message = apiError.message || "Não foi possível concluir. Tente novamente.";
  if (code === "INVALID_DOCUMENT") message = "CPF inválido. Confira os números.";
  if (code === "USER_ALREADY_EXISTS") message = apiError.message || "Esta conta já existe. Faça login para continuar.";
  if (code === "INVALID_CREDENTIALS") message = apiError.message || "Confira seu e-mail e senha e tente novamente.";
  if (status === 429 || ["TOO_MANY_REQUESTS", "LOGIN_RATE_LIMITED"].includes(code)) message = "Aguarde alguns minutos e tente novamente.";
  if (code === "INVALID_APP_KEY") message = "Não foi possível concluir por um erro de configuração. Entre em contato com o suporte.";
  if (!error.apiError && (!status || status >= 500)) message = "Não foi possível confirmar o resultado. Tente novamente ou faça login se a conta já foi criada.";
  if (code === "BOT_CHECK_FAILED") message = "Não foi possível confirmar a verificação de segurança. Tente novamente; seus dados foram mantidos.";
  const fields = {};
  if (code === "VALIDATION_ERROR" && Array.isArray(apiError.details)) {
    apiError.details.forEach(({ field, message: fieldMessage }) => {
      if (field && fieldMessage) fields[field] = fieldMessage;
    });
  }
  return { message, fields, code };
}

export function getRegistrationTracking() {
  return { ...BET_HOUSE.registrationTracking };
}

export function saveRegistrationSession(data) {
  const token = data.access_token || data.session?.token;
  if (!token || !data.user?.id) throw new Error("Sessão de cadastro ausente");
  const values = {
    access_token: token,
    cookie_key: data.cookie_key,
    expires_in: data.expires_in ?? data.session?.expiresIn,
    user_id: data.user.id,
    user_name: data.user.name || data.user.username,
    user_email: data.user.email,
    email: data.user.email,
    user_token: data.user.token,
  };
  Object.entries(values).forEach(([key, value]) => {
    if (value != null) localStorage.setItem(key, String(value));
    else localStorage.removeItem(key);
  });
}

export function normalizeRegistrationCpf(value) {
  const cpf = String(value || "").replace(/\D/g, "");
  if (cpf.length !== 11) {
    const error = new Error("CPF inválido. Confira os números.");
    error.apiError = { code: "INVALID_DOCUMENT", message: error.message };
    throw error;
  }
  return cpf;
}

async function protectedOperation(path, body, action, { getToken, signal } = {}) {
  if (typeof getToken !== "function") throw securityError("TURNSTILE_NOT_READY", "A verificação de segurança não está disponível. Tente novamente.");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (signal?.aborted) throw abortError();
    const token = await getToken({ action, signal });
    if (signal?.aborted) throw abortError();
    if (typeof token !== "string" || !token.trim()) throw securityError("TURNSTILE_FAILED", "Não foi possível verificar a segurança. Tente novamente.");
    try {
      return unwrapRegistration(await bffApi.post(path, { ...body, captcha_token: token }, { publicRequest: true, signal }));
    } catch (error) {
      const code = error.apiError?.code || error.response?.data?.error?.code;
      if (signal?.aborted || attempt === 1 || code !== "BOT_CHECK_FAILED") throw error;
    }
  }
}

export async function validateRegistrationDocument(number, options) {
  return protectedOperation("api/auth/validate-document", { number: normalizeRegistrationCpf(number) }, "cpf_lookup", options);
}

export async function registerAccount(fields, options) {
  const cpf = normalizeRegistrationCpf(fields.cpf);
  return protectedOperation("api/auth/register-simplified", {
    email: fields.email?.trim(), password: fields.password,
    phone: String(fields.phone || "").replace(/\D/g, ""), cpf, countryCode: "BR",
    ...getRegistrationTracking(),
  }, "register", options);
}
