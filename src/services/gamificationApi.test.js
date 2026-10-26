import bffApi from "./bffApi";
import { brasiliaDay, dailyCheckin, CHECKIN_DAY_KEY, gamificationApi, trackGamification, validLessonId } from "./gamificationApi";
import { testSession, newTestSession } from "../testSupport/fixtures";
import { success } from "../testSupport/gamificationFixtures";
jest.mock("./bffApi", () => ({ request: jest.fn(), post: jest.fn() }));
beforeEach(async () => { jest.clearAllMocks(); localStorage.clear(); sessionStorage.clear(); await dailyCheckin(null); bffApi.request.mockResolvedValue(success({ xpEarned: 20 })); });
afterEach(() => jest.restoreAllMocks());

test("uma chamada por dia da sessão, antes e depois da meia-noite de Brasília", async () => {
  expect(brasiliaDay(new Date("2026-10-14T02:59:59Z"))).toBe("2026-10-13");
  await Promise.all([dailyCheckin(testSession, new Date("2026-10-14T02:59:59Z")), dailyCheckin(testSession, new Date("2026-10-14T02:59:59Z"))]);
  await dailyCheckin(testSession, new Date("2026-10-14T03:00:00Z"));
  await dailyCheckin(testSession, new Date("2026-10-14T03:01:00Z"));
  expect(bffApi.request).toHaveBeenCalledTimes(2);
  expect(sessionStorage.getItem(CHECKIN_DAY_KEY)).toBe("2026-10-14");
});
test("o dia persistido evita check-in ao remontar e a nova sessão pode começar", async () => {
  sessionStorage.setItem(CHECKIN_DAY_KEY, brasiliaDay());
  expect(await dailyCheckin(testSession)).toBeNull();
  await dailyCheckin(null); sessionStorage.removeItem(CHECKIN_DAY_KEY);
  await dailyCheckin(newTestSession);
  expect(bffApi.request).toHaveBeenCalledTimes(1);
});
test("troca de sessão autenticada no mesmo dia permite o check-in da outra sessão", async () => {
  await dailyCheckin(testSession); await dailyCheckin(newTestSession); await dailyCheckin(newTestSession);
  expect(bffApi.request).toHaveBeenCalledTimes(2);
});
test("falha de armazenamento usa memória, e falha de check-in é silenciosa sem repetir", async () => {
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error(); });
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error(); });
  bffApi.request.mockRejectedValue(new Error());
  expect(await dailyCheckin(testSession)).toBeNull();
  expect(await dailyCheckin(testSession)).toBeNull();
  expect(bffApi.request).toHaveBeenCalledTimes(1);
});
test.each(["", "a/b", "id com espaço", "x".repeat(65), null, 3])("bloqueia lesson_id inválido (%s)", async id => {
  localStorage.setItem("access_token", testSession);
  expect(validLessonId(id)).toBe(false);
  expect(await trackGamification("lesson_watched", id)).toBeNull();
  expect(bffApi.request).not.toHaveBeenCalled();
});
test("track manda somente ação e id estável; falha e ação inválida são silenciosas", async () => {
  localStorage.setItem("access_token", testSession);
  await trackGamification("lesson_watched", "youtube:example_1-2.3");
  expect(bffApi.request).toHaveBeenCalledWith(expect.objectContaining({ method: "post", url: "api/gamification/track", data: { action: "lesson_watched", lesson_id: "youtube:example_1-2.3" }, handleUnauthorized: true }));
  bffApi.request.mockRejectedValue(new Error());
  expect(await trackGamification("bankroll_configured")).toBeNull();
  expect(await trackGamification("deposit")).toBeNull();
});
test("429 silencioso suspende track por um minuto, e GET mostra erro com código", async () => {
  localStorage.setItem("access_token", testSession);
  let now = 100000;
  jest.spyOn(Date, "now").mockImplementation(() => now);
  bffApi.request.mockRejectedValue({ response: { status: 429, data: { error: { code: "TOO_MANY_REQUESTS" } } } });
  expect(await trackGamification("bankroll_configured")).toBeNull();
  await trackGamification("bankroll_configured");
  expect(bffApi.request).toHaveBeenCalledTimes(1);
  now += 60001; await trackGamification("bankroll_configured");
  expect(bffApi.request).toHaveBeenCalledTimes(2);
  await expect(gamificationApi.me()).rejects.toMatchObject({ code: "RATE_LIMITED" });
});
test("429 lógico do envelope é reconhecido", async () => {
  bffApi.request.mockResolvedValue({ data: { success: false, error: { code: "RATE_LIMIT_EXCEEDED" } } });
  await expect(gamificationApi.me()).rejects.toMatchObject({ code: "RATE_LIMITED" });
});
test("resposta de perfil malformada vira erro recuperável", async () => {
  bffApi.request.mockResolvedValue(success({ totalXp: 0, level: 1, levelName: "Aprendiz", progress: {}, streak: {}, pending: [], achievements: [null] }));
  await expect(gamificationApi.me()).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
});
test("histórico, semana e visto usam o contrato; visto tolera falha", async () => {
  await gamificationApi.history(20); await gamificationApi.leaderboard();
  expect(bffApi.request).toHaveBeenCalledWith(expect.objectContaining({ params: { offset: 20, limit: 20 } }));
  expect(bffApi.request).toHaveBeenCalledWith(expect.objectContaining({ params: { period: "week" } }));
  bffApi.post.mockResolvedValue({ data: { success: true } }); expect(await gamificationApi.seen()).toBe(true);
  bffApi.post.mockRejectedValue(new Error()); expect(await gamificationApi.seen()).toBe(false);
});
