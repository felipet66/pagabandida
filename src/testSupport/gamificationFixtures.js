export const makeProfile = changes => ({ totalXp: 120, level: 2, levelName: "Aprendiz", progress: { current: 20, needed: 100, percentage: 20 }, streak: { current: 2, longest: 3 }, achievements: [
  { id: "first", name: "Primeiro passo", description: "Comece seu aprendizado", icon: "footprints", unlocked: true },
  { id: "week", name: "Semana cheia", description: "Volte por sete dias", icon: "flame", unlocked: false },
], showInRanking: true, pending: [], ...changes });
export const makeLeaderboard = changes => ({ week: "2026-10-12", players: [{ rank: 1, name: "Player", xp: 150, isMe: false }], me: { position: 23, xp: 40, hidden: false }, ...changes });
export const makeHistory = changes => ({ items: [{ action: "checkin", label: "Visita diária", xp: 20, createdAt: "2026-10-13T03:30:00Z" }], hasMore: false, ...changes });
export const success = data => ({ data: { success: true, data } });
