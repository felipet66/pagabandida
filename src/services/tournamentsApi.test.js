import bffApi from './bffApi';
import { formatTournamentDate, getTournament, groupTournamentPrizes, listTournaments, tournamentCountdown, tournamentError } from './tournamentsApi';
import { testSession } from '../testSupport/fixtures';
jest.mock('./bffApi', () => ({ get: jest.fn() }));
const id = '6828d2cf-6666-41ba-a5a5-9eed8bff5505';
const tournament = { id, name: '🏆 Torneio', description: 'R$20.000', participantCount: 2, status: 'live' };
beforeEach(() => { jest.clearAllMocks(); localStorage.setItem('access_token', testSession); });
test('lista autenticada mantém o contrato e usa cancelamento sem enviar ids de usuário', async () => {
  bffApi.get.mockResolvedValue({ data: { success: true, data: { tournaments: [tournament] } } });
  const controller = new AbortController();
  expect(await listTournaments(controller.signal)).toEqual([tournament]);
  expect(bffApi.get).toHaveBeenCalledWith('api/tournaments', { signal: controller.signal, timeout: 12000, handleUnauthorized: true });
});
test('sem sessão e UUID inválido não chamam o BFF', async () => {
  await expect(getTournament('not-a-uuid')).rejects.toMatchObject({ status: 400 });
  localStorage.removeItem('access_token');
  await expect(listTournaments()).rejects.toMatchObject({ status: 401 });
  expect(bffApi.get).not.toHaveBeenCalled();
});
test('respostas inesperadas são contidas e status desconhecidos são preservados', async () => {
  bffApi.get.mockResolvedValueOnce({ data: { success: true, data: { tournaments: null } } });
  await expect(listTournaments()).rejects.toMatchObject({ status: 502 });
  const detail = { ...tournament, status: 'new-house-status', games: [], prizes: [], leaderboard: { topEntries: [], myEntry: null } };
  bffApi.get.mockResolvedValueOnce({ data: { success: true, data: { tournament: detail } } });
  expect(await getTournament(id)).toEqual(detail);
});
test.each([400, 401, 403, 501, 502])('preserva status %i e código do erro', async status => {
  bffApi.get.mockRejectedValue({ response: { status, data: { error: { code: 'HOUSE_ERROR' } } } });
  await expect(listTournaments()).rejects.toMatchObject({ status, code: 'HOUSE_ERROR' });
  expect(tournamentError({ status }).message).toBeTruthy();
});
test('UTC com espaço e offset curto converte para Brasília e conta o prazo', () => {
  expect(formatTournamentDate('2026-10-13 03:00:00+00')).toBe('13/10/2026, 00:00:00');
  expect(formatTournamentDate('2026-10-14 02:59:59.999+00')).toBe('13/10/2026, 23:59:59');
  expect(formatTournamentDate('bad')).toBe('Data indisponível');
  expect(tournamentCountdown('2026-10-14 03:00:00+00', Date.parse('2026-10-13T01:58:58Z'))).toBe('1d 01h 01m 02s');
  expect(tournamentCountdown('2026-10-13 03:00:00+00', Date.parse('2026-10-13T03:00:00Z'))).toBe('Encerrado');
});
test('agrupa apenas posições consecutivas com o mesmo valor, moeda e recompensa', () => {
  const prize = rank => ({ rank, amount: 100, currency: 'BRL', rewardType: 'real_balance_credit' });
  const prizes = [prize(11), prize(12), prize(13), { ...prize(14), amount: 50 }, prize(16)];
  expect(groupTournamentPrizes(prizes).map(p => [p.start, p.end])).toEqual([[11, 13], [14, 14], [16, 16]]);
  expect(prizes[0]).not.toHaveProperty('start');
});
