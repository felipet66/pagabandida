import React, { useEffect, useRef, useState } from "react";
import { Bell, BellOff, BrainCircuit, ChevronDown, CircleCheck, CircleHelp, CircleX, Target, X } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import AviatorGameSelector, { AVIATOR_VERSIONS } from "components/Home/AviatorGameSelector";
import AviatorPlayer from "components/Home/AviatorPlayer";
import OnlineUsersBadge from "components/OnlineUsers/OnlineUsersBadge";
import RecentWins from "components/RecentWins/RecentWins";
import useStartGame from "hooks/useStartGame";
import useAviatorRadar from "hooks/useAviatorRadar";
import { formatRadarTime, radarCountdown } from "services/aviatorRadar";
import "./Home.css";
import "./RealtimeAnalysis.css";

const TARGET_LABEL = "4x a 5x";
const NOTIFICATION_DURATION = 6000;
const outcomeIcon = status => status === "GREEN" ? CircleCheck : status === "RED" ? CircleX : CircleHelp;
const formatOdd = odd => `${Number(odd).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`;
const outcomeLabel = outcome => outcome.status === "GREEN" ? `GREEN · ${formatOdd(outcome.odd)}` : outcome.status === "RED" ? "RED · alvo não atingido" : "Inconclusivo · dados insuficientes";

function radarMessage(radar) {
  if (radar.status === "loading") return ["Conectando ao radar", "Consultando as últimas 100 rodadas."];
  if (radar.status === "paused") return ["Monitoramento pausado", "Volte à tela para retomar a análise."];
  if (radar.status === "error") return ["Sem conexão com o histórico", "Tentando reconectar automaticamente."];
  if (radar.status === "stale") return ["Aguardando novos resultados", "Histórico sem atualização recente."];
  if (radar.status === "empty") return ["Aguardando histórico", "Nenhuma rodada disponível nesta versão."];
  if (radar.status === "insufficient") return ["Aguardando base histórica", `${radar.occurrenceCount}/3 ocorrências acima de 5x.`];
  if (radar.window) {
    if (radar.now > radar.window.windowEndMs) return ["Conferindo resultado", "Aguardando o histórico fechar a janela."];
    const started = radar.now >= radar.window.projectedAtMs;
    return [started ? "Janela em acompanhamento" : "Oportunidade estimada",
      started ? `Termina em ${radarCountdown(radar.window.windowEndMs, radar.now)} · alvo ${TARGET_LABEL}` : `Começa em ${radarCountdown(radar.window.projectedAtMs, radar.now)} · alvo ${TARGET_LABEL}`];
  }
  return ["Aguardando oportunidade", `Analisando ${radar.historyCount} rodadas · alvo ${TARGET_LABEL}`];
}

export default function RealtimeAnalysis() {
  const [activeGame, setActiveGame] = useState(AVIATOR_VERSIONS[0]);
  const [enabled, setEnabled] = useState(false);
  const [notification, setNotification] = useState(null);
  const announced = useRef(new Set());
  const { gameUrl, loading, error, startGame } = useStartGame();
  const radar = useAviatorRadar(activeGame.chartNumber, enabled);
  const activeWindow = radar.window;
  const lastOutcome = radar.lastOutcome;
  const [heading, caption] = radarMessage(radar);
  const scanning = radar.status === "loading" || radar.status === "ready";

  useEffect(() => { startGame({ slug: activeGame.slug }); }, [activeGame.slug, startGame]);
  useEffect(() => {
    if (!enabled) { setNotification(null); return; }
    if (lastOutcome) {
      const resultKey = `${activeGame.id}:result:${lastOutcome.id}`;
      if (!announced.current.has(resultKey)) {
        announced.current.add(resultKey);
        setNotification({ ...lastOutcome, type: "outcome", gameId: activeGame.id, version: activeGame.name, key: resultKey });
        return;
      }
    }
    if (!activeWindow) {
      setNotification(previous => previous?.type === "outcome" && previous.gameId === activeGame.id ? previous : null);
      return;
    }
    const key = `${activeGame.id}:window:${activeWindow.id}`;
    if (announced.current.has(key)) return;
    announced.current.add(key);
    setNotification(previous => previous?.type === "outcome" && previous.gameId === activeGame.id ? previous : { ...activeWindow, type: "window", gameId: activeGame.id, version: activeGame.name, key });
  }, [enabled, activeWindow, lastOutcome, activeGame.id, activeGame.name]);
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), NOTIFICATION_DURATION);
    return () => clearTimeout(timer);
  }, [notification]);

  const toggleAlerts = () => { setNotification(null); setEnabled(value => !value); };
  const selectGame = game => {
    if (game.id === activeGame.id) return;
    setNotification(null);
    setActiveGame(game);
  };

  return (
    <div className="content aviator-home">
      <div className="realtime-analysis">
        <header className="realtime-header">
          <h1>Análises em Tempo Real</h1>
          <OnlineUsersBadge />
        </header>
        <AviatorGameSelector selected={activeGame.id} onSelect={selectGame} />
        <RecentWins />

        <section className={`realtime-alert${enabled ? " is-enabled" : ""}`} aria-labelledby="realtime-alert-title">
          <div className="realtime-controls">
            <div className="realtime-alert__identity">
              <span className="realtime-alert__icon"><Icon as={Bell} size={18} /></span>
              <div><h2 id="realtime-alert-title">Alerta <strong>{TARGET_LABEL}</strong></h2><span>{activeGame.title}</span></div>
            </div>
            <button type="button" className="realtime-toggle" role="switch" aria-checked={enabled} aria-label={`Alertas de ${TARGET_LABEL}`} onClick={toggleAlerts}>
              <span>{enabled ? "Desativar" : "Ativar"}</span><span className="realtime-toggle__track" aria-hidden="true"><span /></span>
            </button>
          </div>

          <div className="realtime-feedback">
            {enabled ? (
              <div className={`realtime-scanner${scanning ? " is-scanning" : " is-idle"}${activeWindow ? " has-window" : ""}`}>
                <span className="realtime-scanner__core" aria-hidden="true"><i /><Icon as={activeWindow ? Target : BrainCircuit} size={22} /></span>
                <div className="realtime-scanner__copy"><strong role="status" aria-live="polite">{heading}{scanning && !activeWindow && <span className="realtime-scanner__dots" aria-hidden="true"><i /><i /><i /></span>}</strong><span>{caption}</span>
                  {activeWindow && <span className="realtime-window-time">{formatRadarTime(activeWindow.projectedAtMs)} – {formatRadarTime(activeWindow.windowEndMs)}</span>}
                </div>
                {scanning && <><span className="realtime-scanner__waves" aria-hidden="true">{[0, 1, 2, 3, 4].map(index => <i key={index} style={{ "--wave-index": index }} />)}</span><span className="realtime-scanner__sweep" aria-hidden="true" /></>}
              </div>
            ) : <div className="realtime-idle"><Icon as={BellOff} size={16} /><span>Ative para acompanhar as oportunidades.</span></div>}
          </div>

          <footer className="realtime-alert__footer">
            {lastOutcome ? <span className={`realtime-outcome realtime-outcome--${lastOutcome.status.toLowerCase()}`} role="status" aria-label={`Último resultado: ${outcomeLabel(lastOutcome)}`}><Icon as={outcomeIcon(lastOutcome.status)} size={14} />{outcomeLabel(lastOutcome)}</span> : <span><span className="realtime-status-dot" /> Radar 5x · monitoramento contínuo</span>}
            <span>{enabled && radar.updatedAt ? `Atualizado ${formatRadarTime(radar.updatedAt)}` : "Alvo 4x a 5x"}</span>
          </footer>
        </section>

        <div className="realtime-game">
          <AviatorPlayer title={activeGame.title} url={gameUrl} loading={loading} error={error} onRetry={() => startGame({ slug: activeGame.slug })} />
          {notification && (
            <div className={`realtime-notification${notification.type === "outcome" ? ` realtime-notification--${notification.status.toLowerCase()}` : ""}`} role="status" aria-live="polite" aria-atomic="true" key={notification.key}>
              <span className="realtime-notification__bell" aria-hidden="true"><Icon as={notification.type === "outcome" ? outcomeIcon(notification.status) : Bell} size={22} /></span>
              <div className="realtime-notification__body"><span>{notification.type === "outcome" ? notification.status === "NO_DATA" ? "JANELA INCONCLUSIVA" : "RESULTADO CONFIRMADO" : "JANELA ESTIMADA"} · {notification.version}</span><strong>{notification.type === "outcome" ? outcomeLabel(notification) : `Alvo de ${TARGET_LABEL}`}</strong><span className="realtime-notification__time">{notification.type === "outcome" ? `${formatRadarTime(notification.occurredAt)} · ${notification.status === "GREEN" ? "Alvo de 4x atingido" : notification.status === "RED" ? "Janela encerrada" : "Sem confirmação de green ou red"}` : `${formatRadarTime(notification.projectedAtMs)} – ${formatRadarTime(notification.windowEndMs)}`}</span></div>
              <button type="button" aria-label="Fechar alerta" onClick={() => setNotification(null)}><Icon as={X} size={17} /></button>
            </div>
          )}
        </div>

        <details className="realtime-pattern">
          <summary><Icon as={Target} size={16} /><span>Padrão do alerta <small>Radar 5x</small></span><Icon as={ChevronDown} size={16} /></summary>
          <p>Alvo de 4x a 5x, com referência nas ocorrências acima de 5x das últimas 100 rodadas. São necessárias pelo menos 3 ocorrências; a mediana dos intervalos projeta uma janela de 2min30s. Uma nova projeção só é criada após uma nova rodada acima de 5x, sem outra janela aberta. Green: uma rodada de pelo menos 4x dentro da janela, inclusive acima de 5x. Red: janela encerrada sem atingir 4x, com pelo menos 5 rodadas observadas e histórico sem lacunas. Sem esses dados, o resultado é inconclusivo. Atualização a cada 5 segundos enquanto a tela estiver visível; dados com mais de 60 segundos de atraso não geram alertas. Horários de Brasília. É uma estimativa estatística, sem garantia de resultado.</p>
        </details>
      </div>
    </div>
  );
}
