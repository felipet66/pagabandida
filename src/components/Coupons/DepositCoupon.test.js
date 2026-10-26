import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { randomUUID } from "crypto";
import Deposit from "../../views/Deposit";
import useDeposit from "../../hooks/useDeposit";
import useDepositSync from "../../hooks/useDepositSync";
import bffApi from "../../services/bffApi";

jest.mock("../../hooks/useDeposit", () => jest.fn());
jest.mock("../../hooks/useDepositSync", () => jest.fn());
jest.mock("../../services/bffApi", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("sweetalert2", () => ({ fire: jest.fn() }));
const envelope = data => ({ data: { success: true, data } });
const pix = { transaction: { id: "synthetic-pix", amount: "100.00" }, paymentPayload: { pix_payment: "synthetic-payment", expiresAt: null } };
const originalCrypto = Object.getOwnPropertyDescriptor(window, "crypto");
let createDeposit;
beforeEach(() => {
  localStorage.clear(); localStorage.setItem("access_token", randomUUID());
  Object.defineProperty(window, "crypto", { configurable: true, value: { randomUUID: jest.fn(randomUUID) } });
  createDeposit = jest.fn().mockResolvedValue(pix);
  useDeposit.mockReturnValue({ loading: false, createDeposit, clearError: jest.fn() });
  useDepositSync.mockReturnValue({ status: "pending", remaining: null, error: null });
  bffApi.get.mockReset().mockResolvedValue(envelope({ pendingRewards: [] }));
  bffApi.post.mockReset();
});
afterAll(() => { if (originalCrypto) Object.defineProperty(window, "crypto", originalCrypto); else delete window.crypto; });
const mount = (path = "/admin/deposit?coupon=TEST-OPTIONAL") => render(<MemoryRouter initialEntries={[path]}><Deposit /></MemoryRouter>);
const ready = async () => waitFor(() => expect(screen.getByRole("button", { name: "Gerar Pix" }).disabled).toBe(false));

test("cupom recebido preenche só o código, sem prometer a campanha da marca anterior", async () => {
  mount(); await ready();
  expect(screen.getByLabelText("Valor do depósito").value).toBe("");
  expect(screen.getByLabelText(/Código do cupom/).value).toBe("TEST-OPTIONAL");
  expect(screen.queryByText("20 rodadas no Aviator")).toBeNull();
  expect(bffApi.post).not.toHaveBeenCalled();
  expect(createDeposit).not.toHaveBeenCalled();
});

test("an optional coupon cannot be silently skipped when generating Pix, even with the section collapsed", async () => {
  mount("/admin/deposit"); await ready();
  expect(screen.queryByLabelText(/Código do cupom/)).toBeNull();
  fireEvent.change(screen.getByLabelText("Valor do depósito"), { target: { value: "100" } });
  fireEvent.click(screen.getByRole("button", { name: /Possui cupom/ }));
  fireEvent.change(screen.getByLabelText(/Código do cupom/), { target: { value: "TEST-OPTIONAL" } });
  fireEvent.click(screen.getByRole("button", { name: /Possui cupom/ }));
  fireEvent.click(screen.getByRole("button", { name: "Gerar Pix" }));
  expect(screen.getByRole("alert").textContent).toContain("Ative o cupom antes de gerar o Pix");
  expect(document.activeElement).toBe(screen.getByLabelText(/Código do cupom/));
  expect(createDeposit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Continuar sem cupom" }));
  fireEvent.click(screen.getByRole("button", { name: "Gerar Pix" }));
  await screen.findByRole("heading", { name: "Pix gerado" });
  expect(createDeposit).toHaveBeenCalledWith(100); expect(bffApi.post).not.toHaveBeenCalled();
});

test("activation blocks repeated clicks and payment until the coupon response, then preserves the pending notice beside Pix", async () => {
  let resolve; bffApi.post.mockReturnValue(new Promise(done => { resolve = done; }));
  mount(); await ready();
  fireEvent.change(screen.getByLabelText("Valor do depósito"), { target: { value: "100" } });
  const button = screen.getByRole("button", { name: "Ativar cupom" });
  fireEvent.click(button); fireEvent.click(button);
  expect(bffApi.post).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: /Verificando cupom/ }).disabled).toBe(true);
  expect(screen.getByLabelText("Valor do depósito").disabled).toBe(true);
  expect(createDeposit).not.toHaveBeenCalled();
  await act(async () => resolve(envelope({ status: "pending_requirements", redemptionId: "synthetic-redemption" })));
  expect(screen.getByText("Cupom TEST-OPTIONAL registrado")).toBeTruthy();
  expect(screen.getByText(/A recompensa ainda não foi liberada/)).toBeTruthy();
  expect(bffApi.post).toHaveBeenCalledWith("api/coupons/redeem", expect.objectContaining({ code: "TEST-OPTIONAL", currency: "BRL", source: "app.global.coupon-modal", idempotencyKey: expect.any(String) }), expect.any(Object));
  fireEvent.click(screen.getByRole("button", { name: "Gerar Pix" }));
  await screen.findByRole("heading", { name: "Pix gerado" });
  expect(createDeposit).toHaveBeenCalledTimes(1);
  expect(createDeposit).toHaveBeenCalledWith(100);
  expect(screen.getByText("Cupom TEST-OPTIONAL registrado")).toBeTruthy();
  expect(screen.getByText(/A recompensa ainda não foi liberada/)).toBeTruthy();
});

test("network retry retains the same idempotency key and Enter activates only the coupon", async () => {
  bffApi.post.mockRejectedValueOnce({ code: "ERR_NETWORK" }).mockResolvedValueOnce(envelope({ status: "pending_requirements" }));
  mount(); await ready();
  fireEvent.keyDown(screen.getByLabelText(/Código do cupom/), { key: "Enter" });
  await screen.findByText(/A ativação ainda não foi confirmada/);
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await screen.findByText("Cupom TEST-OPTIONAL registrado");
  expect(bffApi.post.mock.calls[1][1]).toEqual(bffApi.post.mock.calls[0][1]);
  expect(window.crypto.randomUUID).toHaveBeenCalledTimes(1);
  expect(createDeposit).not.toHaveBeenCalled();
});

test("a coupon already registered with pending requirements can proceed without a second redemption", async () => {
  bffApi.get.mockResolvedValue(envelope({ pendingRewards: [{ id: "synthetic-pending", code: "TEST-OPTIONAL", status: "pending_requirements", requirements: null }] }));
  mount(); await ready();
  fireEvent.change(screen.getByLabelText("Valor do depósito"), { target: { value: "100" } });
  expect(screen.getByText("Cupom TEST-OPTIONAL registrado")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Ativar cupom" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Gerar Pix" }));
  await screen.findByRole("heading", { name: "Pix gerado" });
  expect(bffApi.post).not.toHaveBeenCalled();
  expect(screen.getByText("Cupom TEST-OPTIONAL registrado")).toBeTruthy();
});

test("a rejected coupon shows its API error and allows the user to continue without it", async () => {
  bffApi.post.mockResolvedValue({ data: { success: false, error: { code: "COUPON_EXPIRED", message: "Este cupom expirou." } } });
  mount("/admin/deposit?coupon=TEST-EXPIRED"); await ready();
  expect(screen.queryByText("20 rodadas no Aviator")).toBeNull();
  fireEvent.change(screen.getByLabelText("Valor do depósito"), { target: { value: "100" } });
  fireEvent.click(screen.getByRole("button", { name: "Ativar cupom" }));
  await screen.findByText("Este cupom expirou.");
  expect(createDeposit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Continuar sem cupom" }));
  fireEvent.click(screen.getByRole("button", { name: "Gerar Pix" }));
  await screen.findByRole("heading", { name: "Pix gerado" });
  expect(createDeposit).toHaveBeenCalledWith(100);
});
