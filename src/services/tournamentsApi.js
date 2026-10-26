import bffApi from "./bffApi";

export const isTournamentId = id => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export const tournamentDate = value => {
  if (typeof value !== "string") return new Date(NaN);
  return new Date(value.trim().replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"));
};
export const formatTournamentDate = value => {
  const date = tournamentDate(value);
  return Number.isNaN(date.getTime()) ? "Data indisponível" : date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
};
export function tournamentCountdown(value, now = Date.now()) {
  const end = tournamentDate(value).getTime();
  if (!Number.isFinite(end)) return "Prazo indisponível";
  if (end <= now) return "Encerrado";
  const seconds = Math.ceil((end - now) / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds / 3600) % 24;
  const minutes = Math.floor(seconds / 60) % 60;
  return `${days ? `${days}d ` : ""}${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds % 60).padStart(2, "0")}s`;
}
export const tournamentMoney = (amount, currency = "BRL") => {
  try { return amount.toLocaleString("pt-BR", { style: "currency", currency }); }
  catch { return `${amount.toLocaleString("pt-BR")} ${currency}`; }
};
export function groupTournamentPrizes(prizes = []) {
  return prizes.reduce((groups, prize) => {
    const previous = groups[groups.length - 1];
    if (previous && previous.end + 1 === prize.rank && previous.amount === prize.amount && previous.currency === prize.currency && previous.rewardType === prize.rewardType) previous.end = prize.rank;
    else groups.push({ ...prize, start: prize.rank, end: prize.rank });
    return groups;
  }, []);
}
export function tournamentError(failure) {
  const status = failure.response?.status || failure.status;
  const code = failure.response?.data?.error?.code || failure.code;
  const message = status === 401 ? "Entre novamente para ver os torneios." :
    status === 403 || code === "BFF_CONFIGURATION_MISSING" ? "Não foi possível acessar os torneios. Verifique a configuração do aplicativo." :
      status === 400 ? "Não foi possível consultar este torneio. Volte para a lista e tente novamente." :
        status === 501 ? "Esta casa ainda não disponibiliza torneios." : "Tente novamente em instantes.";
  return Object.assign(new Error(message), { status, code });
}
const validTournament = item => item && isTournamentId(item.id) && typeof item.name === "string" && typeof item.description === "string" && Number.isFinite(item.participantCount) && item.participantCount >= 0;
const validEntry = entry => entry && Number.isInteger(entry.rank) && entry.rank > 0 && Number.isFinite(entry.score) && typeof entry.displayName === "string";
const invalidResponse = () => Object.assign(new Error("Resposta inválida"), { status: 502 });
async function request(path, signal) {
  if (!localStorage.getItem("access_token")) throw tournamentError({ status: 401 });
  try {
    const { data: body } = await bffApi.get(path, { signal, timeout: 12000, handleUnauthorized: true });
    if (body?.success !== true || !body.data) throw Object.assign(invalidResponse(), { code: body?.error?.code });
    return body.data;
  } catch (error) { throw tournamentError(error); }
}
export async function listTournaments(signal) {
  const data = await request("api/tournaments", signal);
  if (!Array.isArray(data.tournaments) || data.tournaments.some(item => !validTournament(item))) throw tournamentError(invalidResponse());
  return data.tournaments;
}
export async function getTournament(id, signal) {
  if (!isTournamentId(id)) throw tournamentError({ status: 400 });
  const { tournament } = await request(`api/tournaments/${id}`, signal);
  if (!validTournament(tournament) || tournament.id !== id || !Array.isArray(tournament.games) || tournament.games.some(slug => typeof slug !== "string" || !/^[^/\s]+\/[^/\s]+$/.test(slug)) ||
      !Array.isArray(tournament.prizes) || tournament.prizes.some(prize => !prize || !Number.isInteger(prize.rank) || prize.rank < 1 || !Number.isFinite(prize.amount) || prize.amount < 0 || typeof prize.currency !== "string") ||
      !Array.isArray(tournament.leaderboard?.topEntries) || tournament.leaderboard.topEntries.some(entry => !validEntry(entry)) ||
      (tournament.leaderboard.myEntry != null && !validEntry(tournament.leaderboard.myEntry))) throw tournamentError(invalidResponse());
  return tournament;
}
