import bffApi from "./bffApi";

const base = "api/gamification";
const options = { handleUnauthorized: true, timeout: 12000 };
const responseFailure = body => { const error = new Error(); error.code = body?.error?.code || "INVALID_RESPONSE"; return error; };
export const CHECKIN_DAY_KEY = "pagabandida:gamification-day";
export const GAMIFICATION_EVENT = "gamification-earned";
let activeSession = null;
let attemptedDay = null;
let rateLimitedUntil = 0;

export function getGamificationSession() {
  try { return localStorage.getItem("access_token"); } catch { return null; }
}

export function brasiliaDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = type => parts.find(value => value.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function gamificationError(failure) {
  const code = failure?.response?.data?.error?.code || failure?.code || "UNAVAILABLE";
  const limited = failure?.response?.status === 429 || /RATE_LIMIT|TOO_MANY/.test(code);
  const error = new Error(limited ? "Muitas tentativas. Aguarde um minuto e tente de novo." :
    failure?.response?.status === 401 || /UNAUTHORIZED|TOKEN|AUTH_REQUIRED/.test(code) ? "Entre novamente para ver seu progresso." :
      "Não foi possível carregar a gamificação. Tente de novo.");
  error.code = limited ? "RATE_LIMITED" : code;
  return error;
}

async function request(method, path, data, config = {}) {
  try {
    const response = await bffApi.request({ ...options, ...config, method, url: `${base}/${path}`, data });
    if (response.data?.success !== true || response.data.data == null) {
      throw responseFailure(response.data);
    }
    return response.data.data;
  } catch (failure) { throw gamificationError(failure); }
}

export const gamificationApi = {
  me: async () => {
    const data = await request("get", "me");
    if (!Number.isFinite(data.totalXp) || !Number.isInteger(data.level) || data.level < 1 || data.level > 10 || typeof data.levelName !== "string" ||
        !data.progress || !data.streak || !Array.isArray(data.pending) || !Array.isArray(data.achievements) ||
        data.achievements.some(item => !item || typeof item.id !== "string" || typeof item.name !== "string" || typeof item.description !== "string") ||
        data.pending.some(item => !item || !["achievement", "level_up"].includes(item.type))) throw gamificationError({ code: "INVALID_RESPONSE" });
    return data;
  },
  seen: async () => {
    // /seen can acknowledge without a data payload.
    try { const response = await bffApi.post(`${base}/me/seen`, {}, options); if (!response.data?.success) throw responseFailure(response.data); return true; }
    catch { return false; }
  },
  history: (offset = 0) => request("get", "xp-history", undefined, { params: { limit: 20, offset } }),
  leaderboard: () => request("get", "leaderboard", undefined, { params: { period: "week" } }),
};

export async function dailyCheckin(session, date = new Date()) {
  if (!session) {
    activeSession = null; attemptedDay = null; rateLimitedUntil = 0;
    try { sessionStorage.removeItem(CHECKIN_DAY_KEY); } catch { /* The in-memory guard still resets. */ }
    return null;
  }
  if (activeSession !== session) {
    const changedSession = activeSession !== null;
    // The day persisted in this browser tab is reset by login/logout.
    activeSession = session;
    rateLimitedUntil = 0;
    try {
      if (changedSession) sessionStorage.removeItem(CHECKIN_DAY_KEY);
      attemptedDay = sessionStorage.getItem(CHECKIN_DAY_KEY);
    } catch { attemptedDay = null; }
  }
  const day = brasiliaDay(date);
  if (attemptedDay === day) return null;
  attemptedDay = day; // Also guards concurrent calls and failures when storage is unavailable.
  try { sessionStorage.setItem(CHECKIN_DAY_KEY, day); } catch { /* Memory remains authoritative. */ }
  try { return await request("post", "checkin", {}); } catch { return null; }
}

export const validLessonId = id => typeof id === "string" && /^[A-Za-z0-9._:-]{1,64}$/.test(id);

export async function trackGamification(action, lessonId) {
  if (!getGamificationSession() || Date.now() < rateLimitedUntil ||
      !["lesson_watched", "bankroll_configured", "notifications_enabled"].includes(action) ||
      (action === "lesson_watched" && !validLessonId(lessonId))) return null;
  const session = getGamificationSession();
  try {
    const result = await request("post", "track", { action, ...(action === "lesson_watched" ? { lesson_id: lessonId } : {}) });
    if (session === getGamificationSession()) window.dispatchEvent(new CustomEvent(GAMIFICATION_EVENT, { detail: { result, action } }));
    return result;
  } catch (failure) {
    if (failure.code === "RATE_LIMITED") rateLimitedUntil = Date.now() + 60000;
    return null;
  }
}
