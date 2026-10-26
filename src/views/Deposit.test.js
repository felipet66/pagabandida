import React from "react";
import { MemoryRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { act, Simulate } from "react-dom/test-utils";
import Deposits, { parseDepositAmount } from "./Deposit";
import useDeposit from "../hooks/useDeposit";
import useDepositSync from "../hooks/useDepositSync";
import Swal from "sweetalert2";
import { useCouponList, useCouponRedemption } from "../hooks/useCoupons";
jest.mock("../hooks/useDeposit", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../hooks/useDepositSync", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("sweetalert2", () => ({ fire: jest.fn() }));
jest.mock("../hooks/useCoupons", () => ({ useCouponList: jest.fn(), useCouponRedemption: jest.fn() }));
let root, host, createDeposit;
const pix = () => ({ transaction: { id: "test", amount: "50.25" }, paymentPayload: { pix_payment: "codigo-pix", expiresAt: new Date(Date.now() + 60000).toISOString() } });
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  useDepositSync.mockReturnValue({ status: "pending", remaining: 60, error: null });
  Swal.fire.mockReset();
  createDeposit = jest.fn(); useDeposit.mockReturnValue({ loading: false, createDeposit });
  useCouponList.mockReturnValue({ items: [], loading: false });
  useCouponRedemption.mockReturnValue({ loading: false, result: null, error: null, resetFeedback: jest.fn(), submit: jest.fn() });
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: jest.fn().mockResolvedValue() } });
  act(() => root.render(<MemoryRouter><Deposits /></MemoryRouter>));
});
afterEach(() => { act(() => root.unmount()); host.remove(); delete global.IS_REACT_ACT_ENVIRONMENT; });
const input = value => act(() => Simulate.change(host.querySelector('#deposit-amount'), { target: { value } }));
const submit = async () => { await act(async () => Simulate.submit(host.querySelector('form'))); };

test.each([['50,25', 50.25], ['1.000,50', 1000.5], ['50.25', 50.25], ['0', 0], ['1,234', 0], ['-50', 0], ['abc', 0]])("interpreta %s corretamente", (text, expected) => {
  expect(parseDepositAmount(text)).toBe(expected);
});

test("valor inválido não envia depósito e direciona o foco para o campo", async () => {
  input('-5'); await submit();
  expect(createDeposit).not.toHaveBeenCalled();
  expect(host.querySelector('[role="alert"]').textContent).toContain('depósito mínimo');
  expect(document.activeElement.id).toBe('deposit-amount');
});

test("mostra valor retornado em reais, gera QR local e copia pix_payment", async () => {
  createDeposit.mockResolvedValue(pix());
  input('50,25'); await submit();
  expect(createDeposit).toHaveBeenCalledWith(50.25);
  expect(host.querySelector('.deposit-payment-value').textContent).toContain('50,25');
  expect(document.activeElement.textContent).toBe('Pix gerado');
  expect(host.querySelector('.deposit-qr svg')).not.toBeNull();
  await act(async () => host.querySelector('.deposit-copy-section button').click());
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('codigo-pix');
  expect(host.querySelector('[role="status"]').textContent).toContain('Código copiado');
});

test("Pix expirado oculta QR e cópia e permite gerar outro Pix", async () => {
  useDepositSync.mockReturnValue({ status: "expired", remaining: 0, error: null });
  createDeposit.mockResolvedValue(pix());
  input('100'); await submit();
  expect(host.querySelector('.deposit-copy-section')).toBeNull();
  expect(host.textContent).toContain('Este Pix expirou');
  act(() => host.querySelector('.deposit-secondary').click());
  expect(host.querySelector('#deposit-amount').value).toBe('100');
  expect(createDeposit).toHaveBeenCalledTimes(1);
});

test("evita solicitações duplicadas e mantém erro visível sem repetir sozinho", async () => {
  let resolve;
  createDeposit.mockImplementation(() => new Promise(done => { resolve = done; }));
  input('50');
  act(() => { Simulate.submit(host.querySelector('form')); Simulate.submit(host.querySelector('form')); });
  expect(createDeposit).toHaveBeenCalledTimes(1);
  await act(async () => resolve(null));
  expect(host.querySelector('[role="alert"]').textContent).toContain('Não foi possível gerar');
  expect(host.querySelector('#deposit-amount').value).toBe('50');
});

test("mostra validação da API junto ao campo de valor", async () => {
  useDeposit.mockReturnValue({ loading: false, createDeposit, error: { message: "Dados inválidos", fields: { amount: "Depósito mínimo de R$ 20,00" } } });
  act(() => root.render(<MemoryRouter><Deposits /></MemoryRouter>));
  expect(host.querySelector('#deposit-error').textContent).toBe('Depósito mínimo de R$ 20,00');
  expect(host.querySelector('#deposit-amount').getAttribute('aria-invalid')).toBe('true');
});

test("Pix sem validade mostra QR e cópia sem cronômetro ou data inválida", async () => {
  useDepositSync.mockReturnValue({ status: "pending", remaining: null, error: null });
  const result = pix(); delete result.paymentPayload.expiresAt;
  createDeposit.mockResolvedValue(result);
  input('50,25'); await submit();
  expect(host.querySelector('.deposit-qr svg')).not.toBeNull();
  expect(host.querySelector('.deposit-copy-section button').disabled).toBe(false);
  expect(host.querySelector('.deposit-validity').textContent).toContain('não foi informada');
  expect(host.textContent).not.toContain('NaN');
  expect(host.textContent).not.toContain('Invalid Date');
});

test("DOCUMENT_REQUIRED mostra mensagem e link da ganhebetBR", () => {
  useDeposit.mockReturnValue({ loading: false, createDeposit, error: { code: "DOCUMENT_REQUIRED", message: "Verifique seu documento antes de depositar." } });
  act(() => root.render(<MemoryRouter><Deposits /></MemoryRouter>));
  expect(host.querySelector('[role="alert"]').textContent).toContain("Verifique seu documento");
  expect(host.querySelector('#deposit-error a').hostname).toBe("www.ganhebetbr.com");
  expect(new URL(host.querySelector('#deposit-error a').href).searchParams.get("axioAffId")).toBe("NLNYO");
});

test("Já paguei usa a sincronização manual e bloqueia cliques durante a consulta", async () => {
  const checkPayment = jest.fn();
  useDepositSync.mockReturnValue({ status: "pending", remaining: 60, error: null, checkPayment, checking: false });
  createDeposit.mockResolvedValue(pix());
  input('50'); await submit();
  const button = Array.from(host.querySelectorAll('button')).find(item => item.textContent === "Já paguei");
  act(() => button.click());
  expect(checkPayment).toHaveBeenCalledTimes(1);
  useDepositSync.mockReturnValue({ status: "pending", remaining: 60, error: null, checkPayment, checking: true });
  act(() => root.render(<MemoryRouter><Deposits /></MemoryRouter>));
  expect(Array.from(host.querySelectorAll('button')).find(item => item.textContent === "Verificando...").disabled).toBe(true);
});


test("destaca o mínimo, sugere valores acessíveis e bloqueia valores abaixo de R$ 5", async () => {
  expect(host.querySelector('#deposit-amount-hint').textContent).toContain('R$ 5,00');
  expect(Array.from(host.querySelectorAll('.deposit-presets button')).map(button => button.textContent.replace(/\s/g, ''))).toEqual(['R$20,00', 'R$50,00', 'R$150,00', 'R$400,00', 'R$800,00', 'R$1.000,00', 'R$2.500,00', 'R$5.000,00']);
  input('4,99'); await submit();
  expect(createDeposit).not.toHaveBeenCalled();
  expect(host.querySelector('[role="alert"]').textContent).toContain('R$ 5,00');
  createDeposit.mockResolvedValue(pix());
  input('5,00');
  await submit();
  expect(createDeposit).toHaveBeenCalledWith(5);
});
