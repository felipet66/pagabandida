import bffApi from "./bffApi";
import { requestDeposit, fetchDepositBalance, depositError, syncDeposits } from "./depositApi";
jest.mock("./bffApi", () => ({ get: jest.fn(), post: jest.fn() }));
const data = { transaction: { id: "test", amount: "50.000000000000000000" }, paymentPayload: { pix_payment: "00020126test", expiresAt: "2026-10-11T12:00:00Z" } };
beforeEach(() => { bffApi.post.mockReset(); bffApi.get.mockReset(); });
test("sincronização envia POST sem corpo e preserva confirmed e pending", async () => {
  const result = { confirmed: 2, pending: 1 };
  bffApi.post.mockResolvedValue({ data: { success: true, data: result } });
  const signal = new AbortController().signal;
  expect(await syncDeposits(signal)).toEqual(result);
  expect(bffApi.post).toHaveBeenCalledWith("api/wallet/deposits/sync", undefined, { signal, handleUnauthorized: true, timeout: 12000 });
});
test("envia valor em reais como texto para a nova rota, sem campos antigos", async () => {
  bffApi.post.mockResolvedValue({ data: { success: true, data } });
  const signal = new AbortController().signal;
  expect(await requestDeposit(50, signal)).toEqual(data);
  expect(bffApi.post).toHaveBeenCalledWith("api/wallet/deposit", { amount: "50.00", currency: "BRL", methodCode: "PIX" }, { signal, handleUnauthorized: true });
});
test("saldo usa BRL e available sem converter centavos", async () => {
  bffApi.get.mockResolvedValue({ data: { success: true, data: { balances: [{ currency: "USD", available: "99" }, { currency: "BRL", available: "10.25" }] } } });
  expect(await fetchDepositBalance()).toBe(10.25);
});
test("erros de validação preservam mensagem e erro do campo; 5xx usa mensagem segura", async () => {
  const failure = { response: { status: 400, data: { error: { code: "VALIDATION_ERROR", message: "Dados inválidos", details: [{ field: "amount", message: "Valor abaixo do mínimo" }] } } } };
  expect(depositError(failure)).toEqual({ code: "VALIDATION_ERROR", message: "Dados inválidos", fields: { amount: "Valor abaixo do mínimo" } });
  expect(depositError({ response: { status: 500, data: { error: { message: "Internal" } } } }).message).toBe("Não foi possível gerar o Pix. Tente novamente.");
  bffApi.post.mockResolvedValue({ data: { success: false, error: { message: "Valor abaixo do mínimo" } } });
  await expect(requestDeposit(1)).rejects.toThrow("Valor abaixo do mínimo");
});

test("aceita a resposta real sem expiresAt e preserva valor em reais e código Pix", async () => {
  const actual = { transaction: { id: "test", status: "awaiting_payment", amount: "50.000000000000000000", currency: "BRL", methodCode: "PIX" }, paymentPayload: { type: "pix", pix_payment: "00020126test" } };
  bffApi.post.mockResolvedValue({ data: { success: true, data: actual } });
  expect(await requestDeposit(50)).toEqual(actual);
});

test("DOCUMENT_REQUIRED preserva a mensagem da casa e o código", () => {
  const failure = { response: { status: 422, data: { error: { code: "DOCUMENT_REQUIRED", message: "Verifique seu documento antes de depositar." } } } };
  expect(depositError(failure)).toMatchObject({ code: "DOCUMENT_REQUIRED", message: failure.response.data.error.message });
});
