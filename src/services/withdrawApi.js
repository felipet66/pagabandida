import bffApi from "./bffApi";

export const PIX_KEY_TYPES = ["CPF", "EMAIL", "PHONE", "CNPJ", "RANDOM"];

export async function requestWithdraw(amount, pixKey, signal) {
  if (!Number.isFinite(amount) || amount <= 0 || !PIX_KEY_TYPES.includes(pixKey?.type) ||
      (pixKey.type !== "CPF" && !pixKey.key?.trim())) throw new Error("Confira o valor e a chave Pix.");
  const key = pixKey.key?.trim();
  const response = await bffApi.post("api/wallet/withdraw", {
    currency: "BRL", amount: amount.toFixed(2), methodCode: "PIX",
    pixKey: { type: pixKey.type, ...(key ? { key } : {}) },
  }, { signal, handleUnauthorized: true });
  const body = response.data;
  if (body?.success !== true) {
    const error = new Error(body?.error?.message || "Não foi possível solicitar o saque. Tente novamente.");
    error.apiError = body?.error;
    throw error;
  }
  return body.data;
}
