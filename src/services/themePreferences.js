export const THEME_STORAGE_KEY = "pagabandida:theme";
export const MOTION_STORAGE_KEY = "pagabandida:reduce-motion";
export const LIGHT_QUERY = "(prefers-color-scheme: light)";
export const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function readPreference(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function writePreference(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* Preferences still work in memory when storage is unavailable. */ }
}

export const validTheme = value => value === "dark" || value === "light";
export const systemMatches = query => typeof window.matchMedia === "function" && window.matchMedia(query).matches;

export function watchMedia(query, onChange) {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(query);
  const listener = event => onChange(event.matches);
  if (media.addEventListener) media.addEventListener("change", listener);
  else media.addListener?.(listener);
  return () => {
    if (media.removeEventListener) media.removeEventListener("change", listener);
    else media.removeListener?.(listener);
  };
}
