import { testPhone } from "../testSupport/fixtures";
import bffApi from "./bffApi";
import { requestWithdraw } from "./withdrawApi";
jest.mock("./bffApi", () => ({ post: jest.fn() }));
beforeEach(() => bffApi.post.mockReset().mockResolvedValue({ data: { success: true, data: { status: "requested" } } }));

test("envia reais em texto e CPF sem chave ou prefill", async () => {
  const signal = new AbortController().signal;
  await requestWithdraw(20.5, { type: "CPF" }, signal);
  expect(bffApi.post).toHaveBeenCalledWith("api/wallet/withdraw", {
    currency: "BRL", amount: "20.50", methodCode: "PIX", pixKey: { type: "CPF" },
  }, { signal, handleUnauthorized: true });
});

test("outros tipos enviam a chave fornecida em memória e preservam erros do BFF", async () => {
  await requestWithdraw(20, { type: "PHONE", key: testPhone });
  expect(bffApi.post.mock.calls[0][1].pixKey).toEqual({ type: "PHONE", key: testPhone });
  const apiError = { code: "VALIDATION_ERROR", message: "Confira sua chave Pix." };
  bffApi.post.mockResolvedValue({ data: { success: false, error: apiError } });
  await expect(requestWithdraw(20, { type: "CPF" })).rejects.toMatchObject({ apiError });
});

test("valor inválido, tipo desconhecido e chave ausente não fazem chamadas", async () => {
  await expect(requestWithdraw(0, { type: "CPF" })).rejects.toThrow();
  await expect(requestWithdraw(20, { type: "UNKNOWN" })).rejects.toThrow();
  await expect(requestWithdraw(20, { type: "EMAIL" })).rejects.toThrow();
  expect(bffApi.post).not.toHaveBeenCalled();
});
