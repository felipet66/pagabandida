import { couponDate, couponMoney, couponNextAction, couponRewardDetails, couponStatus, requirementProgress } from "./couponPresentation";

const requirement = { type: "deposit", status: "pending", progressAmount: "0", targetAmount: "100.000000000000000000", remainingAmount: "100.000000000000000000", currency: "BRL" };
test("the supplied deposit contract shows actual progress, including zero and completed over-target values", () => {
  expect(requirementProgress(requirement)).toMatchObject({ completed: false, percent: 0 });
  expect(requirementProgress(requirement).detail.replace(/\s/g, " ")).toBe("R$ 0,00 de R$ 100,00");
  expect(requirementProgress({ ...requirement, status: "completed", progressAmount: "1000", targetAmount: "500" })).toMatchObject({ completed: true, percent: 100 });
  expect(requirementProgress({ type: "deposit", progressAmount: null, targetAmount: null })).toMatchObject({ percent: null, detail: null });
});

test("nextAction and pending requirements guide to the existing deposit flow", () => {
  expect(couponNextAction({ requirementsSummary: { nextAction: "deposit" }, requirements: [requirement] })).toMatchObject({ deposit: true, message: "Faça um depósito para avançar nos requisitos." });
  expect(couponNextAction({ requirementsSummary: { nextAction: "none" }, requirements: [{ ...requirement, status: "completed" }] })).toMatchObject({ deposit: false });
  expect(couponNextAction({ requirements: null })).toMatchObject({ deposit: false, message: null });
});

test("the real rewardDetail displays quantity and bet amount without turning free bets into cash", () => {
  const entries = couponRewardDetails({ provider: "dumont", gameSlug: "aviator", quantity: 20, vendorSlug: "spribe", betAmount: "1.00", currency: "BRL" }, "BRL", "free_spins_or_free_bet");
  expect(entries).toEqual(expect.arrayContaining([{ label: "Tipo", value: "Apostas ou rodadas grátis" }, { label: "Quantidade", value: "20" }, { label: "Jogo", value: "Aviator" }, { label: "Provedor", value: "Spribe" }]));
  expect(entries.find(entry => entry.label === "Valor por aposta/rodada").value.replace(/\s/g, " ")).toBe("R$ 1,00");
  expect(entries.some(entry => entry.label === "Valor da recompensa")).toBe(false);
  expect(couponRewardDetails(null)).toEqual([]);
});

test("formats SQL timestamps with microseconds and offsets in Brasília, nulls, amounts and statuses", () => {
  expect(couponDate("2026-10-19 19:41:07.008658+00")).toBe("19/10/2026, 16:41");
  expect(couponDate("2026-10-20")).toBe("20/10/2026");
  expect(couponDate(null)).toBe("Data não informada");
  expect(couponDate("invalid")).toBe("Data não informada");
  expect(couponMoney(null)).toBe("Valor não informado");
  expect(couponMoney("0").replace(/\s/g, " ")).toBe("R$ 0,00");
  expect(couponStatus("pending_requirements")).toBe("Requisitos pendentes");
  expect(couponStatus("rewarded")).toBe("Recompensa concedida");
  expect(couponStatus(null)).toBe("Status indisponível");
});
