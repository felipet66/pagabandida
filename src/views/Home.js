import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import HistoryOdds from "components/HistoryOdds/HistoryOdds";
import AviatorGameSelector, { AVIATOR_VERSIONS } from "components/Home/AviatorGameSelector";
import AviatorPlayer from "components/Home/AviatorPlayer";
import AviatorZoneIndicator from "components/Home/AviatorZoneIndicator";
import OnlineUsersBadge from "components/OnlineUsers/OnlineUsersBadge";
import RecentWins from "components/RecentWins/RecentWins";
import useAviatorRecords from "hooks/useAviatorRecords";
import useStartGame from "hooks/useStartGame";
import "./Home.css";
import { ArrowRight, ChartPie, Gamepad2 } from "lucide-react";
import Icon from "components/DesignSystem/Icon";

export default function Home() {
  const [autoRefresh, setAutoRefresh] = useState(() => {
    try { return localStorage.getItem("pagabandida:history-auto-refresh") === "true"; } catch { return false; }
  });
  const [activeGame, setActiveGame] = useState(AVIATOR_VERSIONS[0]);
  const [candleLimit, setCandleLimit] = useState(100);
  const [candleGreaterThan, setCandleGreaterThan] = useState(undefined);
  const { records, sampleRecords, sampleLoading, loading, error, refetch, refreshing, refreshError, lastUpdated, retryDelay, autoRefreshPaused } = useAviatorRecords(activeGame.chartNumber, candleLimit, candleGreaterThan, autoRefresh);
  const { gameUrl, loading: gameLoading, error: gameError, startGame } = useStartGame();

  useEffect(() => { startGame({ slug: activeGame.slug }); }, [activeGame.slug, startGame]);
  useEffect(() => {
    try { localStorage.setItem("pagabandida:history-auto-refresh", String(autoRefresh)); } catch { /* The toggle still works without storage. */ }
  }, [autoRefresh]);

  return (
    <div className="content aviator-home">
      <header className="aviator-home__header">
        <div><div className="aviator-home__meta"><span className="aviator-home__eyebrow">Paga Bandida</span><OnlineUsersBadge /></div><h1>Histórico Aviator</h1><p>Escolha a versão e acompanhe os últimos resultados.</p></div>
        <Link to="/admin/jogos" className="aviator-secondary-action" aria-label="Todos os jogos"><Icon as={Gamepad2} size={20} /><span>Todos os jogos</span></Link>
      </header>
      <AviatorGameSelector selected={activeGame.id} onSelect={setActiveGame} />
      <RecentWins />
      <HistoryOdds records={records} loading={loading} error={error} onRefresh={refetch} numberVelas={candleLimit}
        onQuantityChange={setCandleLimit} candleGreaterThan={candleGreaterThan} onOddFilterChange={setCandleGreaterThan}
        autoRefresh={autoRefresh} onAutoRefreshChange={setAutoRefresh} refreshing={refreshing} refreshError={refreshError}
        lastUpdated={lastUpdated} retryDelay={retryDelay} autoRefreshPaused={autoRefreshPaused} />
      <AviatorPlayer title={activeGame.title} url={gameUrl} loading={gameLoading} error={gameError} onRetry={() => startGame({ slug: activeGame.slug })} />
      <AviatorZoneIndicator records={sampleRecords} loading={sampleLoading ?? loading} error={error} version={activeGame.name} />
      <Link className="aviator-bankroll-link glass edge" to="/admin/gestao-banca">
        <span className="aviator-bankroll-link__icon"><Icon as={ChartPie} size={22} /></span>
        <span><strong>Organize sua banca</strong><span>Planeje sua meta e seus limites na gestão de banca.</span></span>
        <Icon as={ArrowRight} size={20} />
      </Link>
    </div>
  );
}
