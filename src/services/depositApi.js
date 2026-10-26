import bffApi from "./bffApi";
import { clearAppSession } from "./appStorage";

export async function syncDeposits(signal) {
  const response = await bffApi.post("api/wallet/deposits/sync", undefined, { signal, handleUnauthorized: true, timeout: 12000 });
  const data = response.data?.data;
  if (response.data?.success !== true || !Number.isInteger(data?.confirmed) || data.confirmed < 0 || !Number.isInteger(data?.pending) || data.pending < 0) {
    throw new Error("Resposta de sincronização inválida");
  }
  return data;
}

export function clearDepositSession() {
  clearAppSession();
}

export async function fetchDepositBalance(signal) {
  const response = await bffApi.get("api/wallet/balances", { signal, handleUnauthorized: true, timeout: 12000 });
  const body = response.data;
  const selected = body?.data?.balances?.find(balance => balance.currency === "BRL");
  const raw = selected?.available;
  const amount = raw == null || String(raw).trim() === "" ? NaN : Number(raw);
  if (body?.success !== true || !Number.isFinite(amount)) throw new Error("Saldo indisponível");
  return amount;
}

export async function requestDeposit(amount, signal) {
  const response = await bffApi.post("api/wallet/deposit", {
    currency: "BRL", amount: Number(amount).toFixed(2), methodCode: "PIX"
  }, { signal, handleUnauthorized: true });
  const body = response.data;
  if (body?.success !== true) {
    const failure = new Error(body?.error?.message || "Não foi possível gerar o Pix. Tente novamente.");
    failure.apiError = body?.error;
    throw failure;
  }
  const data = body.data;
  if (!data?.transaction?.id || (!Number.isFinite(Number(data.transaction.amount)) || !(Number(data.transaction.amount) > 0)) ||
      typeof data?.paymentPayload?.pix_payment !== "string" || !data.paymentPayload.pix_payment) {
    throw new Error("Resposta de Pix inválida");
  }
  return data;
}

export function depositError(failure) {
  const status = failure.response?.status;
  const apiError = failure.apiError || failure.response?.data?.error;
  const fields = {};
  if (apiError?.code === "VALIDATION_ERROR" && Array.isArray(apiError.details)) {
    apiError.details.forEach(item => {
      if (item.field && item.message) fields[item.field] = item.message;
    });
  }
  return {
    code: apiError?.code,
    message: apiError && (status === 400 || status === 422 || failure.apiError || apiError.code === "DOCUMENT_REQUIRED") ?
      apiError.message || "Confira os dados e tente novamente." : "Não foi possível gerar o Pix. Tente novamente.",
    fields
  };
}
