import { makeFixtureUrl, testSession } from "../testSupport/fixtures";
jest.mock("sweetalert2", () => ({ fire: jest.fn() }));

const loadApi = (key, url) => {
  if (key === undefined) delete process.env.REACT_APP_APP_KEY;
  else process.env.REACT_APP_APP_KEY = key;
  if (url === undefined) delete process.env.REACT_APP_BFF_URL;
  else process.env.REACT_APP_BFF_URL = url;
  let api;
  jest.isolateModules(() => { api = require("./bffApi").default; });
  return api;
};
let log;
beforeEach(() => { log = jest.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => {
  log.mockRestore();
  process.env.REACT_APP_APP_KEY = testSession;
  process.env.REACT_APP_BFF_URL = makeFixtureUrl();
});

test.each([[undefined, true, "REACT_APP_APP_KEY"], [true, undefined, "REACT_APP_BFF_URL"], [" ", true, "REACT_APP_APP_KEY"]])(
  "configuração ausente bloqueia o adapter antes de qualquer chamada", async (key, url, missing) => {
    const api = loadApi(key === true ? testSession : key, url === true ? makeFixtureUrl() : url);
    const adapter = jest.fn();
    await expect(api.get("api/games/catalog", { publicRequest: true, adapter })).rejects.toMatchObject({ code: "BFF_CONFIGURATION_MISSING" });
    expect(adapter).not.toHaveBeenCalled();
    expect(log.mock.calls[0][0]).toContain(missing);
    expect(log.mock.calls[0][0]).not.toContain(testSession);
  }
);

test("configuração válida usa somente a chave e URL fornecidas no ambiente", async () => {
  const url = makeFixtureUrl();
  const api = loadApi(testSession, url);
  const adapter = jest.fn(async config => ({ config, status: 200, statusText: "OK", headers: {}, data: {} }));
  await api.get("api/games/catalog", { publicRequest: true, adapter });
  expect(adapter.mock.calls[0][0].baseURL).toBe(url);
  expect(adapter.mock.calls[0][0].headers.get("X-App-Key")).toBe(testSession);
  expect(log).not.toHaveBeenCalled();
});

test("cupons enviam a chave configurada e o Bearer da sessão nos três endpoints", async () => {
  const api = loadApi(testSession, makeFixtureUrl());
  const token = testSession;
  localStorage.setItem("access_token", token);
  const adapter = jest.fn(async config => ({ config, status: 200, statusText: "OK", headers: {}, data: { success: true, data: {} } }));
  try {
    await api.post("api/coupons/redeem", { code: "TEST-COUPON" }, { adapter });
    await api.get("api/coupons/me/pending-rewards", { adapter });
    await api.get("api/coupons/me/redemptions", { adapter });
    expect(adapter).toHaveBeenCalledTimes(3);
    adapter.mock.calls.forEach(([config]) => {
      expect(config.headers.get("X-App-Key")).toBe(testSession);
      expect(config.headers.get("Authorization")).toBe(`Bearer ${token}`);
    });
  } finally { localStorage.removeItem("access_token"); }
});
