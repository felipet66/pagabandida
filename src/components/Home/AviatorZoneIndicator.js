import React, { useMemo } from "react";
import { Thermometer } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import { analyzeAviatorZones } from "../../helpers/aviatorZones";

const zoneNames = { hot: "Zona quente", cold: "Zona fria", neutral: "Intermediária", unavailable: "Janela incompleta" };
const percentage = rate => `${(rate * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const rounds = count => `${count} ${count === 1 ? "rodada" : "rodadas"}`;

export default function AviatorZoneIndicator({ records = [], loading, error, version }) {
  const analysis = useMemo(() => analyzeAviatorZones(records), [records]);
  return <section className="aviator-zones glass edge" aria-labelledby="aviator-zones-title" aria-busy={loading}>
    <header className="aviator-zones__heading">
      <div><span className="aviator-zones__eyebrow"><Icon as={Thermometer} size={16} /> Concentração recente{version ? ` · ${version}` : ""}</span>
        <h2 id="aviator-zones-title">Zonas acima de 10x</h2></div>
      {analysis.latest && !loading && !error && <span className="aviator-zones__updated">Última rodada: {analysis.latest.formattedDate || new Date(analysis.latest.dataTime).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · Brasília</span>}
    </header>
    {error ? <p className="aviator-zones__feedback" role="status">Indicador indisponível. Atualize o histórico para tentar novamente.</p> :
      loading ? <p className="aviator-zones__feedback" role="status">Carregando a concentração das últimas rodadas…</p> :
      <>
        <div className="aviator-zones__grid">
          {analysis.windows.map(window => <section className={`aviator-zones__window aviator-zones__window--${window.zone}`} key={window.size} aria-label={`Concentração nas últimas ${window.size} rodadas`}>
            <h3>Últimas {window.size} rodadas</h3>
            <span className="aviator-zones__badge">{zoneNames[window.zone]}</span>
            {window.complete ? <>
              <p className="aviator-zones__count"><strong>{window.count}</strong> de {window.size} acima de 10x</p>
              <div className="aviator-zones__concentration"><strong>{percentage(window.rate)}</strong><span>da janela</span></div>
              <div className="aviator-zones__track" aria-hidden="true"><span style={{ width: `${window.rate * 100}%` }} /></div>
            </> : <p className="aviator-zones__partial">{window.available ? `${window.count} acima de 10x em um trecho de ${rounds(window.available)}. ` : ""}São necessárias {window.size} rodadas consecutivas para classificar esta janela.</p>}
          </section>)}
          <section className="aviator-zones__distance" aria-label="Distância desde a última ocorrência acima de 10x">
            <h3>Desde o último &gt;10x</h3>
            <strong className="aviator-zones__distance-value">{analysis.roundsSince != null ? rounds(analysis.roundsSince) : analysis.available ? `Pelo menos ${rounds(analysis.available)}` : "Sem dados contínuos"}</strong>
            <p>{analysis.roundsSince === 0 ? "A rodada mais recente foi acima de 10x." : analysis.roundsSince != null ? "Rodadas posteriores à última ocorrência observada." : analysis.available ? "Nenhum resultado acima de 10x no trecho contínuo disponível. A distância exata não foi observada." : "Aguarde uma amostra válida do histórico."}</p>
          </section>
        </div>
        {analysis.interrupted && (analysis.available < 50 || analysis.roundsSince == null) && <p className="aviator-zones__note">Há uma lacuna ou um registro inválido no histórico. A leitura usa apenas o trecho contínuo mais recente ({rounds(analysis.available)}).</p>}
      </>}
    <details className="aviator-zones__rules"><summary>Como classificamos as zonas</summary>
      <p>Em cada janela: zona quente com 20% ou mais de resultados acima de 10x; zona fria com até 5%; intermediária entre esses valores. São cortes descritivos fixos, sem validação preditiva. Exatamente 10x não entra na contagem.</p>
      <p>O indicador usa o histórico sem filtro de odds, mesmo ao exibir apenas 10 velas. Uma janela incompleta não recebe classificação. A distância considera a última rodada carregada.</p>
    </details>
    <p className="aviator-zones__note">Descreve os resultados passados. Zona quente, zona fria e espera longa não indicam a chance da próxima rodada.</p>
  </section>;
}
