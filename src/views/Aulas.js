import React from "react";
import { Modal } from "reactstrap";
import { BookOpen, Check, ChevronDown, ExternalLink, Play, X } from "lucide-react";
import { trackGamification } from "../services/gamificationApi";
import { getLessons, videoSource } from "../services/lessonsApi";
import cinemaCover from "../assets/img/lessons-cinema-hero.webp";
import "./Aulas.css";

function LessonArtwork({ lesson, className, eager = false }) {
  const cover = videoSource(lesson.coverUrl)?.url;
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [cover]);
  return <img className={className} src={!failed && cover ? cover : cinemaCover} alt=""
    loading={eager ? "eager" : "lazy"} referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}

function LessonPlayer({ lesson, onClose, watched, onWatched }) {
  const source = videoSource(lesson.videoUrl);
  return <Modal isOpen toggle={onClose} size="xl" centered zIndex={1200} modalClassName="lesson-player-overlay" backdropClassName="lesson-player-backdrop" className="lesson-player" labelledBy="lesson-player-title" trapFocus returnFocusAfterClose>
    <div className="lesson-player-header">
      <div><span className="lesson-eyebrow">SUA AULA</span><h2 id="lesson-player-title">{lesson.title}</h2></div>
      <button type="button" className="lesson-close" onClick={onClose} aria-label="Fechar aula"><X size={22} /></button>
    </div>
    {source?.type === "embed" ? <div className="lesson-player-video">
      <iframe src={source.url} title={lesson.title} referrerPolicy="strict-origin-when-cross-origin"
        allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
    </div> : source?.type === "file" ? <video className="lesson-player-video" controls preload="metadata"
      poster={videoSource(lesson.coverUrl)?.url || cinemaCover} aria-label={lesson.title}>
      <source src={source.url} />Seu navegador não suporta este vídeo.
    </video> : <div className="lesson-player-external"><BookOpen size={36} /><p>Esta aula está disponível em outra página.</p></div>}
    <div className="lesson-player-details">
      {source && <a className="lesson-external-link" href={lesson.videoUrl} target="_blank" rel="noopener noreferrer">
        Abrir vídeo em outra página <ExternalLink size={15} aria-hidden="true" />
      </a>}
      <p className="lesson-full-description">{lesson.description}</p>
      <button type="button" className="lesson-watch-button" disabled={watched} onClick={() => onWatched(lesson.id)}>
        <Check size={18} aria-hidden="true" />{watched ? "Aula marcada como assistida" : "Marcar como assistida"}
      </button>
    </div>
  </Modal>;
}

const Aulas = () => {
  const [lessons, setLessons] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const [revision, setRevision] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedLesson, setSelectedLesson] = React.useState(null);
  const [showDescription, setShowDescription] = React.useState(false);
  const [watched, setWatched] = React.useState([]);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    getLessons(offset, controller.signal).then(data => {
      if (cancelled) return;
      setLessons(current => offset === 0 ? data.items : [...current, ...data.items]);
      setTotal(data.total);
      setHasMore(data.hasMore);
    }).catch(() => {
      if (!cancelled) setError("Não foi possível carregar as aulas. Tente novamente.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; controller.abort(); };
  }, [offset, revision]);

  const markWatched = id => {
    if (watched.includes(id)) return;
    setWatched(items => [...items, id]);
    trackGamification("lesson_watched", id);
  };
  const featured = lessons[0];
  return (
    <div className="content lessons-page">
      <header className="lessons-heading"><h1>Aulas</h1><p>Aprenda no seu ritmo com os conteúdos do app.</p></header>
      {featured && <>
        <section className={`lesson-feature${videoSource(featured.coverUrl) ? " lesson-feature-custom-cover" : ""}`} aria-labelledby="lesson-feature-title">
          <LessonArtwork key={featured.id} lesson={featured} className="lesson-feature-art" eager />
          <div className="lesson-feature-copy">
            <span className="lesson-eyebrow">AULA EM DESTAQUE</span>
            <h2 id="lesson-feature-title">{featured.title}</h2>
            <p className="lesson-feature-summary">{featured.description}</p>
            <div className="lesson-feature-actions">
              <button type="button" className="lesson-watch-button" onClick={() => setSelectedLesson(featured)}><Play size={19} fill="currentColor" aria-hidden="true" />Assistir aula</button>
              <button type="button" className="lesson-description-toggle" aria-expanded={showDescription} aria-controls="lesson-description" onClick={() => setShowDescription(value => !value)}>
                {showDescription ? "Ocultar descrição" : "Ver descrição"}<ChevronDown size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
        {showDescription && <div id="lesson-description" className="lesson-description-panel"><h3>Sobre esta aula</h3><p className="lesson-full-description">{featured.description}</p></div>}
        <section className="lessons-catalog" aria-labelledby="lessons-catalog-title">
          <div className="lessons-catalog-heading"><h2 id="lessons-catalog-title">Todas as aulas</h2><span>{total || lessons.length} {total === 1 || (!total && lessons.length === 1) ? "aula" : "aulas"}</span></div>
          <div className="lessons-grid">
            {lessons.map((lesson, index) => <article className="lesson-card" key={lesson.id}>
              <button type="button" className="lesson-card-link" onClick={() => setSelectedLesson(lesson)} aria-label={`Assistir: ${lesson.title}`}>
                <div className="lesson-card-art"><LessonArtwork lesson={lesson} /><span className="lesson-card-number">AULA {String(index + 1).padStart(2, "0")}</span><span className="lesson-card-play"><Play size={24} fill="currentColor" aria-hidden="true" /></span>
                  {watched.includes(lesson.id) && <span className="lesson-watched-badge"><Check size={13} aria-hidden="true" />Assistida</span>}
                </div>
                <div className="lesson-card-caption"><h3>{lesson.title}</h3><p>{lesson.description}</p></div>
              </button>
            </article>)}
          </div>
        </section>
      </>}
      {loading && <div className="lessons-state" role="status"><BookOpen size={28} aria-hidden="true" /><p>Carregando aulas…</p></div>}
      {error && <div role="alert" className="lessons-state"><p>{error}</p><button type="button" className="lesson-watch-button" onClick={() => {
        setLoading(true); setError(""); setRevision(value => value + 1);
      }}>Tentar novamente</button></div>}
      {!loading && !error && !lessons.length && <div className="lessons-state" role="status"><BookOpen size={36} aria-hidden="true" /><h2>Seu próximo aprendizado começa aqui</h2><p>Nenhuma aula publicada por enquanto.</p></div>}
      {!loading && !error && hasMore && <div className="lessons-load-more"><button type="button" className="lesson-description-toggle" onClick={() => { setLoading(true); setOffset(lessons.length); }}>Carregar mais aulas<ChevronDown size={18} aria-hidden="true" /></button></div>}
      {selectedLesson && <LessonPlayer lesson={selectedLesson} onClose={() => setSelectedLesson(null)} watched={watched.includes(selectedLesson.id)} onWatched={markWatched} />}
    </div>
  );
};

export default Aulas;
