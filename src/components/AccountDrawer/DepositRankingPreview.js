import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Medal, Trophy, UserRound } from "lucide-react";
import Icon from "../DesignSystem/Icon";
import useDepositRanking from "../../hooks/useDepositRanking";

export default function DepositRankingPreview({ onClose }) {
  const { players, loading, error, refetch } = useDepositRanking();
  return (
    <section className="account-ranking" aria-labelledby="account-ranking-title" aria-busy={loading}>
      <h3 id="account-ranking-title"><Icon as={Trophy} size={20} /> Top 5 do mês</h3>
      {error ? <div className="account-ranking__message"><p>Não foi possível carregar o ranking.</p><button type="button" onClick={refetch}>Tentar de novo</button></div> : loading && !players.length ?
        <div className="account-ranking__loading" role="status"><span className="sr-only">Carregando top depositantes</span>{Array.from({ length: 5 }, (_, i) => <span key={i} aria-hidden="true" />)}</div> : !players.length ?
          <p className="account-ranking__message">Ainda não há depósitos neste mês. Seja o primeiro!</p> :
          <ol className="account-ranking__list">
            {players.slice(0, 5).map(player => <li key={player.rank}>
              <span className={`account-ranking__rank account-ranking__rank--${player.rank}`} aria-label={`${player.rank}º lugar`}>
                {player.rank <= 3 ? <Icon as={Medal} size={20} /> : `${player.rank}º`}
              </span>
              <span className="account-ranking__avatar"><Icon as={UserRound} size={20} /></span>
              <span className="account-ranking__name" title={player.name}>{player.name}</span>
              <strong>{player.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
            </li>)}
          </ol>}
      <Link className="account-ranking__link" to="/ranking" onClick={onClose}>Ver ranking completo <Icon as={ArrowRight} size={20} /></Link>
    </section>
  );
}
