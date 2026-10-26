export const TRACKING_KEYS = ["axioAffId", "axioClickId", "utm_campaign", "utm_source", "utm_medium", "utm_content", "utm_term", "landingUrl", "ga_client_id"];

// Public field names are part of the BFF contract; app ownership is established by storage migration.
export function getTrackingParams() {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(TRACKING_KEYS.flatMap(key => {
    let value = params.get(key);
    try { value = value || localStorage.getItem(key); } catch { /* URL tracking still works. */ }
    return value ? [[key, value]] : [];
  }));
}
