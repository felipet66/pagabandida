import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { createPortal } from "react-dom";
import useCatalog from "hooks/useCatalog";
import useStartGame from "hooks/useStartGame";
import GameCard from "components/Catalog/GameCard";
import AviatorTools from "components/Catalog/AviatorTools";
import BannerCarousel from "components/BannerCarousel/BannerCarousel";
import OnlineUsersBadge from "components/OnlineUsers/OnlineUsersBadge";
import RecentWins from "components/RecentWins/RecentWins";
import { rememberPendingGame, takePendingGame } from "services/pendingGame";
import { promptGameLogin } from "services/gameLoginPrompt";
import logo from "assets/brand/pagabandida-emblema-verde-512.webp";
import "./GameCatalog.css";
import { ArrowRight, CircleAlert, CircleDot, Coins, Dice5, Flame, Grid2X2, LoaderCircle, Plane, Search, Video, X } from "lucide-react";
import Icon from "components/DesignSystem/Icon";

const AVIATORS = [
  { launchSlug: "spribe/aviator", name: "Aviator Original", vendorName: "Spribe" },
  { launchSlug: "spribe/aviator-vip", name: "Aviator VIP", vendorName: "Spribe" },
  { launchSlug: "spribe/aviator-premium", name: "Aviator Premium", vendorName: "Spribe" },
];

export default function GameCatalog({ embedded = false }) {
  const catalog = useCatalog();
  const { hasMore, loading: catalogLoading, error: catalogError, loadMore } = catalog;
  const history = useHistory();
  const sentinel = useRef(null);
  const selectedRef = useRef(null);
  const closeButton = useRef(null);
  const previousFocus = useRef(null);
  const loginPromptOpen = useRef(false);
  const [selected, setSelected] = useState(null);
  const requireLogin = useCallback(() => {
    if (selectedRef.current) rememberPendingGame(selectedRef.current);
    history.push("/auth/login");
  }, [history]);
  const { gameUrl, loading, error, startGame, resetGame } = useStartGame({ onAuthRequired: requireLogin });
  const openGame = useCallback(async game => {
    if (loginPromptOpen.current) return;
    if (!localStorage.getItem("access_token")) {
      loginPromptOpen.current = true;
      try {
        await promptGameLogin(game, history);
      } finally {
        loginPromptOpen.current = false;
      }
      return;
    }
    selectedRef.current = game;
    previousFocus.current = document.activeElement;
    setSelected(game);
    startGame({ slug: game.launchSlug });
  }, [history, startGame]);
  const closeGame = useCallback(() => {
    resetGame();
    setSelected(null);
    selectedRef.current = null;
    previousFocus.current?.focus();
  }, [resetGame]);

  useEffect(() => {
    if (localStorage.getItem("access_token")) {
      const pending = takePendingGame();
      if (pending) openGame(pending);
    }
  }, [openGame]);

  useEffect(() => {
    if (!hasMore || catalogLoading || catalogError) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) loadMore();
    }, { rootMargin: "300px" });
    if (sentinel.current) observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, catalogLoading, catalogError, loadMore]);

  useEffect(() => {
    if (!selected) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKey = event => {
      if (event.key === "Escape") closeGame();
      // Keep keyboard navigation inside the full-screen player.
      if (event.key === "Tab") {
        const controls = Array.from(document.querySelectorAll('.catalog-player button, .catalog-player iframe'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", onKey); };
  }, [selected, closeGame]);

  const hasFilters = Boolean(catalog.q.trim() || catalog.vendor || catalog.category);
  const sections = Array.from(catalog.games.reduce((groups, game) => {
    const name = game.category || "Outros jogos";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(game);
    return groups;
  }, new Map()));

  const categoryIcon = category => {
    if (/crash|aviator/i.test(category)) return Plane;
    if (/slot|níque|nique/i.test(category)) return Coins;
    if (/rolet|roulette/i.test(category)) return CircleDot;
    if (/live|vivo/i.test(category)) return Video;
    return Dice5;
  };

  return (
    <div className={`game-catalog${embedded ? " game-catalog--embedded" : " fx"}`}>
      {!embedded && <header className="catalog-header">
        <Link to="/jogos" aria-label="Paga Bandida — jogos"><img src={logo} alt="Paga Bandida" /></Link>
        <nav aria-label="Navegação do catálogo">
          <Link to="/admin/dashboard">Histórico Aviator</Link>
          <Link className="btn btn-primary" to={localStorage.getItem("access_token") ? "/admin/dashboard" : "/auth/login"}>{localStorage.getItem("access_token") ? "Minha conta" : "Entrar"}</Link>
        </nav>
      </header>}
      <main className="catalog-main">
        <header className="catalog-intro">
          <div className="catalog-intro__meta"><span className="ds-caption">Paga Bandida</span><OnlineUsersBadge /></div>
          <h1>Jogos e ferramentas</h1>
          <p>Aviator, cassino e ferramentas para acompanhar os resultados.</p>
        </header>
        <div className="catalog-activity">
          <RecentWins />
        </div>
        <div className="catalog-hero"><BannerCarousel /><AviatorTools /></div>
        <section className="catalog-section catalog-featured" aria-labelledby="aviator-heading">
          <div className="catalog-section-heading">
            <div><h2 id="aviator-heading"><Icon as={Plane} size={22} /> Aviator</h2><p>Escolha sua versão favorita</p></div>
            <span className="catalog-section-label">DESTAQUE PAGA BANDIDA</span>
          </div>
          <div className="catalog-row catalog-featured__grid">{AVIATORS.map(game => <GameCard key={game.launchSlug} game={game} onOpen={openGame} featured />)}</div>
        </section>
        {!hasFilters && catalog.games.length > 0 && <section className="catalog-section" aria-labelledby="popular-heading">
          <div className="catalog-section-heading"><div><h2 id="popular-heading"><Icon as={Flame} size={22} /> Mais jogados</h2><p>Jogos em destaque no momento</p></div></div>
          <div className="catalog-row">{catalog.games.slice(0, 10).map(game => <GameCard key={game.id || game.launchSlug} game={game} onOpen={openGame} />)}</div>
        </section>}
        <section aria-labelledby="catalog-heading">
          <div className="catalog-filters">
            <label className="catalog-search-label"><span>Buscar jogo</span><div className="catalog-search"><Icon as={Search} size={20} /><input type="search" placeholder="Pesquisar um jogo de cassino" maxLength={50} value={catalog.q} onChange={event => catalog.setQ(event.target.value)} /></div></label>
            <label><span>Provedor</span><select value={catalog.vendor} onChange={event => catalog.setVendor(event.target.value)}><option value="">Todos os provedores</option>{catalog.vendors.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label><span>Categoria</span><select value={catalog.category} onChange={event => catalog.setCategory(event.target.value)}><option value="">Todas as categorias</option>{catalog.categories.map(category => <option key={category} value={category}>{category}</option>)}</select></label>
          </div>
          <div className="catalog-category-tabs" role="group" aria-label="Categorias de jogos">
            <button type="button" className={!catalog.category ? "is-active" : ""} aria-pressed={!catalog.category} onClick={() => catalog.setCategory("")}><Icon as={Grid2X2} size={20} /> Todos</button>
            {catalog.categories.map(category => <button key={category} type="button" className={catalog.category === category ? "is-active" : ""} aria-pressed={catalog.category === category} onClick={() => catalog.setCategory(category)}><Icon as={categoryIcon(category)} size={20} /> {category}</button>)}
          </div>
          <div className="catalog-title"><h2 id="catalog-heading">{hasFilters ? "Resultados" : "Catálogo de jogos"}</h2><span>{catalog.total.toLocaleString("pt-BR")} jogos</span></div>
          {hasFilters ? <div className="catalog-grid" aria-busy={catalog.loading}>{catalog.games.map(game => <GameCard key={game.id || game.launchSlug} game={game} onOpen={openGame} />)}</div> : <div aria-busy={catalog.loading}>
            {sections.map(([category, games]) => <section className="catalog-section" key={category} aria-label={category}>
              <div className="catalog-section-heading"><div><h3>{category}</h3><p>Jogos de {category}</p></div><button className="catalog-see-all" type="button" onClick={() => catalog.setCategory(category)}>Ver todos <Icon as={ArrowRight} size={16} /></button></div>
              <div className="catalog-grid">{games.map(game => <GameCard key={game.id || game.launchSlug} game={game} onOpen={openGame} />)}</div>
            </section>)}
          </div>}
          {catalog.loading && <p className="catalog-status" role="status"><Icon as={LoaderCircle} size={22} className="catalog-spinner" /> Carregando jogos...</p>}
          {catalog.error && <div className="catalog-status catalog-status--error" role="alert"><Icon as={CircleAlert} size={26} /><p>{catalog.error}</p><button className="btn btn-primary" onClick={catalog.retry}>Tentar de novo</button></div>}
          {!catalog.loading && !catalog.error && catalog.games.length === 0 && <p className="catalog-status">Nenhum jogo encontrado</p>}
          <div ref={sentinel} aria-hidden="true" />
        </section>
      </main>
      {selected && createPortal(
        <div className="catalog-player" role="dialog" aria-modal="true" aria-labelledby="player-heading">
          <div className="catalog-player__bar"><h2 id="player-heading">{selected.name}</h2><button ref={closeButton} className="btn btn-primary" onClick={closeGame} aria-label="Fechar jogo"><Icon as={X} size={20} /> Fechar</button></div>
          {loading && <p className="catalog-status" role="status">Abrindo jogo...</p>}
          {error && <div className="catalog-status" role="alert"><p>{error}</p>{error !== "Jogo indisponível" && <button className="btn btn-primary" onClick={() => startGame({ slug: selected.launchSlug })}>Tentar de novo</button>}</div>}
          {gameUrl && <iframe title={selected.name} src={gameUrl} allow="autoplay; fullscreen; encrypted-media; clipboard-write" allowFullScreen />}
        </div>, document.body
      )}
    </div>
  );
}
