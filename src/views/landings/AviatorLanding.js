import { SUPPORT_URL } from "config/support";
import { BET_HOUSE } from "config/betHouse";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, CardBody, Nav, NavItem, NavLink, Progress } from 'reactstrap';
import { ArrowRight, BarChart3, Check, ChevronLeft, CircleHelp, Clock3, Layers, Menu, MessageCircle, Plane, Users, X } from 'lucide-react';
import Icon from 'components/DesignSystem/Icon';
import ThemeToggle from 'components/DesignSystem/ThemeToggle';
import HistoryOdds from 'components/HistoryOdds/HistoryOdds';
import AviatorGameSelector, { AVIATOR_VERSIONS } from 'components/Home/AviatorGameSelector';
import AviatorAnalysisPanel from 'components/Home/AviatorAnalysisPanel';
import AviatorTools from 'components/Catalog/AviatorTools';
import BannerCarousel from 'components/BannerCarousel/BannerCarousel';
import { canalBanner } from 'assets/responsiveImages';
import logo from 'assets/brand/pagabandida-emblema-verde-512.webp';
import useTrackingParams from 'hooks/useTrackingParams';
import { analyzeAviatorTiming } from 'services/aviatorProAnalysis';
import { DEMO_TIME, getDemoRecords } from './landingDemo';
import '../Home.css';
import '../AviatorPRO.css';
import '../GameCatalog.css';
import './AviatorLanding.css';

const versions = [['quiz', 'Quiz'], ['analise', 'Análise'], ['comunidade', 'Comunidade']];
const communityBanners = [{
  id: 'canal', image: canalBanner, href: SUPPORT_URL,
  alt: 'Paga Bandida — suporte do Paga Bandida.',
}];
const content = {
  quiz: {
    label: 'QUIZ AVIATOR · 3 PERGUNTAS', title: <>Qual ferramenta falta{' '}<br />na sua análise do Aviator?</>,
    description: 'Conte como você acompanha as rodadas e veja qual recurso explorar primeiro: histórico, filtros de multiplicadores ou comunidade.',
    finalTitle: 'Crie sua conta e explore o recurso indicado.',
    finalDescription: 'Encontre o histórico, as análises e a comunidade dentro do Paga Bandida.',
    finalCta: 'Criar minha conta',
  },
  analise: {
    label: 'HISTÓRICO E ANÁLISE DO AVIATOR', title: <>O print chegou.{' '}<br />A rodada já passou.</>,
    description: 'Acompanhe o histórico atualizado, filtre os multiplicadores que quer estudar e consulte probabilidades e estatísticas em tempo real. Jogo e análise reunidos no Paga Bandida.',
    cta: 'Quero analisar no Paga Bandida',
    finalTitle: 'Tenha os dados à mão quando for analisar.',
    finalDescription: 'Crie sua conta para consultar as rodadas, aplicar filtros e acessar o jogo no mesmo aplicativo.',
    finalCta: 'Criar conta e acessar o app',
  },
  comunidade: {
    label: 'COMUNIDADE Paga Bandida', title: <>Troque análises com{' '}<br />quem também joga Aviator.</>,
    description: 'Acompanhe o canal de operações e compartilhe sua leitura com outros jogadores. Use o histórico e as estatísticas do app para levar números à conversa.',
    cta: 'Criar minha conta',
    finalTitle: 'Junte-se à comunidade de jogadores do Paga Bandida.',
    finalDescription: 'Compartilhe suas análises e consulte o histórico para comparar as ideias com os resultados das rodadas.',
    finalCta: 'Criar conta na ganhebetBR',
  },
};
const questions = [
  { title: 'O que você quer observar nas rodadas?', options: ['Entender o histórico dos resultados', 'Analisar multiplicadores acima de 10x', 'Trocar ideias sobre o que aconteceu'] },
  { title: 'O que mais atrapalha sua análise hoje?', options: ['Faltam estatísticas atualizadas', 'Preciso alternar entre o jogo e as ferramentas', 'Falta gente para discutir os dados'] },
  { title: 'Qual recurso você abriria primeiro?', options: ['Histórico com média e mediana', 'Filtros para separar as odds mais altas', 'Comunidade para comparar análises'] },
];
const profiles = [
  { title: 'Comece pelo histórico.', body: 'Você quer consultar os números antes de formar uma opinião. Abra as estatísticas na demonstração abaixo e compare média, mediana e amplitude das rodadas.' },
  { title: 'Explore os multiplicadores.', body: 'Seu interesse está nas odds mais altas. Na demonstração abaixo, selecione “ODD > 10” para separar essas rodadas e consultar as estatísticas do recorte.' },
  { title: 'Conheça a comunidade.', body: 'Você quer discutir suas análises. Acesse o canal de operações e consulte o histórico do app para comparar as ideias com os resultados registrados.' },
];

function CTA({ children = 'Criar minha conta', outline = false }) {
  return <Button tag="a" href={BET_HOUSE.registrationUrl} target="_blank" rel="noopener noreferrer" color="primary" outline={outline}>
    {children}<Icon as={ArrowRight} size={20} />
  </Button>;
}

function Quiz() {
  const [answers, setAnswers] = useState([]);
  const heading = useRef(null);
  const step = answers.length;
  const complete = step === questions.length;
  useEffect(() => { if (step) heading.current?.focus(); }, [step]);
  const scores = [0, 0, 0];
  answers.forEach(answer => { scores[answer] += 1; });
  const profile = profiles[scores.indexOf(Math.max(...scores))];
  return <Card className="lp-quiz" id="seu-perfil" aria-labelledby="quiz-heading">
    <CardBody>
      <div className="lp-quiz-top"><Badge color="primary">Seu perfil de análise</Badge>
        <span className="ds-mono">{complete ? 'Concluído' : `${step + 1} de 3`}</span>
      </div>
      <Progress value={step / questions.length * 100} aria-label="Progresso do quiz" />
      <h2 id="quiz-heading" tabIndex={-1} ref={heading}>{complete ? profile.title : questions[step].title}</h2>
      {complete ? <div className="lp-quiz-result">
        <p>{profile.body}</p><CTA>Criar conta e explorar</CTA>
        <Button color="link" onClick={() => setAnswers([])}>Refazer quiz</Button>
      </div> : <>
        <div className="lp-quiz-options">{questions[step].options.map((option, index) =>
          <Button key={option} color="secondary" onClick={() => setAnswers([...answers, index])}>
            <span className="ds-mono">{index + 1}</span><span>{option}</span><Icon as={ArrowRight} size={16} />
          </Button>)}
        </div>
        {step > 0 && <Button color="link" onClick={() => setAnswers(answers.slice(0, -1))}><Icon as={ChevronLeft} size={16} />Voltar</Button>}
      </>}
      <p className="lp-caption">Sem cadastro para responder. O quiz indica preferências, não apostas.</p>
    </CardBody>
  </Card>;
}

function makeAnalysis(records) {
  return { records, analyzedAt: DEMO_TIME, timings: [3, 10].map(threshold => ({ threshold, ...analyzeAviatorTiming(records, threshold, DEMO_TIME) })) };
}

// Render the same components as the authenticated screens, with a public sample.
function ProductDemo({ initialTab = 'history' }) {
  const [tab, setTab] = useState(initialTab);
  const [activeGame, setActiveGame] = useState(AVIATOR_VERSIONS[0]);
  const [quantity, setQuantity] = useState(10);
  const [oddFilter, setOddFilter] = useState(undefined);
  const [notice, setNotice] = useState('');
  const records = useMemo(() => getDemoRecords(AVIATOR_VERSIONS.findIndex(game => game.id === activeGame.id)), [activeGame.id]);
  const visibleRecords = useMemo(() => records.filter(record => oddFilter == null || record.odd > Number(oddFilter)).slice(0, quantity), [records, quantity, oddFilter]);
  const [analysis, setAnalysis] = useState(() => makeAnalysis(records));
  function selectGame(game) {
    setActiveGame(game);
    setAnalysis(makeAnalysis(getDemoRecords(AVIATOR_VERSIONS.findIndex(item => item.id === game.id))));
    setNotice('');
  }
  return <div className="lp-product-demo" id="demo">
    <div className="lp-demo-label"><span><Icon as={Plane} size={16} />Dentro do Paga Bandida</span><Badge>Amostra demonstrativa</Badge></div>
    <Nav tabs role="tablist" aria-label="Ferramentas do aplicativo">
      {[['history', 'Histórico', BarChart3], ['analysis', 'Análise de horários', Clock3]].map(([key, label, glyph]) =>
        <NavItem key={key}><NavLink tag="button" type="button" role="tab" id={`demo-tab-${key}`} active={tab === key}
          aria-selected={tab === key} aria-controls="demo-panel" onClick={() => { setTab(key); setNotice(''); }}>
          <Icon as={glyph} size={16} />{label}
        </NavLink></NavItem>)}
    </Nav>
    <div className="lp-demo-content aviator-home aviator-pro" id="demo-panel" role="tabpanel" aria-labelledby={`demo-tab-${tab}`}>
      <AviatorGameSelector selected={activeGame.id} onSelect={selectGame} />
      {tab === 'history' ? <HistoryOdds key={activeGame.id} records={visibleRecords} loading={false} numberVelas={quantity}
        onQuantityChange={setQuantity} candleGreaterThan={oddFilter} onOddFilterChange={setOddFilter}
        onRefresh={() => setNotice('Amostra recarregada. Os resultados desta demonstração são fixos.')} /> :
        <AviatorAnalysisPanel activeGame={activeGame} result={analysis} loading={false}
          analyze={() => { setAnalysis(makeAnalysis(records)); setNotice('Análise recalculada sobre as 100 velas da demonstração.'); }} />}
    </div>
    <p className="lp-caption">Selecione “ODD &gt; 10” ou abra “Estatísticas da amostra” para testar. Esta prévia usa dados de exemplo; no app, o histórico acompanha as rodadas.</p>
    <span className="lp-demo-notice" role="status">{notice}</span>
  </div>;
}

function FeatureList() {
  return <ul className="lp-feature-list">
    {[[BarChart3, 'Probabilidades e estatísticas em tempo real'], [Layers, 'Jogo integrado ao app, junto das ferramentas'], [Users, 'Comunidade ativa para trocar análises de Aviator']].map(([glyph, label]) =>
      <li key={label}><Icon as={glyph} size={20} /><span>{label}</span></li>)}
  </ul>;
}

function CommunitySection() {
  return <section className="lp-community lp-section" id="comunidade">
    <div className="lp-community-copy"><span className="lp-eyebrow"><Icon as={MessageCircle} size={16} />Comunidade</span>
      <h2>Leve sua análise{' '}<br />para a conversa.</h2>
      <p>Precisa de ajuda com sua conta? Acesse o atendimento do Paga Bandida. Consulte também as ferramentas do Paga Bandida para acompanhar as rodadas.</p>
      <Button tag="a" href={communityBanners[0].href} target="_blank" rel="noopener noreferrer" color="primary" outline>
        Falar com o suporte<Icon as={ArrowRight} size={20} />
      </Button>
    </div>
    <BannerCarousel banners={communityBanners} />
  </section>;
}

function AnalysisStory() {
  return <section className="lp-section lp-analysis-story" id="recursos">
    <div><span className="lp-eyebrow">Chega de montar o histórico na mão</span><h2>Você abre o grupo, procura o print e volta para o jogo.</h2>
      <p>Para conferir uma sequência, precisa juntar resultados de várias mensagens. No Paga Bandida, você escolhe as rodadas e aplica os filtros no próprio histórico.</p>
      <CTA>Quero o histórico no app</CTA>
    </div>
    <dl className="lp-problems">
      <div><dt>O print mostra só um pedaço da sequência.</dt><dd>Consulte até 1.000 velas e escolha a versão do Aviator que está acompanhando.</dd></div>
      <div><dt>Você procura as odds altas uma por uma.</dt><dd>Filtre resultados acima de 10x, 20x, 30x, 50x ou 100x. Veja as estatísticas das velas que ficaram no recorte.</dd></div>
      <div><dt>Para conferir um número, precisa sair do jogo.</dt><dd>Acesse o jogo e as ferramentas dentro do Paga Bandida. Histórico e análise ficam no mesmo aplicativo.</dd></div>
    </dl>
  </section>;
}

function Questions() {
  return <section className="lp-section lp-faq" id="duvidas"><div><span className="lp-eyebrow"><Icon as={CircleHelp} size={16} />Dúvidas</span><h2>Sobre o aplicativo</h2></div>
    <div>{[
      ['O aplicativo prevê a próxima rodada?', 'Não. As probabilidades são estimativas e as análises usam o histórico. Elas não garantem o resultado das próximas rodadas.'],
      ['Como encontro os multiplicadores mais altos no histórico?', 'Escolha um filtro acima de 10x, 20x, 30x, 50x ou 100x. O histórico mostra as velas desse recorte e permite consultar suas estatísticas. Você pode testar os filtros na demonstração desta página.'],
      ['Preciso abrir outro site para acessar o jogo?', 'O jogo está integrado ao Paga Bandida. Você acessa as rodadas e as ferramentas de análise dentro do aplicativo.'],
    ].map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
  </section>;
}

export default function AviatorLanding() {
  const { variant: routeVariant } = useParams();
  const variant = content[routeVariant] ? routeVariant : 'quiz';
  const current = content[variant];
  const [menu, setMenu] = useState(false);
  useTrackingParams();
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Paga Bandida | ${variant === 'quiz' ? 'Quiz Aviator' : variant === 'analise' ? 'Histórico e análise' : 'Comunidade Aviator'}`;
    window.scrollTo(0, 0); setMenu(false);
    return () => { document.title = previousTitle; };
  }, [variant]);
  return <main className={`pagabandida-landing fx lp-page-${variant}`}>
    <a href="#conteudo" className="lp-skip">Ir para o conteúdo</a>
    <div className="lp-review-bar"><div className="lp-shell"><span>Versões da landing page</span><nav aria-label="Versões da landing page">
      {versions.map(([key, label]) => <Link key={key} to={`/lp/${key}${window.location.search}`} aria-current={variant === key ? 'page' : undefined}>{label}</Link>)}
    </nav></div></div>
    <div className="lp-shell">
      <header className="lp-header"><Link to="/lp" className="lp-brand"><img src={logo} alt="Paga Bandida" /></Link>
        <nav id="lp-navigation" className={menu ? 'lp-nav is-open' : 'lp-nav'} aria-label="Navegação principal">
          <a href="#demo" onClick={() => setMenu(false)}>Conhecer o app</a><a href="#comunidade" onClick={() => setMenu(false)}>Comunidade</a><a href="#duvidas" onClick={() => setMenu(false)}>Dúvidas</a>
        </nav>
        <div className="lp-header-actions"><ThemeToggle aria-label="Modo claro" /><Button tag={Link} to="/auth/login" color="secondary">Entrar</Button>
          <button className="lp-menu" aria-expanded={menu} aria-controls="lp-navigation" aria-label={menu ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenu(!menu)}><Icon as={menu ? X : Menu} size={22} /></button>
        </div>
      </header>
      <section className="lp-hero" id="conteudo">
        <div className="lp-hero-copy"><span className="lp-eyebrow"><Icon as={variant === 'comunidade' ? Users : Plane} size={16} />{current.label}</span>
          <h1>{current.title}</h1><p className="lp-lead">{current.description}</p>
          {variant === 'quiz' ? <p className="lp-quiz-invitation"><Icon as={ArrowRight} size={20} />Responda às 3 perguntas. Veja sua indicação na hora.</p> : <div className="lp-hero-actions"><CTA>{current.cta}</CTA><a href="#demo" className="lp-text-link">Testar o histórico<Icon as={ArrowRight} size={16} /></a></div>}
          <FeatureList />
          <p className="lp-caption">18+ · Ferramentas de análise. Sem garantia de ganhos.</p>
        </div>
        {variant === 'quiz' ? <Quiz /> : variant === 'comunidade' ? <div className="lp-community-hero" id="comunidade"><BannerCarousel banners={communityBanners} /><p className="lp-caption">Suporte do Paga Bandida.</p></div> : <ProductDemo key={variant} />}
      </section>
      {variant === 'analise' && <AnalysisStory />}
      {variant !== 'analise' && <section className="lp-section lp-full-demo" aria-labelledby="demo-heading">
        <div className="lp-section-title"><div><span className="lp-eyebrow">Teste antes de criar sua conta</span><h2 id="demo-heading">Encontre as rodadas que quer estudar.</h2></div><p>Escolha a versão do Aviator, filtre as odds e abra as estatísticas. A demonstração abaixo já funciona.</p></div>
        <ProductDemo key={variant} />
      </section>}
      <section className="lp-section lp-tools"><div><span className="lp-eyebrow">Suas ferramentas no Paga Bandida</span><h2>Filtre as rodadas.{' '}<br />Compare os números.</h2><p>Consulte média, mediana e amplitude dos resultados. Na análise de horários, compare os intervalos das rodadas acima de 3x e 10x.</p><ul className="lp-checklist"><li><Icon as={Check} size={16} />Aviator Original, VIP e Premium</li><li><Icon as={Check} size={16} />Filtros de odds e destaque de padrões visuais</li><li><Icon as={Check} size={16} />Estatísticas das velas carregadas, com seus filtros aplicados</li></ul><CTA>Criar conta e analisar</CTA></div><AviatorTools /></section>
      {variant !== 'comunidade' && <CommunitySection />}
      <Questions />
      <section className="lp-final glass edge"><div><h2>{current.finalTitle}</h2><p>{current.finalDescription}</p></div><CTA>{current.finalCta}</CTA></section>
      <footer className="lp-footer"><Link to="/lp" className="lp-brand"><img src={logo} alt="Paga Bandida" /></Link><p><strong>18+</strong> Jogar envolve risco de perda financeira. Defina limites. Resultados passados não garantem resultados futuros.</p><span>© {new Date().getFullYear()} Paga Bandida</span></footer>
    </div>
  </main>;
}
