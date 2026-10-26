// Synthetic values are generated at runtime; never put real credentials or personal data in tests.
const value = () => Math.random().toString(36).slice(2);
export const testSession = value();
export const newTestSession = value();
export const testCookie = value();
export const testPassword = value();
export const testEmail = `${value()}@example.invalid`;
export const testName = value();
export const testCpf = "0".repeat(11);
export const testPhone = "0".repeat(11);
export const makeFixtureUrl = () => new URL(`/${value()}`, ["https:", "", "example.invalid"].join("/")).href;
