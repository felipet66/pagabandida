import React, { useEffect, useRef, useState } from "react";
import EmptyState from "components/EmptyState/EmptyState";
import { Maximize, Minimize } from "lucide-react";
import Icon from "components/DesignSystem/Icon";

export default function AviatorPlayer({ title, url, loading, error, onRetry }) {
  const frame = useRef(null);
  const [fullscreenError, setFullscreenError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = event => { if (event.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", escape); };
  }, [expanded]);
  const enlarge = async () => {
    if (window.innerWidth <= 991) { setExpanded(true); return; }
    try { await frame.current.requestFullscreen(); setFullscreenError(false); }
    catch { setFullscreenError(true); }
  };
  return (
    <section className={`aviator-player-panel glass edge${expanded ? " aviator-player-panel--expanded" : ""}`} aria-labelledby="aviator-player-title">
      <header className="aviator-panel-heading">
        <div><h2 id="aviator-player-title">{title}</h2><p>Jogue diretamente pelo aplicativo</p></div>
        {url && !loading && !error && <button type="button" className="aviator-secondary-action" onClick={expanded ? () => setExpanded(false) : enlarge}><Icon as={expanded ? Minimize : Maximize} size={20} /> {expanded ? "Voltar" : "Ampliar"}</button>}
      </header>
      {fullscreenError && <p className="aviator-history-note" role="status">Seu navegador não permitiu ampliar o jogo.</p>}
      <div className="aviator-player-frame" ref={frame}>
        {loading ? <div className="aviator-loading-state" role="status"><span className="aviator-loading-spinner" aria-hidden="true" /> Abrindo {title}...</div> : error || !url ?
          <EmptyState designSystem title="Não foi possível abrir o jogo" description={error || "Tente abrir o jogo novamente."} actionLabel="Tentar novamente" onAction={onRetry} /> :
          <iframe title={title} src={url} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />}
      </div>
    </section>
  );
}
