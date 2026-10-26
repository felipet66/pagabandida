import useDepositSync from "./useDepositSync";

// Compatibility for existing consumers: confirmation is now handled by sync + balance.
export default function usePixPayment(deposit) {
  return useDepositSync(deposit);
}
