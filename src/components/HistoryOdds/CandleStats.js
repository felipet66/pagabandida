import React, { useMemo } from "react";
import { summarizeRecentResults } from "../../helpers/recentResultsStatistics";

const percentage = value => `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const multiplier = value => `${value.toFixed(2)}x`;
const roundsSince = count => count < 0 ? "Não ocorreu na amostra" : count === 0 ? "Última rodada" : `Há ${count} ${count === 1 ? "rodada" : "rodadas"}`;

export default function CandleStats({ records, filtered }) {
  const stats = useMemo(() => summarizeRecentResults(records), [records]);
  if (!stats) return null;
  const showSequences = !filtered && stats.completeSequence;
  const values = [
    { label: "Mediana", value: multiplier(stats.median) },
    { label: "Média", value: multiplier(stats.mean) },
    { label: "Menor resultado", value: multiplier(stats.min) },
    { label: "Maior resultado", value: multiplier(stats.max) },
    { label: "Desvio padrão", value: multiplier(stats.standardDeviation) },
    { label: "Amplitude", value: multiplier(stats.range) },
  ];
  return <details className="aviator-statistics">
    <summary>Estatísticas da amostra <span className="aviator-statistics__sample">{stats.count} {stats.count === 1 ? "vela" : "velas"}{filtered ? " · filtradas" : ""}</span></summary>
    <div className="aviator-statistics__body">
      <p className="aviator-statistics__note">Resumo de {stats.count} {stats.count === 1 ? "vela carregada" : "velas carregadas"}{filtered ? " com o filtro de odd aplicado. Os percentuais representam apenas esta seleção" : ", da mais recente para a mais antiga"}.</p>
      <dl className="aviator-statistics__grid">{values.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <p className="aviator-statistics__note">Desvio padrão: dispersão dos multiplicadores em torno da média.</p>
      <div className="aviator-statistics__frequent"><span>Mais frequentes</span><strong>{stats.mode.length ? stats.mode.map(multiplier).join(" · ") : "Sem repetição na amostra"}</strong></div>

      <section className="aviator-statistics__section" aria-label="Distribuição dos resultados">
        <h3>Distribuição dos resultados</h3>
        <ul className="aviator-statistics__distribution">{stats.bands.map(band => <li key={band.id} className={`aviator-statistics__band--${band.id}`}>
          <div><span>{band.label}</span><strong>{band.count} de {stats.count} <span>({percentage(band.percentage)})</span></strong></div>
          <div className="aviator-statistics__track" aria-hidden="true"><span style={{ width: `${band.percentage}%` }} /></div>
        </li>)}</ul>
      </section>

      <section className="aviator-statistics__section" aria-label="Ocorrências por multiplicador">
        <h3>Ocorrências por multiplicador</h3>
        <p className="aviator-statistics__note">Faixas cumulativas: um resultado de 10x também conta em 2x e 5x.</p>
        <div className="aviator-statistics__table-wrap"><table className="aviator-statistics__table">
          <caption className="sr-only">Contagem e frequência na amostra{filtered ? " filtrada" : ""}{showSequences ? ", com rodadas desde a última ocorrência" : ""}</caption>
          <thead><tr><th scope="col">A partir de</th><th scope="col">Vezes</th><th scope="col">Frequência</th>{showSequences && <th scope="col">Última ocorrência</th>}</tr></thead>
          <tbody>{stats.thresholds.map(item => <tr key={item.threshold}><th scope="row">{item.threshold}x</th><td>{item.count}</td><td>{percentage(item.percentage)}</td>{showSequences && <td>{roundsSince(item.roundsSince)}</td>}</tr>)}</tbody>
        </table></div>
      </section>

      {showSequences && <section className="aviator-statistics__section" aria-label="Sequências na amostra">
        <h3>Sequências na amostra</h3>
        <p className="aviator-statistics__note">Sequência atual: <strong>{stats.currentStreak.count} {stats.currentStreak.count === 1 ? "vela" : "velas"}</strong> · {stats.currentStreak.label.toLowerCase()}. Contagem a partir da rodada mais recente, limitada à amostra.</p>
        <dl className="aviator-statistics__streaks">{stats.bands.map(band => <div key={band.id}><dt>Maior sequência · {band.label.toLowerCase()}</dt><dd>{band.longestRun} {band.longestRun === 1 ? "vela" : "velas"}</dd></div>)}</dl>
      </section>}
      {filtered && <p className="aviator-statistics__note">Selecione “Todas as odds” para ver sequências e rodadas desde a última ocorrência.</p>}
      <p className="aviator-statistics__note">Os resultados descrevem esta amostra e não preveem as próximas rodadas.</p>
    </div>
  </details>;
}
