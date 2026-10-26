import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AviatorGameSelector, { AVIATOR_VERSIONS } from "components/Home/AviatorGameSelector";
import AviatorPlayer from "components/Home/AviatorPlayer";
import AviatorAnalysisPanel from "components/Home/AviatorAnalysisPanel";
import OnlineUsersBadge from "components/OnlineUsers/OnlineUsersBadge";
import RecentWins from "components/RecentWins/RecentWins";
import useStartGame from "hooks/useStartGame";
import useAviatorProAnalysis from "hooks/useAviatorProAnalysis";
import "./Home.css";
import "./AviatorPRO.css";
import { ArrowLeft } from "lucide-react";
import Icon from "components/DesignSystem/Icon";

export default function AviatorPRO() {
  const [activeGame, setActiveGame] = useState(AVIATOR_VERSIONS[0]);
  const { loading, error, result, analyze, canAnalyze = !loading, unlockAt = 0 } = useAviatorProAnalysis(activeGame.chartNumber, 100);
  const { gameUrl, loading: gameLoading, error: gameError, startGame } = useStartGame();
  useEffect(() => { startGame({ slug: activeGame.slug }); }, [activeGame.slug, startGame]);

  return (
    <div className="content aviator-home aviator-pro">
      <header className="aviator-home__header">
        <div>
          <div className="aviator-home__meta"><span className="aviator-home__eyebrow">Paga Bandida I.A.</span><OnlineUsersBadge /></div>
          <h1>Análise de horários</h1>
          <p>Compare os intervalos dos últimos resultados de {activeGame.title}.</p>
        </div>
        <Link to="/admin/dashboard" className="aviator-secondary-action" aria-label="Voltar ao histórico">
          <Icon as={ArrowLeft} size={20} /><span>Histórico</span>
        </Link>
      </header>
      <AviatorGameSelector selected={activeGame.id} onSelect={setActiveGame} />
      <RecentWins />
      <div className="aviator-pro__layout">
        <AviatorAnalysisPanel activeGame={activeGame} loading={loading} error={error} result={result}
          analyze={analyze} canAnalyze={canAnalyze} unlockAt={unlockAt} />
        <AviatorPlayer title={activeGame.title} url={gameUrl} loading={gameLoading} error={gameError} onRetry={() => startGame({ slug: activeGame.slug })} />
      </div>
    </div>
  );
}
