import React from "react";
import { Link } from "react-router-dom";
import { Award, Footprints, Flame, LockKeyhole, Check, Trophy } from "lucide-react";
import Icon from "../components/DesignSystem/Icon";
import AchievementIcon from "../components/Gamification/AchievementIcon";
import useGamification from "../hooks/useGamification";
import "../components/Gamification/Gamification.css";

const number = value => Number(value || 0).toLocaleString("pt-BR");
export function formatXpDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data indisponível" : new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}
function Loading() {
  return <div className="gamification-loading" aria-busy="true" role="status" aria-label="Carregando gamificação">
    <div className="gamification-summary">{[0, 1].map(i => <div key={i} className="gamification-card gamification-summary-card gamification-skeleton" />)}</div>
    <div className="gamification-skeleton gamification-skeleton-title" />
    <div className="gamification-achievements">{Array.from({ length: 8 }, (_, i) => <div key={i} className="gamification-card gamification-achievement gamification-skeleton" />)}</div>
    <div className="gamification-details">{[0, 1].map(i => <div key={i} className="gamification-card gamification-skeleton gamification-skeleton-list" />)}</div>
  </div>;
}
export default function Gamification() {
  const { data, loading, error, refetch, loadMore, loadingMore, moreError } = useGamification();
  const me = data?.me;
  const leaderboard = data?.leaderboard;
  const unlocked = me?.achievements.filter(item => item.unlocked).length;
  const percent = me?.level === 10 ? 100 : Math.max(0, Math.min(100, Number(me?.progress.percentage) || 0));
  return <div className="content gamification-page"><div className="gamification-shell">
    <header className="gamification-heading"><div className="gamification-heading-icon"><Icon as={Award} size={28} /></div><div>
      <span className="gamification-eyebrow">Hábito e aprendizado</span><h1>Gamificação</h1><p>Acompanhe seu progresso, um passo de cada vez.</p>
    </div></header>
    {loading ? <Loading /> : error ? <div className="gamification-card gamification-error" role="alert"><Icon as={Award} size={32} /><h2>Seu progresso está guardado</h2><p>{error}</p><button className="btn btn-primary" onClick={refetch}>Tentar de novo</button></div> : me && <>
      <div className="gamification-summary">
        <section className="gamification-card gamification-summary-card gamification-level" aria-label="Seu nível">
          <div className="gamification-level-seal" aria-hidden="true">{me.level}</div>
          <div className="gamification-level-info"><span className="gamification-eyebrow">Nível {me.level}</span><h2>{me.levelName}</h2>
            <div className="gamification-xp-caption"><span>XP do nível</span><strong className="mono">{me.level === 10 ? "Nível máximo" : `${number(me.progress.current)} / ${number(me.progress.needed)} XP`}</strong></div>
            <div className="gamification-progress" role="progressbar" aria-label="Progresso do nível" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent}%` }} /></div>
            <p className="gamification-caption">{number(me.totalXp)} XP no total</p>
          </div>
        </section>
        <section className="gamification-card gamification-summary-card gamification-streak" aria-label="Sua sequência"><span className="gamification-streak-icon"><Icon as={Flame} size={30} /></span><div>
          <h2>{me.streak.current > 0 ? `${number(me.streak.current)} dias seguidos` : "Nenhuma sequência ainda"}</h2>
          <p>{me.streak.current > 0 ? "Volte amanhã para continuar seu hábito." : "Volte amanhã para começar"}</p>
          <span className="gamification-caption">Sua maior sequência: <strong className="mono">{number(me.streak.longest)} dias</strong></span>
        </div></section>
      </div>
      {me.totalXp === 0 && <div className="gamification-welcome"><Icon as={Footprints} size={20} /><p>Seu primeiro passo começa aqui. <Link to="/admin/aulas">Aprenda com as aulas</Link> e construa bons hábitos.</p></div>}
      <section aria-labelledby="gamification-achievements-title"><div className="gamification-section-heading"><h2 id="gamification-achievements-title">Conquistas</h2><span className="mono" aria-label={`${unlocked} de ${me.achievements.length} conquistas desbloqueadas`}>{unlocked}/{me.achievements.length}</span></div>
        <div className="gamification-achievements">{me.achievements.map(achievement => <article key={achievement.id} className={`gamification-card gamification-achievement${achievement.unlocked ? " is-unlocked" : " is-locked"}`}>
          <div className="gamification-achievement-top"><span className="gamification-achievement-icon"><AchievementIcon name={achievement.icon} size={24} /></span><span className="gamification-achievement-status"><Icon as={achievement.unlocked ? Check : LockKeyhole} size={14} /><span>{achievement.unlocked ? "Desbloqueada" : "Bloqueada"}</span></span></div>
          <h3>{achievement.name}</h3><p>{achievement.description}</p>
        </article>)}</div>
        {!me.achievements.length && <p className="gamification-empty">As conquistas aparecerão aqui.</p>}
      </section>
      <div className="gamification-details">
        <section aria-labelledby="gamification-history-title"><div className="gamification-section-heading"><h2 id="gamification-history-title">Histórico de XP</h2></div><div className="gamification-card gamification-list-card">
          {data.history.items.length ? <ul className="gamification-history">{data.history.items.map((item, i) => <li key={`${item.createdAt}-${item.action}-${i}`}><span className="gamification-history-icon"><Icon as={Award} size={18} /></span><div><strong>{item.label}</strong><time dateTime={item.createdAt}>{formatXpDate(item.createdAt)}</time></div><span className="gamification-earned mono">+{number(item.xp)} XP</span></li>)}</ul> : <p className="gamification-empty">Seu histórico começa com o primeiro XP.</p>}
          {moreError && <p role="alert" className="gamification-inline-error">{moreError}</p>}
          {data.history.hasMore && <button className="btn btn-outline-primary gamification-load-more" disabled={loadingMore} onClick={loadMore}>{loadingMore ? "Carregando..." : moreError ? "Tentar de novo" : "Carregar mais"}</button>}
          <p className="gamification-caption">Datas no horário de Brasília.</p>
        </div></section>
        <section aria-labelledby="gamification-ranking-title"><div className="gamification-section-heading"><h2 id="gamification-ranking-title"><Icon as={Trophy} size={20} /> Ranking da semana</h2></div><div className="gamification-card gamification-list-card">
          <table className="gamification-ranking"><caption className="sr-only">Top 10 por XP nesta semana</caption><thead><tr><th scope="col">Posição</th><th scope="col">Player</th><th scope="col">XP</th></tr></thead><tbody>
            {leaderboard.players.slice(0, 10).map(player => <tr key={player.rank} className={player.isMe ? "is-me" : ""}><td className="mono">{player.rank}º</td><td>{player.name}{player.isMe && <span className="gamification-you">Você</span>}</td><td className="mono">{number(player.xp)}</td></tr>)}
          </tbody></table>
          {!leaderboard.players.length && <p className="gamification-empty">Ainda não há participantes nesta semana.</p>}
          {!leaderboard.players.some(player => player.isMe) && <div className="gamification-my-position"><span>Sua posição: <strong>{leaderboard.me.position == null ? "Ainda sem posição" : `${leaderboard.me.position}º`}</strong></span><strong className="mono">{number(leaderboard.me.xp)} XP</strong></div>}
          <p className="gamification-caption">A semana vai de segunda a domingo (horário de Brasília).</p>
        </div></section>
      </div>
    </>}
    <p className="gamification-responsibility">XP premia hábito e aprendizado. Jogue com responsabilidade. 18+</p>
  </div></div>;
}
