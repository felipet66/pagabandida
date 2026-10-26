import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { randomUUID } from "crypto";
import CouponModal from "./CouponModal";
import bffApi from "../../services/bffApi";
jest.mock("../../services/bffApi", () => ({ get: jest.fn(), post: jest.fn() }));

const envelope = data => ({ data: { success: true, data } });
const pendingPath = "api/coupons/me/pending-rewards";
const historyPath = "api/coupons/me/redemptions";
const pendingReward = {
  id: "synthetic-pending", code: "TEST-PENDING", status: "pending_requirements", currency: "BRL",
  requirementsSummary: { totalRequirements: 1, completedRequirements: 0, nextAction: "deposit" },
  requirements: [{ type: "deposit", status: "pending", progressAmount: "25", targetAmount: "100.000000000000000000", remainingAmount: "75", currency: "BRL", deadlineAt: null }],
};
const rewarded = {
  id: "synthetic-history", code: "TEST-REWARDED", status: "rewarded", currency: "BRL", rewardType: "free_spins_or_free_bet",
  createdAt: "2026-06-25 22:29:43.575613+00", rewardAmount: null,
  rewardDetail: { provider: "dumont", gameSlug: "aviator", quantity: 100, vendorSlug: "spribe", betAmount: "1.00", currency: "BRL" },
};
const mount = props => render(<MemoryRouter><CouponModal open onClose={jest.fn()} {...props} /></MemoryRouter>);
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const originalCrypto = Object.getOwnPropertyDescriptor(window, "crypto");
beforeEach(() => {
  localStorage.clear(); localStorage.setItem("access_token", randomUUID());
  Object.defineProperty(window, "crypto", { configurable: true, value: { randomUUID: jest.fn(randomUUID) } });
  bffApi.get.mockReset(); bffApi.post.mockReset();
  bffApi.get.mockImplementation(path => Promise.resolve(envelope(path === pendingPath ? { pendingRewards: [] } : { redemptions: [] })));
});
afterEach(cleanup);
afterAll(() => { if (originalCrypto) Object.defineProperty(window, "crypto", originalCrypto); else delete window.crypto; });

test("loads pending requirements with real amount progress and the existing deposit route", async () => {
  const request = deferred();
  bffApi.get.mockImplementation(path => path === pendingPath ? request.promise : Promise.resolve(envelope({ redemptions: [] })));
  const onClose = jest.fn(); mount({ onClose });
  expect(screen.getByText(/Carregando recompensas pendentes/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Resgatar" }).disabled).toBe(true);
  await act(async () => request.resolve(envelope({ pendingRewards: [pendingReward] })));
  expect(screen.getByText("TEST-PENDING")).toBeTruthy();
  expect(screen.getByText("0 de 1 requisitos concluídos")).toBeTruthy();
  expect(screen.getByText(/R\$\s*25,00 de R\$\s*100,00/)).toBeTruthy();
  expect(screen.getByText(/Faltam R\$\s*75,00/)).toBeTruthy();
  expect(screen.getByRole("progressbar").value).toBe(25);
  const deposit = screen.getByRole("link", { name: "Ir para depósito" });
  expect(deposit.getAttribute("href")).toBe("/admin/deposit");
  fireEvent.click(deposit); expect(onClose).toHaveBeenCalledTimes(1);
});

test("blocks duplicate submissions, explains pending rewards and refreshes both lists", async () => {
  const request = deferred(); bffApi.post.mockReturnValue(request.promise);
  const balanceChanged = jest.fn(); window.addEventListener("wallet-balance-updated", balanceChanged);
  try {
    mount(); await screen.findByText("Nenhuma recompensa pendente");
    const input = screen.getByLabelText("Código do cupom");
    fireEvent.change(input, { target: { value: " TEST-REDEEM " } });
    const form = input.closest("form");
    fireEvent.submit(form); fireEvent.submit(form);
    expect(bffApi.post).toHaveBeenCalledTimes(1);
    expect(input.disabled).toBe(true);
    expect(screen.getByRole("button", { name: /Resgatando/ }).disabled).toBe(true);
    await act(async () => request.resolve(envelope({ status: "pending_requirements", redemptionId: "synthetic-redemption", expiresAt: null })));
    expect(screen.getByText("Cupom registrado: requisitos pendentes")).toBeTruthy();
    expect(screen.getByText(/A recompensa ainda não foi liberada/)).toBeTruthy();
    await waitFor(() => expect(bffApi.get).toHaveBeenCalledTimes(4));
    expect(bffApi.get.mock.calls.filter(([path]) => path === historyPath)).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Resgatar" }).disabled).toBe(true);
    fireEvent.submit(form); expect(bffApi.post).toHaveBeenCalledTimes(1);
    expect(balanceChanged).toHaveBeenCalledTimes(1);
    fireEvent.change(input, { target: { value: "TEST-NEXT" } });
    bffApi.post.mockResolvedValue(envelope({ status: "rewarded" }));
    fireEvent.submit(form); await screen.findByText("Resgate registrado");
    expect(bffApi.post.mock.calls[1][1].idempotencyKey).not.toBe(bffApi.post.mock.calls[0][1].idempotencyKey);
  } finally { window.removeEventListener("wallet-balance-updated", balanceChanged); }
});

test("retries an uncertain network request with the same UUID after closing and reopening", async () => {
  bffApi.post.mockRejectedValueOnce({ code: "ERR_NETWORK" }).mockResolvedValueOnce(envelope({ status: "pending_requirements" }));
  const onClose = jest.fn(); const view = mount({ onClose });
  await screen.findByText("Nenhuma recompensa pendente");
  fireEvent.change(screen.getByLabelText("Código do cupom"), { target: { value: "TEST-RETRY" } });
  fireEvent.click(screen.getByRole("button", { name: "Resgatar" }));
  await screen.findByText(/O resultado ainda não foi confirmado/);
  view.rerender(<MemoryRouter><CouponModal open={false} onClose={onClose} /></MemoryRouter>);
  expect(screen.queryByRole("dialog")).toBeNull();
  view.rerender(<MemoryRouter><CouponModal open onClose={onClose} /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await screen.findByText("Cupom registrado: requisitos pendentes");
  expect(bffApi.post.mock.calls[1][1]).toEqual(bffApi.post.mock.calls[0][1]);
  expect(window.crypto.randomUUID).toHaveBeenCalledTimes(1);
});

test("paginates lists independently and displays the supplied reward detail and localized timestamp", async () => {
  bffApi.get.mockImplementation((path, { params }) => Promise.resolve(envelope(path === pendingPath ? {
    pendingRewards: params.offset === 0 ? Array.from({ length: 50 }, (_, index) => ({ id: `synthetic-${index}`, code: `TEST-${index}`, status: "pending_requirements" })) : [pendingReward],
    total: 51,
  } : { redemptions: [rewarded] })));
  mount(); await screen.findByText("TEST-0");
  fireEvent.click(screen.getByRole("button", { name: "Próxima página: recompensas pendentes" }));
  await screen.findByText("TEST-PENDING");
  expect(bffApi.get).toHaveBeenLastCalledWith(pendingPath, expect.objectContaining({ params: { limit: 50, offset: 50 } }));
  expect(screen.getByRole("button", { name: "Próxima página: recompensas pendentes" }).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Histórico", exact: true }));
  expect(screen.getByText("Recompensa concedida")).toBeTruthy();
  expect(screen.getByText("25/06/2026, 19:29")).toBeTruthy();
  expect(screen.getByText("Apostas ou rodadas grátis")).toBeTruthy();
  expect(screen.getByText("100")).toBeTruthy();
  expect(screen.getByText(/R\$\s*1,00/)).toBeTruthy();
  expect(screen.getByText("Aviator")).toBeTruthy();
  expect(screen.getByText("Spribe")).toBeTruthy();
  expect(screen.queryByText(/100,00/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Pendências" }));
  expect(screen.getByText("Página 2")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Página anterior: recompensas pendentes" }));
  await screen.findByText("TEST-0");
  expect(bffApi.get).toHaveBeenLastCalledWith(pendingPath, expect.objectContaining({ params: { limit: 50, offset: 0 } }));
});

test("renders list errors, allows retry, and handles empty or nullable records", async () => {
  bffApi.get.mockRejectedValueOnce({ response: { status: 503 } });
  mount();
  expect(await screen.findByRole("alert")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await screen.findByText("Nenhuma recompensa pendente");
  bffApi.get.mockResolvedValue(envelope({ redemptions: [null, { id: "nullable", status: null, code: null, createdAt: null, rewardDetail: null }] }));
  fireEvent.click(screen.getByRole("button", { name: "Histórico", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Atualizar histórico de resgates" }));
  await screen.findByText("Código indisponível");
  expect(screen.getByText("Data não informada")).toBeTruthy();
  expect(screen.getByText("Status indisponível")).toBeTruthy();
  expect(screen.getByText("Detalhes da recompensa não informados.")).toBeTruthy();
});

test("shows business errors without success feedback and session errors with login access", async () => {
  bffApi.post.mockResolvedValue(envelope({}));
  bffApi.post.mockResolvedValueOnce({ data: { success: false, error: { message: "Cupom inválido.", code: "INVALID_CODE", details: [{ field: "code", message: "Confira o código informado." }] } } });
  mount(); await screen.findByText("Nenhuma recompensa pendente");
  fireEvent.change(screen.getByLabelText("Código do cupom"), { target: { value: "TEST-INVALID" } });
  fireEvent.click(screen.getByRole("button", { name: "Resgatar" }));
  await screen.findByText("Confira o código informado.");
  expect(screen.queryByText("Resgate registrado")).toBeNull();
  expect(bffApi.get).toHaveBeenCalledTimes(2);
  bffApi.post.mockRejectedValueOnce({ response: { status: 401 } });
  fireEvent.click(screen.getByRole("button", { name: "Resgatar" }));
  const login = await screen.findByRole("link", { name: "Entrar novamente" });
  expect(login.getAttribute("href")).toBe("/auth/login");
  expect(localStorage.getItem("access_token")).toBeNull();
});

test("keeps focus in the dialog, restores it on close, and cancels list requests on unmount", async () => {
  const host = document.createElement("div"); host.id = "root"; document.body.appendChild(host);
  const trigger = document.createElement("button"); host.appendChild(trigger); trigger.focus();
  const onClose = jest.fn(); const view = mount({ onClose });
  await screen.findByText("Nenhuma recompensa pendente");
  expect(host.inert).toBe(true);
  expect(document.activeElement).toBe(screen.getByLabelText("Código do cupom"));
  const controls = within(screen.getByRole("dialog")).getAllByRole("button");
  const lastEnabled = controls.filter(button => !button.disabled).pop();
  lastEnabled.focus(); fireEvent.keyDown(document, { key: "Tab" });
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Fechar modal de cupons" }));
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(lastEnabled);
  fireEvent.keyDown(document, { key: "Escape" }); expect(onClose).toHaveBeenCalledTimes(1);
  const signals = bffApi.get.mock.calls.map(([, config]) => config.signal);
  view.unmount();
  expect(signals.every(signal => signal.aborted)).toBe(true);
  expect(host.inert).not.toBe(true);
  expect(document.activeElement).toBe(trigger);
  host.remove();
});

test("does not request any data until opened", () => {
  mount({ open: false });
  expect(bffApi.get).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).toBeNull();
});
