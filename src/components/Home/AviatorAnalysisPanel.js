import React from "react";
import EmptyState from "components/EmptyState/EmptyState";
import AviatorProLoader from "./AviatorProLoader";
import { ChartNoAxesCombined, CircleDot, Clock3, Info } from "lucide-react";
import Icon from "components/DesignSystem/Icon";

// Shared by the analysis screen and the public product demonstration.
export default function AviatorAnalysisPanel({ activeGame, loading, error, result, analyze, canAnalyze = !loading, unlockAt = 0 }) {
  return (
    <section className="aviator-pro__analysis glass edge" aria-labelledby="pro-analysis-title" aria-busy={loading}>
          <header className="aviator-panel-heading">
            <div><h2 id="pro-analysis-title">Intervalos da amostra</h2><p>Resultados acima de 3x e de 10x</p></div>
            <span className="aviator-pro__badge">{activeGame.name}</span>
          </header>
          <div className="aviator-pro__controls">
            <span className="aviator-pro__fixed-sample">Amostra de 100 velas</span>
            <button type="button" className="aviator-pro__analyze btn btn-primary" onClick={analyze} disabled={!canAnalyze} aria-describedby={!canAnalyze && !loading ? "aviator-pro-unlock" : undefined}>
              <Icon as={ChartNoAxesCombined} size={20} />{loading ? "Analisando..." : result ? "Atualizar análise" : "Analisar agora"}
            </button>
            {!canAnalyze && !loading && <p className="aviator-pro__unlock" id="aviator-pro-unlock">Nova análise disponível às <strong>{new Date(unlockAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hourCycle: "h23" })}</strong> · Brasília</p>}
          </div>
          <div className="aviator-pro__body" aria-live="polite">
            {loading ? <AviatorProLoader /> :
              error ? <EmptyState designSystem title="Histórico indisponível" description={error} actionLabel="Tentar novamente" onAction={analyze} /> :
              !result ? <EmptyState designSystem title="Comece uma análise" description="Escolha a versão e clique em Analisar agora." /> :
              !result.records.length ? <EmptyState designSystem title="Nenhum resultado disponível" description="Ainda não há velas para esta versão. Tente atualizar em alguns instantes." actionLabel="Atualizar análise" onAction={analyze} /> :
              <>
                <p className="aviator-pro__sample">{result.records.length} velas analisadas · Atualizado às {new Date(result.analyzedAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hourCycle: "h23" })}</p>
                <div className="aviator-pro__timings">
                  {result.timings.map(timing => <article className={`aviator-pro__timing${timing.threshold === 10 ? " aviator-pro__timing--rosas" : ""}`} key={timing.threshold}>
                    <h3><Icon as={CircleDot} size={16} /> ODD &gt; {timing.threshold}x</h3>
                    <span className="aviator-pro__time-label"><Icon as={Clock3} size={16} /> Próximo horário estimado</span>
                    <strong className={timing.next ? undefined : "aviator-pro__insufficient"}>{timing.next || "Dados insuficientes"}</strong>
                  </article>)}
                </div>

              </>}
          </div>
          <p className="aviator-pro__note"><Icon as={Info} size={20} /><span>Estimativa baseada nos intervalos passados da amostra. Não prevê o resultado das próximas rodadas.</span></p>
        </section>
  );
}
