import bffApi from "./bffApi";
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

export async function validateRegistrationDocument(number, signal) {
  return unwrapRegistration(await bffApi.post("api/auth/validate-document", { number }, { publicRequest: true, signal }));
}

export async function registerAccount(fields) {
  const cpf = String(fields.cpf || "").replace(/\D/g, "");
  if (cpf.length !== 11) {
    const error = new Error("CPF inválido. Confira os números.");
    error.apiError = { code: "INVALID_DOCUMENT", message: error.message };
    throw error;
  }
  await validateRegistrationDocument(cpf);
  return unwrapRegistration(await bffApi.post("api/auth/register-simplified", {
    email: fields.email?.trim(), password: fields.password,
    phone: String(fields.phone || "").replace(/\D/g, ""), cpf, countryCode: "BR",
    ...getRegistrationTracking(),
  }, { publicRequest: true }));
}
