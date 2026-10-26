export const AVIATOR_COUPON_PROMOTION = {
  code: "",
  minimumDeposit: 100,
  quantity: 20,
  game: "Aviator",
  depositPath: "/admin/deposit",
};

export const isAviatorPromotion = code => Boolean(AVIATOR_COUPON_PROMOTION.code) && typeof code === "string" && code.trim().toUpperCase() === AVIATOR_COUPON_PROMOTION.code;
