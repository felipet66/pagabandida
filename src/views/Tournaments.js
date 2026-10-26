import React, { useEffect, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Clock3, Medal, RefreshCw, Trophy, UserRound, UsersRound } from "lucide-react";
import Icon from "../components/DesignSystem/Icon";
import { useTournaments } from "../contexts/TournamentsContext";
import { clearAppSession } from "../services/appStorage";
import { rememberPendingGame } from "../services/pendingGame";
import { formatTournamentDate, getTournament, groupTournamentPrizes, tournamentCountdown, tournamentDate, tournamentMoney } from "../services/tournamentsApi";
import "./Tournaments.css";

const number = value => value.toLocaleString("pt-BR");
function Status({ tournament, now }) {
  const live = tournament.status === "live";
  const ended = live && tournamentDate(tournament.endsAt).getTime() <= now;
  return <span className={`tournaments-badge${live && !ended ? " tournaments-badge--live" : ""}`}>{live ? ended ? "Encerrado" : "Ao vivo" : "Não disponível"}</span>;
}
function Feedback({ title, description, retry, loading }) {
  return <div className="tournaments-feedback" role={retry ? "alert" : "status"}>
    <Icon as={Trophy} size={36} /><h2>{title}</h2><p>{description}</p>
    {retry && <button type="button" className="btn btn-primary" onClick={retry} disabled={loading}>Tentar novamente</button>}
  </div>;
}
export default function Tournaments() {
  const { tournamentId } = useParams();
  const history = useHistory();
  const list = useTournaments();
  const { markUnsupported } = list;
  const [now, setNow] = useState(Date.now());
  const [tab, setTab] = useState("ranking");
  const detail = useQuery({
    queryKey: ["tournament", tournamentId, list.session], queryFn: ({ signal }) => getTournament(tournamentId, signal),
    enabled: Boolean(tournamentId && list.session && !list.unsupported), retry: false, cacheTime: 0,
    refetchOnWindowFocus: false, refetchInterval: (data, query) => [400, 401, 403, 501].includes(query.state.error?.status) ? false : 45000,
    refetchIntervalInBackground: false,
  });
  const query = tournamentId ? detail : list;
  const error = query.error;
  useEffect(() => {
    if (!list.session || error?.status === 401) {
      if (error?.status === 401) clearAppSession();
      history.replace("/auth/login");
    }
  }, [list.session, error, history]);
  useEffect(() => { if (detail.error?.status === 501) markUnsupported(); }, [detail.error, markUnsupported]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => setTab("ranking"), [tournamentId]);
  const tournament = detail.data;
  const entries = tournament?.leaderboard.topEntries || [];
  const myEntry = tournament?.leaderboard.myEntry;
  const openGame = () => {
    rememberPendingGame({ launchSlug: tournament.games[0], name: "Jogo do torneio" });
    history.push("/admin/jogos");
  };

  return <main className="content tournaments"><div className="tournaments-shell">
    <Link className="tournaments-back" to={tournamentId ? "/admin/torneios" : "/admin/jogos"}><Icon as={ArrowLeft} size={18} />{tournamentId ? "Todos os torneios" : "Voltar para jogos"}</Link>
    <header className="tournaments-heading"><span className="tournaments-heading-icon"><Icon as={Trophy} size={30} /></span><div><span className="tournaments-eyebrow">COMPETIÇÕES DA CASA</span><h1>{tournamentId ? "Detalhes do torneio" : "Torneios"}</h1><p>Acompanhe os prêmios, os prazos e sua posição no ranking.</p></div>
      {!list.unsupported && <button type="button" className="tournaments-refresh" onClick={() => query.refetch()} disabled={query.isFetching} aria-label="Atualizar torneios"><Icon as={RefreshCw} size={18} /><span>{query.isFetching ? "Atualizando..." : "Atualizar"}</span></button>}
    </header>
    {list.unsupported || error?.status === 501 ? <Feedback title="Torneios indisponíveis" description="Esta casa ainda não disponibiliza torneios." /> :
      error && !query.data ? <Feedback title="Não foi possível carregar os torneios" description={error.message} retry={() => query.refetch()} loading={query.isFetching} /> :
        query.isLoading ? <div className="tournaments-grid" role="status" aria-label="Carregando torneios">{[0, 1, 2].map(item => <div key={item} className="tournaments-skeleton" aria-hidden="true"><span /><span /><span /></div>)}</div> :
          tournamentId && tournament ? <>
            <section className="tournament-detail-hero"><div className="tournament-detail-main"><div className="tournaments-badges"><Status tournament={tournament} now={now} />{tournament.joined && <span className="tournaments-badge tournaments-badge--joined"><Icon as={Check} size={14} /> Participando</span>}</div><h2>{tournament.name}</h2><p className="tournament-description">{tournament.description}</p>
              <div className="tournament-dates"><span>Início: {formatTournamentDate(tournament.startsAt)}</span><span>Fim: {formatTournamentDate(tournament.endsAt)}</span><small>Horário de Brasília</small></div></div>
              <aside className="tournament-detail-summary"><span><Icon as={Clock3} size={18} /> Tempo restante</span><strong className="tournament-timer">{tournamentCountdown(tournament.endsAt, now)}</strong><span><Icon as={UsersRound} size={18} /> {number(tournament.participantCount)} participantes</span><button type="button" className="btn btn-primary" onClick={openGame} disabled={!tournament.games.length || tournament.status !== "live" || tournamentDate(tournament.endsAt).getTime() <= now}>Jogar <Icon as={ArrowRight} size={18} /></button>{!tournament.games.length && <small>Jogo indisponível</small>}</aside>
            </section>
            {error && <div className="tournaments-update-error" role="alert">Não foi possível atualizar. {error.message}</div>}
            <section className="tournament-results" aria-label="Resultados do torneio"><div className="tournaments-tabs" role="tablist" aria-label="Detalhes do torneio">{["ranking", "prizes"].map(value => <button type="button" key={value} id={`tournament-tab-${value}`} role="tab" aria-selected={tab === value} aria-controls={`tournament-panel-${value}`} tabIndex={tab === value ? 0 : -1} onClick={() => setTab(value)} onKeyDown={event => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); const next = event.key === "Home" ? "ranking" : event.key === "End" ? "prizes" : value === "ranking" ? "prizes" : "ranking"; setTab(next); document.getElementById(`tournament-tab-${next}`)?.focus(); } }}><Icon as={value === "ranking" ? Trophy : Medal} size={18} />{value === "ranking" ? "Ranking" : "Prêmios"}</button>)}</div>
              <div id={`tournament-panel-${tab}`} role="tabpanel" aria-labelledby={`tournament-tab-${tab}`} tabIndex={0}>
                {tab === "ranking" ? <><div className="tournament-table-heading"><h2>Ranking do torneio</h2><span>Atualiza a cada 45 segundos</span></div>
                  {entries.length ? <div className="tournament-table-scroll"><table className="tournament-table"><caption className="sr-only">Classificação por pontos</caption><thead><tr><th scope="col">Posição</th><th scope="col">Player</th><th scope="col">Pontos</th></tr></thead><tbody>{entries.map(entry => <tr key={entry.rank} className={entry.isMe ? "is-me" : ""}><td>{entry.rank <= 3 && <Icon as={Medal} size={18} />} {entry.rank}º</td><td><span className="tournament-player"><span className="tournament-avatar">{entry.profilePhoto ? <img src={entry.profilePhoto} alt="" onError={event => { event.currentTarget.style.display = "none"; }} /> : <Icon as={UserRound} size={16} />}</span><span>{entry.displayName}</span>{entry.isMe && <span className="tournaments-you">Você</span>}</span></td><td>{number(entry.score)}</td></tr>)}</tbody></table></div> : <p className="tournaments-empty">O ranking ainda não tem pontuações.</p>}
                  {!entries.some(entry => entry.isMe) && <div className="tournament-my-entry">{myEntry ? <><strong>Você: Nº {number(myEntry.rank)}</strong><span>{number(myEntry.score)} pontos</span></> : <strong>Você ainda não pontuou</strong>}</div>}
                </> : <><div className="tournament-table-heading"><h2>Distribuição de prêmios</h2><span>{tournament.prizes.length} posições premiadas</span></div>{tournament.prizes.length ? <ul className="tournament-prizes">{groupTournamentPrizes(tournament.prizes).map(prize => <li key={prize.start}><span><Icon as={Medal} size={20} />{prize.start === prize.end ? `${prize.start}º lugar` : `${prize.start}º ao ${prize.end}º lugar`}</span><strong>{tournamentMoney(prize.amount, prize.currency)}<small>{prize.start !== prize.end ? "por pessoa" : ""}</small></strong></li>)}</ul> : <p className="tournaments-empty">Os prêmios ainda não foram informados.</p>}</>}
              </div>
            </section>
          </> : !tournamentId && list.data?.length ? <><div className="tournaments-list-heading"><h2>Explore os torneios</h2><span>{list.data.length} {list.data.length === 1 ? "torneio" : "torneios"}</span></div><div className="tournaments-grid">{list.data.map(item => {
            const prize = item.description.match(/R\$\s*[\d.]+(?:,\d{1,2})?/);
            return <article className="tournament-card" key={item.id}><div className="tournament-card-top"><span className="tournament-card-icon"><Icon as={Trophy} size={30} /></span><Status tournament={item} now={now} /></div><h3>{item.name}</h3><p className="tournament-card-description">{item.description}</p>{prize && <div className="tournament-prize-preview"><span>Prêmio anunciado</span><strong>{prize[0]}</strong></div>}<div className="tournament-card-stats"><div><Icon as={Clock3} size={18} /><span><small>Tempo restante</small><strong>{tournamentCountdown(item.endsAt, now)}</strong></span></div><div><Icon as={UsersRound} size={18} /><span>{number(item.participantCount)} participantes</span></div></div><div className="tournament-card-footer">{item.joined ? <span className="tournaments-badge tournaments-badge--joined"><Icon as={Check} size={14} /> Participando</span> : <span>Veja regras e classificação</span>}<Link to={`/admin/torneios/${item.id}`} aria-label={`Ver torneio ${item.name}`}>Ver torneio <Icon as={ArrowRight} size={18} /></Link></div></article>;
          })}</div></> : <Feedback title="Nenhum torneio por enquanto" description="Quando a casa disponibilizar novos torneios, eles aparecerão aqui." />}
    <p className="tournaments-note">As regras e os prêmios são definidos pela casa. Consulte a descrição de cada torneio.</p>
  </div></main>;
}
