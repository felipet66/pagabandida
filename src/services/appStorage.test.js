import { APP_STORAGE_VERSION_KEY, migrateAppStorage, clearAppSession, retireLegacyServiceWorkers } from "./appStorage";
import { testSession } from "../testSupport/fixtures";

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

test("primeira carga remove sessão e chaves da PWA antiga e preserva apenas o namespace do app", () => {
  localStorage.setItem("previous-app", "fixture");
  localStorage.setItem("access_token", testSession);
  localStorage.setItem("pagabandida:preference", "fixture");
  sessionStorage.setItem("pagabandida:legacy-pendingGame", "fixture");
  localStorage.setItem("teleco-pro:preference", "retired");
  sessionStorage.setItem("teleco-pro:pendingGame", "retired");
  migrateAppStorage();
  expect(localStorage.getItem("teleco-pro:preference")).toBeNull();
  expect(sessionStorage.getItem("teleco-pro:pendingGame")).toBeNull();
  expect(localStorage.getItem("previous-app")).toBeNull();
  expect(localStorage.getItem("access_token")).toBeNull();
  expect(localStorage.getItem("pagabandida:preference")).toBe("fixture");
  expect(sessionStorage.getItem("pagabandida:legacy-pendingGame")).toBeNull();
  expect(localStorage.getItem(APP_STORAGE_VERSION_KEY)).toBe("1");
});

test("migração não se repete e logout preserva marcador e atribuição do novo app", () => {
  migrateAppStorage();
  localStorage.setItem("access_token", testSession);
  localStorage.setItem("axioAffId", "current-affiliate");
  migrateAppStorage();
  expect(localStorage.getItem("access_token")).toBe(testSession);
  clearAppSession();
  expect(localStorage.getItem("access_token")).toBeNull();
  expect(localStorage.getItem(APP_STORAGE_VERSION_KEY)).toBe("1");
  expect(localStorage.getItem("axioAffId")).toBe("current-affiliate");
});

test("remove caches e escopos antigos e registra worker de limpeza sem cache HTTP", async () => {
  const unregister = jest.fn().mockResolvedValue(true);
  const serviceWorker = { getRegistrations: jest.fn().mockResolvedValue([{ scope: `${window.location.origin}/old/`, unregister }]), register: jest.fn().mockResolvedValue({}) };
  Object.defineProperty(window, "caches", { configurable: true, value: { keys: jest.fn().mockResolvedValue(["old-cache"]), delete: jest.fn().mockResolvedValue(true) } });
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: serviceWorker });
  try {
    await retireLegacyServiceWorkers();
    expect(window.caches.delete).toHaveBeenCalledWith("old-cache");
    expect(unregister).toHaveBeenCalled();
    expect(serviceWorker.register).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" });
  } finally {
    delete window.caches;
    delete navigator.serviceWorker;
  }
});
