import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import usePixPayment from "./usePixPayment";
import { fetchDepositBalance, clearDepositSession, syncDeposits } from "../services/depositApi";
const mockHistory = { replace: jest.fn() };
jest.mock("react-router-dom", () => ({ useHistory: () => mockHistory }));
jest.mock("../services/depositApi", () => ({ fetchDepositBalance: jest.fn(), clearDepositSession: jest.fn(), syncDeposits: jest.fn() }));
let root, current;
function Harness({ deposit }) { current = usePixPayment(deposit); return null; }
const pix = (seconds = 60) => ({ initialBalance: 10, paymentPayload: { expiresAt: new Date(Date.now() + seconds * 1000).toISOString() } });
const mount = async deposit => { await act(async () => root.render(<Harness deposit={deposit} />)); };
const advance = async ms => { await act(async () => jest.advanceTimersByTime(ms)); };
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true; jest.useFakeTimers();
  root = createRoot(document.createElement("div"));
  fetchDepositBalance.mockReset().mockResolvedValue(10); syncDeposits.mockReset().mockResolvedValue({ confirmed: 2, pending: 1 }); mockHistory.replace.mockReset(); clearDepositSession.mockReset();
});
afterEach(() => { act(() => root.unmount()); jest.useRealTimers(); delete global.IS_REACT_ACT_ENVIRONMENT; });
test("consulta a cada 5 segundos e para quando available aumenta", async () => {
  await mount(pix());
  expect(current.status).toBe("pending");
  expect(current.remaining).toBe(60);
  await advance(5000);
  expect(fetchDepositBalance).toHaveBeenCalledTimes(2);
  fetchDepositBalance.mockResolvedValue(60);
  await advance(5000);
  expect(current.status).toBe("confirmed");
  const calls = fetchDepositBalance.mock.calls.length;
  await advance(10000);
  expect(fetchDepositBalance).toHaveBeenCalledTimes(calls);
});
test("expiração usa expiresAt, aborta chamada pendente e ignora retorno atrasado", async () => {
  let resolve;
  fetchDepositBalance.mockImplementation(() => new Promise(done => { resolve = done; }));
  await mount(pix(3));
  const signal = fetchDepositBalance.mock.calls[0][0];
  await advance(3000);
  expect(current.status).toBe("expired");
  expect(signal.aborted).toBe(true);
  await act(async () => resolve(60));
  expect(current.status).toBe("expired");
  await advance(5000);
  expect(fetchDepositBalance).toHaveBeenCalledTimes(1);
});
test("não sobrepõe consultas e limpa timers e requisição ao fechar Pix", async () => {
  fetchDepositBalance.mockImplementation(() => new Promise(() => {}));
  await mount(pix());
  const signal = fetchDepositBalance.mock.calls[0][0];
  await advance(10000);
  expect(fetchDepositBalance).toHaveBeenCalledTimes(1);
  await mount(null);
  expect(signal.aborted).toBe(true);
  expect(current.status).toBe("idle");
  await advance(10000);
  expect(fetchDepositBalance).toHaveBeenCalledTimes(1);
});
test("falha de rede mantém polling, 401 limpa sessão e vai ao login", async () => {
  fetchDepositBalance.mockRejectedValueOnce(new Error("Network"));
  await mount(pix());
  expect(current.error).toBeNull();
  fetchDepositBalance.mockRejectedValueOnce({ response: { status: 401 } });
  await advance(5000);
  expect(clearDepositSession).toHaveBeenCalledTimes(1);
  expect(mockHistory.replace).toHaveBeenCalledWith("/auth/login");
  const calls = fetchDepositBalance.mock.calls.length;
  await advance(10000);
  expect(fetchDepositBalance).toHaveBeenCalledTimes(calls);
});
test("Pix já expirado não consulta saldo", async () => {
  await mount(pix(-1));
  expect(current.status).toBe("expired");
  expect(fetchDepositBalance).not.toHaveBeenCalled();
});

test("sem expiresAt não inventa prazo e continua polling até confirmar", async () => {
  await mount({ initialBalance: 10, paymentPayload: { pix_payment: "codigo" } });
  expect(current.remaining).toBeNull();
  expect(current.status).toBe("pending");
  await advance(5000);
  expect(fetchDepositBalance).toHaveBeenCalledTimes(2);
  fetchDepositBalance.mockResolvedValue(60);
  await advance(5000);
  expect(current.status).toBe("confirmed");
  expect(current.remaining).toBeNull();
});
