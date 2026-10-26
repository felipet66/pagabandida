export const APP_STORAGE_VERSION_KEY = "pagabandida:storage-version";
const STORAGE_VERSION = "1";
const SESSION_KEYS = ["access_token", "cookie_key", "expires_in", "user_id", "user_name", "user_email", "user_token", "apiToken", "id", "userId", "cpf", "email"];

export function clearAppSession() {
  SESSION_KEYS.forEach(key => localStorage.removeItem(key));
  try { sessionStorage.removeItem("pagabandida:gamification-day"); } catch { /* Storage may be unavailable. */ }
}

export function migrateAppStorage() {
  try {
    if (localStorage.getItem(APP_STORAGE_VERSION_KEY) === STORAGE_VERSION) return;
    // Generic keys from the previous PWA cannot prove ownership, including its session.
    Object.keys(localStorage).filter(key => !key.startsWith("pagabandida:")).forEach(key => localStorage.removeItem(key));
    Object.keys(sessionStorage).filter(key => !key.startsWith("pagabandida:")).forEach(key => sessionStorage.removeItem(key));
    sessionStorage.removeItem("pagabandida:legacy-pendingGame");
    localStorage.setItem(APP_STORAGE_VERSION_KEY, STORAGE_VERSION);
  } catch {
    console.error("Não foi possível limpar o armazenamento do aplicativo anterior.");
  }
}

export async function retireLegacyServiceWorkers() {
  try {
    if ("caches" in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map(key => window.caches.delete(key)));
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.filter(registration => registration.scope !== `${window.location.origin}/`)
        .map(registration => registration.unregister()));
      await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    }
  } catch {
    console.error("Não foi possível remover o service worker anterior.");
  }
}
