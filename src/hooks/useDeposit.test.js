import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import useDeposit from "./useDeposit";
import { fetchDepositBalance, requestDeposit, clearDepositSession } from "../services/depositApi";
const mockHistory = { replace: jest.fn() };
jest.mock("react-router-dom", () => ({ useHistory: () => mockHistory }));
jest.mock("../services/depositApi", () => ({ fetchDepositBalance: jest.fn(), requestDeposit: jest.fn(), clearDepositSession: jest.fn(), depositError: () => ({ message: "Tente novamente", fields: {} }) }));
let root, current;
function Harness() { current = useDeposit(); return null; }
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  fetchDepositBalance.mockReset().mockResolvedValue(10); requestDeposit.mockReset(); clearDepositSession.mockReset(); mockHistory.replace.mockReset();
  root = createRoot(document.createElement("div"));
  await act(async () => root.render(<Harness />));
});
afterEach(() => { act(() => root.unmount()); delete global.IS_REACT_ACT_ENVIRONMENT; });
test("captura saldo antes do Pix e impede criação duplicada", async () => {
  let resolve;
  requestDeposit.mockImplementation(() => new Promise(done => { resolve = done; }));
  act(() => { current.createDeposit(50); current.createDeposit(50); });
  await act(async () => {});
  expect(fetchDepositBalance).toHaveBeenCalledTimes(1);
  expect(requestDeposit).toHaveBeenCalledTimes(1);
  expect(fetchDepositBalance.mock.invocationCallOrder[0]).toBeLessThan(requestDeposit.mock.invocationCallOrder[0]);
  await act(async () => resolve({ transaction: { id: "test" } }));
  expect(current.data.initialBalance).toBe(10);
});
test("POST com falha não é repetido automaticamente", async () => {
  requestDeposit.mockRejectedValue(new Error("Network"));
  await act(async () => current.createDeposit(50));
  expect(current.error.message).toBe("Tente novamente");
  expect(requestDeposit).toHaveBeenCalledTimes(1);
  expect(current.loading).toBe(false);
});
test("401 no saldo inicial limpa sessão e impede emissão de Pix", async () => {
  fetchDepositBalance.mockRejectedValue({ response: { status: 401 } });
  await act(async () => current.createDeposit(50));
  expect(requestDeposit).not.toHaveBeenCalled();
  expect(clearDepositSession).toHaveBeenCalled();
  expect(mockHistory.replace).toHaveBeenCalledWith("/auth/login");
});
