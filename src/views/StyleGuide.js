import React, { useContext, useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, CardTitle, Badge, Alert, Input, FormGroup, Label, FormText,
  Progress, Nav, NavItem, NavLink, TabContent, TabPane, Dropdown, DropdownToggle, DropdownMenu, DropdownItem,
  Table, Modal, ModalHeader, ModalBody, ModalFooter, Toast, ToastHeader, ToastBody, CustomInput } from "reactstrap";
import { Layers, Palette, Type, Box, Check, CircleAlert, Info, ShieldCheck, Flower2, TrendingDown, Target,
  Radar, Gem, Flame, Sparkles, Moon, Sun, Zap, Lock, Bell, ArrowRight } from "lucide-react";
import Swal from "sweetalert2";
import { ThemeContext } from "contexts/ThemeContext";
import Icon from "components/DesignSystem/Icon";
import Switch from "components/DesignSystem/Switch";
import ThemeToggle from "components/DesignSystem/ThemeToggle";
import MotionToggle from "components/DesignSystem/MotionToggle";
import { contrastRatio, composite } from "services/designContrast";
import "./StyleGuide.css";

const colorSamples = [
  ["Fundo", "--bg", true], ["Fundo secundário", "--bg-2", true], ["Vidro", "--surface", true],
  ["Superfície", "--surface-solid", true], ["Superfície 2", "--surface-2", true], ["Superfície 3", "--surface-3", true],
  ["Texto", "--text"], ["Texto secundário", "--text-2"], ["Texto discreto", "--text-3"],
  ["Primária", "--primary", "primary"], ["Primária para texto", "--primary-text"], ["Rosa", "--pink"],
  ["Sucesso", "--success"], ["Aviso", "--warning"], ["Erro", "--danger"], ["Informação", "--info"],
];
const alertSamples = [
  ["Rosas", "rosas", Flower2], ["Baixos", "baixos", TrendingDown], ["Distância 30x", "d30", Target],
  ["Distância 100x", "d100", Radar], ["1000x", "1000", Gem], ["Quente", "quente", Flame],
];
const spaces = [4, 8, 12, 16, 20, 24, 32, 40, 56];
const radii = [8, 12, 14, 16, 20, 24, "pill"];
const typeSamples = [
  ["display-xl", "1.250 XP", "44 / 48 · 700 · Mono"], ["display", "Fundação visual", "36 / 40 · 700 · Chakra"],
  ["h1", "Títulos de página", "28 / 34 · 700 · Chakra"], ["h2", "Títulos de seção", "20 / 26 · 600 · Chakra"],
  ["body", "Uma base consistente para os próximos pedidos.", "15 / 22 · 400 · Sora"],
  ["body-sm", "Texto de apoio, descrições e instruções.", "13,5 / 20 · 400 · Sora"],
  ["caption", "ATUALIZADO ÀS 20:42", "12 / 16 · 600 · Sora"],
];

function Section({ id, number, title, description, children }) {
  return <section id={id} className="sg-section" aria-labelledby={`${id}-heading`}>
    <header className="sg-section__heading"><span className="sg-number ds-mono">{number}</span>
      <div><h2 id={`${id}-heading`}>{title}</h2><p>{description}</p></div></header>{children}
  </section>;
}

export default function StyleGuide() {
  const { theme, reduceMotion, systemReducedMotion, manualReduceMotion, themePreference, followSystemTheme } = useContext(ThemeContext);
  const [colors, setColors] = useState({});
  const [exampleSwitch, setExampleSwitch] = useState(true);
  const [tab, setTab] = useState("base");
  const [dropdown, setDropdown] = useState(false);
  const [modal, setModal] = useState(false);
  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const keys = [...colorSamples.map(([, name]) => name), ...alertSamples.map(([, name]) => `--a-${name}`), "--on-primary", "--hero"];
    setColors(Object.fromEntries(keys.map(key => [key, style.getPropertyValue(key).trim()])));
  }, [theme]);
  const ratio = (name, background = false) => {
    if (!colors[name] || !colors["--surface-solid"]) return "—";
    const foreground = background === "primary" ? colors["--on-primary"] : background ? colors["--text"] : colors[name];
    const base = background ? composite(colors[name], colors["--bg"]) : colors["--surface-solid"];
    return `${contrastRatio(foreground, base).toFixed(2).replace(".", ",")}:1`;
  };
  const showPopup = toast => Swal.fire({
    title: toast ? "Exemplo de toast" : "Exemplo de confirmação",
    text: toast ? "O tema acompanha o aplicativo." : "Esta janela demonstra os componentes. Nenhuma operação será executada.",
    icon: "info", toast, position: toast ? "top-end" : "center", showCancelButton: !toast,
    showConfirmButton: !toast, showCloseButton: toast, confirmButtonText: "Continuar", cancelButtonText: "Voltar",
    showClass: { popup: "swal2-show" }, hideClass: { popup: "swal2-hide" },
  });

  return <main className="styleguide fx">
    <div className="sg-shell">
      <header className="sg-header">
        <div><span className="sg-eyebrow ds-caption"><Icon as={Layers} size={16} /> Paga Bandida · FUNDAÇÃO 01</span>
          <h1 className="ds-display">Fundação visual</h1>
          <p>Paleta, tipografia e estados dos componentes. A base para os próximos três pedidos.</p>
          <div className="sg-meta"><Badge pill color="primary"><Icon as={theme === "dark" ? Moon : Sun} size={16} />{theme === "dark" ? "Modo escuro" : "Modo claro"}</Badge><span className="ds-mono">Bootstrap 4 + reactstrap</span></div>
        </div>
        <div className="sg-preferences glass edge" aria-label="Preferências de aparência">
          <ThemeToggle /> <MotionToggle />
          <p>{systemReducedMotion && manualReduceMotion == null ? "Seguindo a preferência de movimento do sistema." : "As preferências são salvas neste navegador."}</p>
          <Button color="link" onClick={followSystemTheme} disabled={!themePreference}>Seguir tema do sistema</Button>
        </div>
      </header>
      <nav className="sg-nav" aria-label="Seções do guia">
        {[["paleta", "Paleta", Palette], ["tipografia", "Tipografia", Type], ["primitivos", "Primitivos", Box], ["componentes", "Componentes", Layers]].map(([id, label, glyph]) => <a key={id} href={`#${id}`}><Icon as={glyph} size={16} />{label}</a>)}
      </nav>

      <Section id="paleta" number="01" title="Paleta e contraste" description="Razões WCAG calculadas com os valores dos tokens do tema ativo.">
        <div className="sg-palette">{(theme === "light" ? [...colorSamples, ["Destaque profundo", "--hero", "primary"]] : colorSamples).map(([label, token, background]) => <div className="sg-swatch glass" key={token}>
          <span className="sg-swatch__color" style={{ background: `var(${token})` }} aria-hidden="true" />
          <div><strong>{label}</strong><code>{token}</code><span className="ds-mono">{colors[token] || "—"}</span></div>
          <span className="sg-ratio ds-mono" title={background === "primary" ? "Texto branco sobre primária" : background ? "Texto principal sobre esta superfície" : "Esta cor sobre a superfície sólida"}>{ratio(token, background)}</span>
        </div>)}</div>
        <p className="sg-note">Cores de texto e alertas medidos sobre <code>--surface-solid</code>. Superfícies usam <code>--text</code>; primária usa texto branco. O botão adiciona uma camada de 14% de preto ao gradiente para manter AA em toda a área.</p>
        <h3 className="sg-subtitle">Seis alertas · ícone e nome sempre juntos</h3>
        <div className="sg-alert-grid">{alertSamples.map(([name, id, glyph]) => <div className="glass sg-alert-sample" key={id}>
          <Badge className={`ds-alert-badge ds-alert-${id}`}><Icon as={glyph} size={16} />{name}</Badge>
          <code>{`--a-${id}`}</code><span className="ds-mono">{ratio(`--a-${id}`)}</span>
        </div>)}</div>
      </Section>

      <Section id="tipografia" number="02" title="Tipografia" description="Fontes locais: Chakra Petch, Sora e JetBrains Mono. Escala em rem, base 16 px.">
        <div className="glass edge sg-type">{typeSamples.map(([name, text, metrics]) => <div className="sg-type__row" key={name}>
          <code>{name}</code><span className={`ds-${name}`}>{text}</span><span className="sg-type__metrics ds-mono">{metrics}</span>
        </div>)}</div>
        <p className="sg-note">Números com largura fixa: <span className="ds-mono">00:00 · 11:11 · 88:88 · 3,00x · 10,00x</span>. Texto mínimo de 12 px. O tamanho acompanha o zoom do navegador.</p>
      </Section>

      <Section id="primitivos" number="03" title="Espaço, forma e efeitos" description="Escala base 4, raios compartilhados e efeitos estáticos do guia.">
        <div className="sg-grid sg-grid--two">
          <Card><CardHeader><CardTitle tag="h3">Espaçamento</CardTitle></CardHeader><CardBody><div className="sg-spaces">{spaces.map(value => <div key={value}><span style={{ width: `var(--space-${value / 4})`, height: `var(--space-${value / 4})` }} /><code>{value}</code></div>)}</div></CardBody></Card>
          <Card><CardHeader><CardTitle tag="h3">Raios</CardTitle></CardHeader><CardBody><div className="sg-radii">{radii.map(value => <div key={value}><span style={{ borderRadius: `var(--radius-${value})` }} /><code>{value}</code></div>)}</div></CardBody></Card>
        </div>
        <div className="sg-grid sg-grid--three sg-shadows">
          <div className="glass"><code>--shadow-card</code><span>Superfície e profundidade</span></div>
          <div className="glass sg-shadow-glow"><code>--shadow-glow</code><span>Brilho roxo e sombra</span></div>
          <div className="glass ds-focus-preview"><code>Foco: 2 px + 3 px</code><span>Anel e brilho externo</span></div>
        </div>
        <div className="sg-effect-demo glass edge"><div><h3>Vidro, borda e grade</h3><p><code>.glass</code> limita o blur a 16 px e tem fallback sólido. <code>.edge</code> acompanha o raio. <code>.fx</code> usa apenas gradientes e partículas estáticas.</p></div><Badge color="primary"><Icon as={reduceMotion ? ShieldCheck : Sparkles} size={16} />{reduceMotion ? "Efeitos reduzidos" : "Efeitos estáticos"}</Badge></div>
        <div className="sg-icons glass">{[16, 20, 22, 26].map(size => <div key={size}><Icon as={Bell} size={size} /><code>{size} px</code></div>)}<p>Lucide · grade 24 · traço 1,75 · <code>currentColor</code></p></div>
      </Section>

      <Section id="componentes" number="04" title="Componentes e estados" description="A mesma marcação Bootstrap/reactstrap, com uma camada visual baseada nos tokens.">
        <Card><CardHeader><CardTitle tag="h3">Botões · altura mínima 48 px</CardTitle></CardHeader><CardBody className="sg-stack">
          <div className="sg-row"><Button color="primary">Primário <Icon as={ArrowRight} size={16} /></Button><Button color="secondary">Secundário</Button><Button color="primary" outline>Contorno</Button><Button color="primary" className="ds-focus-preview">Foco</Button><Button color="primary" disabled>Desabilitado</Button><Button color="danger"><Icon as={CircleAlert} size={16} />Erro</Button></div>
        </CardBody></Card>

        <h3 className="sg-subtitle">Cards</h3><div className="sg-grid sg-grid--four">
          {[['Normal', null, false], ['Foco', 'ds-focus-preview', false], ['Desabilitado', null, true], ['Erro', 'sg-card-error', false]].map(([name, className, disabled]) => <Card className={className || ""} aria-disabled={disabled || undefined} key={name}><CardBody><Icon as={name === "Erro" ? CircleAlert : Layers} size={22} /><h4>{name}</h4><p>Superfície, borda e sombra do tema.</p>{disabled && <Badge><Icon as={Lock} size={16} />Bloqueado</Badge>}</CardBody></Card>)}
        </div>

        <div className="sg-grid sg-grid--two">
          <Card><CardHeader><CardTitle tag="h3">Selos e multiplicadores</CardTitle></CardHeader><CardBody className="sg-row"><Badge className="ds-badge-3x"><Icon as={Zap} size={16} />3x</Badge><Badge className="ds-badge-10x"><Icon as={Flower2} size={16} />10x</Badge><Badge pill className="ds-badge-level"><Icon as={Gem} size={16} />Nível 7</Badge><Badge className="ds-focus-preview">Foco</Badge><Badge><Icon as={Lock} size={16} />Bloqueado</Badge></CardBody></Card>
          <Card><CardHeader><CardTitle tag="h3">Switches · 46 × 28 px</CardTitle></CardHeader><CardBody className="sg-stack"><Switch checked={exampleSwitch} onChange={setExampleSwitch} label="Ligado / desligado" /><Switch checked={false} label="Foco" className="ds-focus-preview" /><Switch checked disabled label="Bloqueado" /><CustomInput id="sg-bootstrap-switch" type="switch" label="Switch do reactstrap" /></CardBody></Card>
        </div>

        <Card><CardHeader><CardTitle tag="h3">Formulários</CardTitle></CardHeader><CardBody><div className="sg-grid sg-grid--four">
          <FormGroup><Label for="sg-field-normal">Normal</Label><Input id="sg-field-normal" placeholder="Digite uma opção" /><FormText>Texto de apoio.</FormText></FormGroup>
          <FormGroup><Label for="sg-field-focus">Foco</Label><Input id="sg-field-focus" className="ds-focus-preview" placeholder="Foco visível" /></FormGroup>
          <FormGroup><Label for="sg-field-disabled">Desabilitado</Label><Input id="sg-field-disabled" disabled placeholder="Indisponível" /></FormGroup>
          <FormGroup><Label for="sg-field-error">Erro</Label><Input id="sg-field-error" invalid aria-invalid="true" aria-describedby="sg-field-error-message" placeholder="Escolha uma opção" /><div id="sg-field-error-message" className="invalid-feedback"><Icon as={CircleAlert} size={16} /> Campo obrigatório.</div></FormGroup>
        </div><FormGroup><Label for="sg-select">Seleção</Label><Input type="select" id="sg-select"><option>Opção de exemplo</option><option>Outra opção</option></Input></FormGroup></CardBody></Card>

        <div className="sg-grid sg-grid--two">
          <Card><CardHeader><CardTitle tag="h3">Progresso · 10 px</CardTitle></CardHeader><CardBody className="sg-stack"><div className="sg-between"><span>Progresso de exemplo</span><span className="ds-mono">64%</span></div><Progress value={64} aria-label="Progresso de exemplo" /><Progress value={0} aria-label="Progresso vazio" /><Progress value={100} aria-label="Progresso completo" /></CardBody></Card>
          <Card><CardHeader><CardTitle tag="h3">Abas e dropdown</CardTitle></CardHeader><CardBody className="sg-stack"><Nav tabs role="tablist"><NavItem><NavLink tag="button" type="button" role="tab" id="sg-tab-base" aria-controls="sg-panel-base" aria-selected={tab === "base"} active={tab === "base"} onClick={() => setTab("base")}>Base</NavLink></NavItem><NavItem><NavLink tag="button" type="button" role="tab" id="sg-tab-states" aria-controls="sg-panel-states" aria-selected={tab === "states"} active={tab === "states"} onClick={() => setTab("states")}>Estados</NavLink></NavItem><NavItem><NavLink tag="button" type="button" disabled>Bloqueado</NavLink></NavItem></Nav><TabContent activeTab={tab}><TabPane tabId="base" id="sg-panel-base" aria-labelledby="sg-tab-base">Cores e superfícies do tema ativo.</TabPane><TabPane tabId="states" id="sg-panel-states" aria-labelledby="sg-tab-states">Normal, foco, desabilitado e erro.</TabPane></TabContent><Dropdown isOpen={dropdown} toggle={() => setDropdown(value => !value)}><DropdownToggle caret color="secondary">Escolher opção</DropdownToggle><DropdownMenu><DropdownItem>Normal</DropdownItem><DropdownItem className="ds-focus-preview">Foco</DropdownItem><DropdownItem disabled>Bloqueado</DropdownItem></DropdownMenu></Dropdown></CardBody></Card>
        </div>

        <Card><CardHeader><CardTitle tag="h3">Tabela</CardTitle></CardHeader><CardBody><Table responsive striped hover><caption>Amostra de estados; nenhum dado real é exibido.</caption><thead><tr><th scope="col">Estado</th><th scope="col">Multiplicador</th><th scope="col">Horário</th></tr></thead><tbody><tr><td><Badge color="success"><Icon as={Check} size={16} />Ativo</Badge></td><td className="ds-mono">3,24x</td><td><time>20:42:15</time></td></tr><tr><td><Badge><Icon as={Lock} size={16} />Bloqueado</Badge></td><td className="ds-mono">10,00x</td><td><time>20:41:05</time></td></tr><tr><td><Badge color="danger"><Icon as={CircleAlert} size={16} />Erro</Badge></td><td className="ds-mono">—</td><td><time>—</time></td></tr></tbody></Table></CardBody></Card>

        <div className="sg-grid sg-grid--two"><Card><CardHeader><CardTitle tag="h3">Mensagens e toasts</CardTitle></CardHeader><CardBody className="sg-stack"><Alert color="success"><Icon as={Check} size={20} /> Exemplo de sucesso.</Alert><Alert color="danger"><Icon as={CircleAlert} size={20} /> Confira a opção selecionada.</Alert><Toast fade={false}><ToastHeader icon={<Icon as={Info} size={16} />}>Informação</ToastHeader><ToastBody>O toast acompanha o tema e mantém o texto legível.</ToastBody></Toast></CardBody></Card><Card><CardHeader><CardTitle tag="h3">Modais e SweetAlert2</CardTitle></CardHeader><CardBody className="sg-stack"><p>Abra os exemplos para revisar superfície, foco, botões e fechamento por teclado.</p><Button color="secondary" onClick={() => setModal(true)}>Abrir modal reactstrap</Button><Button color="primary" onClick={() => showPopup(false)}>Abrir SweetAlert2</Button><Button color="primary" outline onClick={() => showPopup(true)}>Mostrar toast SweetAlert2</Button></CardBody></Card></div>
      </Section>
      <footer className="sg-footer"><span className="ds-caption">Fundação 01 · somente desenvolvimento</span><p>Sem novas telas, sem mudanças de layout e sem chamadas ao BFF.</p></footer>
    </div>
    <Modal isOpen={modal} toggle={() => setModal(false)} centered fade={!reduceMotion} labelledBy="sg-modal-title"><ModalHeader id="sg-modal-title" toggle={() => setModal(false)}>Modal de exemplo</ModalHeader><ModalBody><p>Esta é uma demonstração de estados.</p><Input aria-label="Campo de exemplo do modal" placeholder="Campo com foco acessível" /></ModalBody><ModalFooter><Button color="secondary" onClick={() => setModal(false)}>Voltar</Button><Button color="primary" onClick={() => setModal(false)}>Continuar</Button></ModalFooter></Modal>
  </main>;
}
