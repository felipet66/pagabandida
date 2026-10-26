import bffApi from "./bffApi";
import { clearAppSession } from "./appStorage";

export const COUPON_PAGE_LIMIT = 50;
export const COUPON_SOURCE = "app.global.coupon-modal";
const options = { timeout: 15000, handleUnauthorized: true };
let attemptSession = null;
const uncertainAttempts = new Map();

const session = () => {
  const token = localStorage.getItem("access_token");
  if (!token) throw Object.assign(new Error("Entre na sua conta para acessar os cupons."), { code: "AUTH_REQUIRED", uncertain: false });
  return token;
};

export function couponError(failure, fallback = "Não foi possível carregar os cupons. Tente novamente.") {
  if (failure.couponError) return failure;
  const apiError = failure.apiError || failure.response?.data?.error;
  const status = failure.response?.status;
  const uncertain = failure.uncertain ?? (!failure.response && !failure.apiError && failure.code !== "BFF_CONFIGURATION_MISSING");
  const message = status === 401 || failure.code === "AUTH_REQUIRED" ? "Entre novamente para acessar seus cupons." :
    status === 429 ? "Muitas tentativas. Aguarde um pouco e tente novamente." :
      status >= 500 ? fallback : typeof apiError?.message === "string" && apiError.message.trim() ? apiError.message : failure.code === "AUTH_REQUIRED" ? failure.message : fallback;
  return Object.assign(new Error(message), { couponError: true, code: apiError?.code || failure.code || "UNAVAILABLE",
    details: apiError?.details ?? null, authRequired: status === 401 || failure.code === "AUTH_REQUIRED", uncertain: uncertain || status >= 500 });
}

function unwrap(body) {
  if (body?.success === false) throw Object.assign(new Error(), { apiError: body.error || {}, uncertain: false });
  if (body?.success !== true || !body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
    throw Object.assign(new Error(), { code: "INVALID_RESPONSE", uncertain: true });
  }
  return body.data;
}

// The module retains uncertain attempts across modal close/reopen and route
// changes. Nothing stores a token or an idempotency key in persistent storage.
export function getCouponAttempt(code) {
  const currentSession = session();
  if (attemptSession !== currentSession) { uncertainAttempts.clear(); attemptSession = currentSession; }
  const normalized = code.trim();
  if (!normalized) throw Object.assign(new Error("Digite o código do cupom."), { couponError: true, code: "CODE_REQUIRED", uncertain: false });
  if (!uncertainAttempts.has(normalized)) {
    if (typeof window.crypto?.randomUUID !== "function") throw Object.assign(new Error("Não foi possível iniciar o resgate. Atualize seu navegador e tente novamente."), { couponError: true, code: "UUID_UNAVAILABLE", uncertain: false });
    uncertainAttempts.set(normalized, { code: normalized, currency: "BRL", source: COUPON_SOURCE, idempotencyKey: window.crypto.randomUUID() });
  }
  return uncertainAttempts.get(normalized);
}

export async function redeemCoupon(attempt, signal) {
  session();
  const currentSession = attemptSession;
  try {
    const response = await bffApi.post("api/coupons/redeem", { code: attempt.code, currency: "BRL", idempotencyKey: attempt.idempotencyKey, source: COUPON_SOURCE }, { ...options, signal });
    const data = unwrap(response.data);
    if (attemptSession === currentSession && uncertainAttempts.get(attempt.code)?.idempotencyKey === attempt.idempotencyKey) uncertainAttempts.delete(attempt.code);
    return data;
  } catch (failure) {
    if (failure.response?.status === 401) clearAppSession();
    const error = couponError(failure, "Não foi possível confirmar o resgate. Tente novamente.");
    // A timeout, lost connection or 5xx may occur after the server committed.
    // Such retries must keep the exact same key and payload.
    if (!error.uncertain && attemptSession === currentSession && uncertainAttempts.get(attempt.code)?.idempotencyKey === attempt.idempotencyKey) uncertainAttempts.delete(attempt.code);
    throw error;
  }
}

async function list(path, field, offset, signal) {
  session();
  try {
    const response = await bffApi.get(path, { ...options, signal, params: { limit: COUPON_PAGE_LIMIT, offset } });
    const data = unwrap(response.data);
    const items = data[field] == null ? [] : data[field];
    if (!Array.isArray(items)) throw Object.assign(new Error(), { code: "INVALID_RESPONSE" });
    const pagination = data.pagination || data;
    const rawTotal = pagination.total ?? pagination.totalCount;
    const total = rawTotal == null || String(rawTotal).trim() === "" ? null : Number(rawTotal);
    const knownTotal = Number.isInteger(total) && total >= 0 ? total : null;
    return { items: items.filter(item => item && typeof item === "object"), total: knownTotal,
      hasMore: typeof pagination.hasMore === "boolean" ? pagination.hasMore : knownTotal != null ? offset + items.length < knownTotal : items.length === COUPON_PAGE_LIMIT };
  } catch (failure) { if (failure.response?.status === 401) clearAppSession(); throw couponError(failure); }
}

export const listPendingCouponRewards = (offset = 0, signal) => list("api/coupons/me/pending-rewards", "pendingRewards", offset, signal);
export const listCouponRedemptions = (offset = 0, signal) => list("api/coupons/me/redemptions", "redemptions", offset, signal);
