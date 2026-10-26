import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Medal, Trophy, UserRound, UsersRound, Video, Wallet } from "lucide-react";
import Icon from "../components/DesignSystem/Icon";
import useDepositRanking from "../hooks/useDepositRanking";
import EmptyState from "../components/EmptyState/EmptyState";
import "./DepositRanking.css";

export function formatRankingMonth(month) {
  if (!month) return "Ranking mensal";
  const [year, number] = month.split("-").map(Number);
  const text = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, number - 1, 1)));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function DepositRanking({ embedded = false }) {
  const { month, players, loading, error, refetch } = useDepositRanking();
  return (
    <main className={embedded ? "content deposit-ranking" : "deposit-ranking deposit-ranking--public fx"}>
      <div className="deposit-ranking__shell">
        <Link className="deposit-ranking__back" to={embedded ? "/admin/jogos" : "/jogos"}><Icon as={ArrowLeft} size={20} /> Voltar para jogos</Link>
        <header className="deposit-ranking__heading">
          <span className="deposit-ranking__trophy"><Icon as={Trophy} size={26} /></span>
          <div><span className="deposit-ranking__eyebrow">Top 10 do mês</span><h1>Ranking de Players</h1><p>{formatRankingMonth(month)}</p></div>
        </header>
        <section className="deposit-ranking__card glass edge" aria-label="Top depositantes do mês" aria-busy={loading}>
          {error ? <EmptyState designSystem title="Ranking indisponível" description={error} actionLabel="Tentar de novo" onAction={refetch} /> : !loading && !players.length ?
            <EmptyState designSystem title="O ranking está começando" description="Ainda não há depósitos neste mês. Seja o primeiro!" /> :
            <table><thead><tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col">Valor</th></tr></thead><tbody>
              {loading && !players.length ? Array.from({ length: 10 }, (_, i) => <tr className="deposit-ranking__skeleton" key={i} aria-hidden="true"><td><span /></td><td><span /></td><td><span /></td></tr>) : players.map(player =>
                <tr key={player.rank} className={player.rank <= 3 ? `deposit-ranking__podium deposit-ranking__podium--${player.rank}` : undefined}>
                  <td>{player.rank <= 3 ? <span className="deposit-ranking__medal" aria-label={`${player.rank}º lugar`}><Icon as={Medal} size={26} /></span> : <span className="deposit-ranking__position">{player.rank}º</span>}</td>
                  <td><span className="deposit-ranking__player"><span className="deposit-ranking__avatar"><Icon as={UserRound} size={20} /></span><span>{player.name}</span></span></td>
                  <td className="deposit-ranking__amount">{player.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                </tr>)}
            </tbody></table>}
          {loading && <span className="sr-only" role="status">Carregando ranking</span>}
        </section>
        <p className="deposit-ranking__note">Depósitos acumulados no mês · Atualização a cada minuto</p>
        <section className="deposit-ranking__rules glass" aria-labelledby="ranking-rules-title">
          <h2 id="ranking-rules-title">Como participar do ranking</h2>
          <ul>
            <li><Icon as={Wallet} size={20} /><span>Faça seus depósitos pelo aplicativo.</span></li>
            <li><Icon as={Video} size={20} /><span>Acompanhe as novidades do Paga Bandida.</span></li>
            <li><Icon as={UsersRound} size={20} /><span>Fique atento aos avisos e novidades da comunidade.</span></li>
          </ul>
        </section>
      </div>
    </main>
  );
}
