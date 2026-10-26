import bffApi from "./bffApi";
import { getCouponAttempt, redeemCoupon, listPendingCouponRewards, listCouponRedemptions, couponError } from "./couponsApi";
import { randomUUID } from "crypto";
jest.mock("./bffApi", () => ({ get: jest.fn(), post: jest.fn() }));
const success = data => ({ data: { success: true, data } });
beforeEach(() => {
  localStorage.clear(); localStorage.setItem("access_token", randomUUID());
  Object.defineProperty(window, "crypto", { configurable: true, value: { randomUUID: jest.fn(randomUUID) } });
  bffApi.get.mockReset(); bffApi.post.mockReset();
});

test("redeem uses the BFF, exact payload and one UUID per new attempt", async () => {
  const attempt = getCouponAttempt(" TEST-CODE ");
  bffApi.post.mockResolvedValue(success({ status: "pending_requirements", redemptionId: "synthetic-id" }));
  const signal = new AbortController().signal;
  expect(await redeemCoupon(attempt, signal)).toMatchObject({ status: "pending_requirements" });
  expect(bffApi.post).toHaveBeenCalledWith("api/coupons/redeem", { code: "TEST-CODE", currency: "BRL", idempotencyKey: attempt.idempotencyKey, source: "app.global.coupon-modal" }, { signal, timeout: 15000, handleUnauthorized: true });
  expect(window.crypto.randomUUID).toHaveBeenCalledTimes(1);
  expect(getCouponAttempt("TEST-CODE").idempotencyKey).not.toBe(attempt.idempotencyKey);
});

test.each([
  { code: "ERR_NETWORK" }, { code: "ECONNABORTED" }, { response: { status: 503 } },
])("uncertain failures retain the same key and payload even across another coupon", async failure => {
  const attempt = getCouponAttempt("RETRY-COUPON");
  bffApi.post.mockRejectedValueOnce(failure);
  await expect(redeemCoupon(attempt)).rejects.toMatchObject({ uncertain: true });
  getCouponAttempt("ANOTHER-COUPON");
  expect(getCouponAttempt("RETRY-COUPON")).toBe(attempt);
  bffApi.post.mockResolvedValueOnce(success({ status: "pending_requirements" }));
  await redeemCoupon(getCouponAttempt("RETRY-COUPON"));
  expect(bffApi.post.mock.calls[1][1]).toEqual(bffApi.post.mock.calls[0][1]);
});

test("business errors preserve code/message/details and allow a new attempt", async () => {
  const attempt = getCouponAttempt("INVALID");
  const error = { code: "COUPON_EXPIRED", message: "Este cupom expirou.", details: [{ field: "code", message: "Código expirado" }] };
  bffApi.post.mockResolvedValue({ data: { success: false, error } });
  await expect(redeemCoupon(attempt)).rejects.toMatchObject({ code: error.code, message: error.message, details: error.details, uncertain: false });
  expect(getCouponAttempt("INVALID").idempotencyKey).not.toBe(attempt.idempotencyKey);
});

test("a malformed successful response retains the key because the redemption may have committed", async () => {
  const attempt = getCouponAttempt("UNCERTAIN");
  bffApi.post.mockResolvedValue({ data: { success: true, data: null } });
  await expect(redeemCoupon(attempt)).rejects.toMatchObject({ code: "INVALID_RESPONSE", uncertain: true });
  expect(getCouponAttempt("UNCERTAIN")).toBe(attempt);
});

test.each([
  [listPendingCouponRewards, "api/coupons/me/pending-rewards", "pendingRewards"],
  [listCouponRedemptions, "api/coupons/me/redemptions", "redemptions"],
])("lists use limit/offset and preserve optional pagination", async (load, path, field) => {
  const rows = [{ code: "TEST" }];
  bffApi.get.mockResolvedValue(success({ [field]: rows, pagination: { total: 101 } }));
  const signal = new AbortController().signal;
  expect(await load(50, signal)).toMatchObject({ items: rows, total: 101, hasMore: true });
  expect(bffApi.get).toHaveBeenCalledWith(path, { signal, timeout: 15000, handleUnauthorized: true, params: { limit: 50, offset: 50 } });
  bffApi.get.mockResolvedValue(success({ [field]: null }));
  expect(await load()).toMatchObject({ items: [], hasMore: false });
});

test("a full page enables next without inventing a total; malformed lists are errors", async () => {
  bffApi.get.mockResolvedValue(success({ pendingRewards: Array.from({ length: 50 }, (_, id) => ({ id })) }));
  expect(await listPendingCouponRewards()).toMatchObject({ hasMore: true, total: null });
  bffApi.get.mockResolvedValue(success({ pendingRewards: {} }));
  await expect(listPendingCouponRewards()).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
});

test("missing session never sends a request, and keys are isolated across sessions", async () => {
  const original = getCouponAttempt("SAME");
  localStorage.setItem("access_token", randomUUID());
  expect(getCouponAttempt("SAME").idempotencyKey).not.toBe(original.idempotencyKey);
  localStorage.clear();
  await expect(listCouponRedemptions()).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
  expect(() => getCouponAttempt("SAME")).toThrow();
  expect(bffApi.get).not.toHaveBeenCalled();
});

test("401 clears the existing session and reports authentication instead of a network retry", async () => {
  bffApi.get.mockRejectedValue({ response: { status: 401, data: { error: { code: "UNAUTHORIZED" } } } });
  await expect(listPendingCouponRewards()).rejects.toMatchObject({ authRequired: true, uncertain: false });
  expect(localStorage.getItem("access_token")).toBeNull();
  expect(couponError({ response: { status: 429 } }).message).toContain("Muitas tentativas");
});
