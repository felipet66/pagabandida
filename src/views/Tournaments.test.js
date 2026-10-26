import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Tournaments from './Tournaments';
import { TournamentsProvider, useTournaments } from '../contexts/TournamentsContext';
import { getTournament, listTournaments } from '../services/tournamentsApi';
import { takePendingGame } from '../services/pendingGame';
import { testSession } from '../testSupport/fixtures';
jest.mock('../services/tournamentsApi', () => ({ ...jest.requireActual('../services/tournamentsApi'), getTournament: jest.fn(), listTournaments: jest.fn() }));
const id = '6828d2cf-6666-41ba-a5a5-9eed8bff5505';
const item = { id, name: '🏆 TORNEIO AVIATOR', description: 'R$20.000 para Top 100. Cada R$1 soma 50 pontos.', participantCount: 712, joined: true, status: 'live', startsAt: '2099-10-13 03:00:00+00', endsAt: '2099-10-14 02:59:59.999+00' };
const detail = { ...item, games: ['spribe/aviator'], prizes: [11, 12, 13].map(rank => ({ rank, amount: 100, currency: 'BRL', rewardType: 'real_balance_credit' })), leaderboard: { topEntries: [{ rank: 1, displayName: 'EME*****', score: 420400, isMe: false }], myEntry: { rank: 150, displayName: 'ME*****', score: 50, isMe: true } } };
function MenuProbe() { const { unsupported } = useTournaments(); return unsupported ? null : <span>Menu de torneios</span>; }
function mount(path = '/admin/torneios') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: console.log, warn: console.warn, error: () => {} } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><TournamentsProvider><MenuProbe /><Route exact path='/admin/torneios/:tournamentId?' component={Tournaments} /><Route path='/auth/login'>Login da casa</Route><Route path='/admin/jogos'>Catálogo</Route></TournamentsProvider></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => { jest.clearAllMocks(); localStorage.setItem('access_token', testSession); listTournaments.mockResolvedValue([item]); getTournament.mockResolvedValue(detail); });
afterEach(() => { jest.useRealTimers(); });
test('cards com nome, prêmio, participação e link para detalhes', async () => {
  mount(); await screen.findByText(item.name);
  expect(screen.getByText('Participando')).toBeTruthy(); expect(screen.getByText('R$20.000')).toBeTruthy(); expect(screen.getByText('712 participantes')).toBeTruthy();
  fireEvent.click(screen.getByRole('link', { name: `Ver torneio ${item.name}` }));
  await screen.findByText('EME*****'); expect(screen.getByText('Você: Nº 150')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Participar' })).toBeNull();
});
test('detalhes mostram posição fora do top e agrupam faixas; Jogar usa games[0] no catálogo', async () => {
  mount(`/admin/torneios/${id}`); await screen.findByText('EME*****');
  expect(screen.getByText('420.400')).toBeTruthy(); expect(screen.getByText('50 pontos')).toBeTruthy();
  fireEvent.click(screen.getByRole('tab', { name: 'Prêmios' }));
  expect(screen.getByText('11º ao 13º lugar')).toBeTruthy(); expect(screen.getByText('R$ 100,00', { exact: false })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Jogar' }));
  expect(screen.getByText('Catálogo')).toBeTruthy(); expect(takePendingGame()).toMatchObject({ launchSlug: 'spribe/aviator' });
});
test('destaca a linha do usuário e não duplica a posição', async () => {
  getTournament.mockResolvedValue({ ...detail, leaderboard: { topEntries: [{ ...detail.leaderboard.topEntries[0], isMe: true }], myEntry: null } });
  const { container } = mount(`/admin/torneios/${id}`); await screen.findByText('Você');
  expect(container.querySelector('tr.is-me')).toBeTruthy(); expect(screen.queryByText('Você ainda não pontuou')).toBeNull();
});
test('ranking vazio, prêmios vazios e status desconhecido são tratados', async () => {
  getTournament.mockResolvedValue({ ...detail, status: 'future-status', games: [], prizes: [], leaderboard: { topEntries: [], myEntry: null } });
  mount(`/admin/torneios/${id}`); await screen.findByText('Você ainda não pontuou');
  expect(screen.getByText('Não disponível')).toBeTruthy(); expect(screen.getByRole('button', { name: 'Jogar' }).disabled).toBe(true);
  fireEvent.click(screen.getByRole('tab', { name: 'Prêmios' })); expect(screen.getByText('Os prêmios ainda não foram informados.')).toBeTruthy();
});
test('501 oculta seção no menu e informa indisponibilidade', async () => {
  listTournaments.mockRejectedValue(Object.assign(new Error('Sem torneios'), { status: 501 }));
  mount(); await screen.findByText('Torneios indisponíveis'); expect(screen.queryByText('Menu de torneios')).toBeNull();
});
test('502 permite repetir e 401 redireciona para login', async () => {
  listTournaments.mockRejectedValueOnce(Object.assign(new Error('Tente novamente em instantes.'), { status: 502 }));
  mount(); await screen.findByRole('alert'); fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); await screen.findByText(item.name);
  getTournament.mockRejectedValueOnce(Object.assign(new Error('Sessão expirada'), { status: 401 }));
  fireEvent.click(screen.getByRole('link', { name: `Ver torneio ${item.name}` })); await screen.findByText('Login da casa'); expect(localStorage.getItem('access_token')).toBeNull();
});
test('polling espera 45s, mantém os dados na atualização e para ao sair', async () => {
  jest.useFakeTimers(); const view = mount(`/admin/torneios/${id}`);
  await act(async () => {}); await waitFor(() => expect(screen.getByText('EME*****')).toBeTruthy());
  await act(async () => { jest.advanceTimersByTime(44000); }); expect(getTournament).toHaveBeenCalledTimes(1);
  await act(async () => { jest.advanceTimersByTime(1000); }); expect(getTournament).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('link', { name: 'Todos os torneios' }));
  await act(async () => { jest.advanceTimersByTime(90000); }); expect(getTournament).toHaveBeenCalledTimes(2);
  view.unmount();
});
