import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, CircleCheck, Clock3, Gift, LoaderCircle, RefreshCw, Ticket, Wallet, X } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import { useCouponList, useCouponRedemption } from "hooks/useCoupons";
import { couponCode, couponDate, couponFieldError, couponItemStatus, couponMoney, couponNextAction, couponNumber, couponRequirements, couponResultStatus, couponRewardDetails, couponStatus, couponStatusTone, couponText, requirementProgress, requirementTitle } from "services/couponPresentation";
import "./CouponModal.css";

function Status({ value }) {
  return <span className={`coupon-status coupon-status--${couponStatusTone(value)}`}>{couponStatus(value)}</span>;
}
function RewardDetails({ item, pending }) {
  const entries = couponRewardDetails(item.rewardDetail, item.currency, item.rewardType);
  if (pending && !entries.length) return null;
  return <div className="coupon-reward"><h4>{pending ? "Recompensa vinculada" : "Detalhes da recompensa"}</h4>
    {entries.length ? <dl>{entries.map((entry, index) => <div key={`${entry.label}:${index}`}><dt>{entry.label}</dt><dd>{entry.value}</dd></div>)}</dl> : <p>Detalhes da recompensa não informados.</p>}
  </div>;
}
function Requirements({ item, onClose }) {
  const requirements = couponRequirements(item.requirements);
  const action = couponNextAction(item);
  const total = couponNumber(item.requirementsSummary?.totalRequirements ?? item.requirementsSummary?.total);
  const completed = couponNumber(item.requirementsSummary?.completedRequirements ?? item.requirementsSummary?.completed);
  return <div className="coupon-requirements">
    <h4>Requisitos para liberação</h4>
    {total > 0 && completed != null && <p>{completed.toLocaleString("pt-BR")} de {total.toLocaleString("pt-BR")} requisitos concluídos</p>}
    {requirements.length ? <ul>{requirements.map((requirement, index) => {
      const progress = requirementProgress(requirement);
      return <li key={requirement.id || index}>
        <div className="coupon-requirement-heading"><strong>{requirementTitle(requirement)}</strong><span>{progress.completed ? "Concluído" : requirement.status ? couponStatus(requirement.status) : "Pendente"}</span></div>
        {couponText(requirement.description) && <p>{requirement.description}</p>}
        {progress.detail && <p>{progress.detail}</p>}
        {couponNumber(requirement.remainingAmount) > 0 && <p>Faltam {requirement.type === "deposit" ? couponMoney(requirement.remainingAmount, requirement.currency) : couponNumber(requirement.remainingAmount).toLocaleString("pt-BR")} para concluir.</p>}
        {requirement.deadlineAt && <p>Prazo: {couponDate(requirement.deadlineAt)}</p>}
        {progress.percent != null && <progress max="100" value={progress.percent} aria-label={`Progresso: ${requirementTitle(requirement)}`} />}
      </li>;
    })}</ul> : <p>Os detalhes dos requisitos ainda não foram informados. Atualize para conferir.</p>}
    {action.message && <p className="coupon-next-action">{action.message}</p>}
    {action.deposit && <Link className="coupon-secondary" to="/admin/deposit" onClick={onClose}><Icon as={Wallet} size={16} /> Ir para depósito</Link>}
  </div>;
}
function CouponCard({ item, pending, onClose }) {
  const status = couponItemStatus(item);
  const needsRequirements = pending || status?.toLowerCase() === "pending_requirements";
  return <article className="coupon-card">
    <header><strong className="coupon-code">{couponCode(item)}</strong><Status value={status} /></header>
    {!pending && <p className="coupon-card-date">{couponDate(item.redeemedAt || item.createdAt || item.redemption?.createdAt)}</p>}
    {needsRequirements && <p className="coupon-pending-note">A recompensa ainda depende da conclusão dos requisitos.</p>}
    <RewardDetails item={item} pending={needsRequirements} />
    {needsRequirements && <Requirements item={item} onClose={onClose} />}
  </article>;
}
function CouponList({ collection, pending, onClose }) {
  const title = pending ? "Recompensas pendentes" : "Histórico de resgates";
  return <section className="coupon-collection" aria-label={title} aria-busy={collection.loading}>
    <div className="coupon-collection-heading"><h3>{title}</h3><button type="button" className="coupon-icon-button" aria-label={`Atualizar ${title.toLowerCase()}`} onClick={collection.retry} disabled={collection.loading}><Icon as={RefreshCw} size={17} /></button></div>
    {collection.loading ? <div className="coupon-list-state" role="status"><Icon as={LoaderCircle} size={22} className="coupon-spinner" /> Carregando {title.toLowerCase()}…</div> : collection.error ? <div className="coupon-list-state coupon-error" role="alert"><p>{collection.error.message}</p><button className="coupon-secondary" type="button" onClick={collection.retry}>Tentar novamente</button></div> : collection.items.length ?
      <div className="coupon-cards">{collection.items.map((item, index) => <CouponCard key={`${item.id || couponCode(item)}:${index}`} item={item} pending={pending} onClose={onClose} />)}</div> :
      <div className="coupon-list-state"><Icon as={pending ? Gift : Ticket} size={24} /><strong>{pending ? "Nenhuma recompensa pendente" : "Nenhum resgate nesta página"}</strong><p>{pending ? "Se houver requisitos após um resgate, eles aparecerão aqui." : "Os cupons resgatados aparecerão no seu histórico."}</p></div>}
    <nav className="coupon-pagination" aria-label={`Paginação: ${title.toLowerCase()}`}>
      <button className="coupon-secondary" type="button" aria-label={`Página anterior: ${title.toLowerCase()}`} disabled={collection.loading || collection.offset === 0} onClick={() => collection.page(collection.offset - collection.limit)}><Icon as={ChevronLeft} size={16} /> Anterior</button>
      <span>Página {Math.floor(collection.offset / collection.limit) + 1}{collection.total != null && <small>{collection.total.toLocaleString("pt-BR")} registros</small>}</span>
      <button className="coupon-secondary" type="button" aria-label={`Próxima página: ${title.toLowerCase()}`} disabled={collection.loading || Boolean(collection.error) || !collection.hasMore} onClick={() => collection.page(collection.offset + collection.limit)}>Próxima <Icon as={ChevronRight} size={16} /></button>
    </nav>
  </section>;
}

export default function CouponModal({ open, onClose }) {
  const [code, setCode] = useState("");
  const [tab, setTab] = useState("pending");
  const input = useRef(null);
  const panel = useRef(null);
  const pending = useCouponList("pending", open);
  const history = useCouponList("history", open);
  const reloadPending = pending.reload, reloadHistory = history.reload;
  const refreshAfterRedeem = useCallback(() => { reloadPending(); reloadHistory(); }, [reloadPending, reloadHistory]);
  const redemption = useCouponRedemption(refreshAfterRedeem);
  const resultStatus = couponResultStatus(redemption.result);
  const requirementsPending = resultStatus?.toLowerCase() === "pending_requirements";
  const fieldError = couponFieldError(redemption.error);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const root = document.getElementById("root");
    const previousInert = root?.inert;
    if (root) root.inert = true;
    document.body.style.overflow = "hidden";
    (input.current?.disabled ? panel.current : input.current)?.focus();
    const onKey = event => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const controls = Array.from(panel.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href]') || []);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      if (root) root.inert = previousInert;
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  const submit = event => { event.preventDefault(); if (!redemption.result) redemption.submit(code); };
  return createPortal(<div className="coupon-layer">
    <button className="coupon-backdrop" type="button" aria-label="Fechar cupons" tabIndex={-1} onClick={onClose} />
    <section className="coupon-modal" role="dialog" aria-modal="true" aria-labelledby="coupon-modal-title" ref={panel} tabIndex={-1}>
      <header className="coupon-modal-heading"><span className="coupon-heading-icon"><Icon as={Ticket} size={23} /></span><div><span className="coupon-eyebrow">ganhebetBR</span><h2 id="coupon-modal-title">Meus cupons</h2></div><button className="coupon-icon-button" type="button" onClick={onClose} aria-label="Fechar modal de cupons"><Icon as={X} size={21} /></button></header>
      <p className="coupon-intro">Resgate seu código e acompanhe os requisitos e as recompensas.</p>
      <form className="coupon-form" onSubmit={submit} aria-busy={redemption.loading}>
        <label htmlFor="global-coupon-code">Código do cupom</label>
        <div className="coupon-form-row"><input id="global-coupon-code" ref={input} value={code} maxLength={128} autoComplete="off" spellCheck={false} placeholder="Digite seu código" disabled={redemption.loading} required aria-invalid={Boolean(redemption.error)} aria-describedby={redemption.error ? "coupon-redeem-error" : undefined} onChange={event => { setCode(event.target.value); redemption.resetFeedback(); }} /><button className="coupon-primary" type="submit" disabled={redemption.loading || !code.trim() || Boolean(redemption.result)}>{redemption.loading ? <><Icon as={LoaderCircle} size={17} className="coupon-spinner" /> Resgatando…</> : redemption.error?.uncertain ? "Tentar novamente" : "Resgatar"}</button></div>
        {redemption.error && <div id="coupon-redeem-error" className="coupon-feedback coupon-error" role="alert"><p>{fieldError || redemption.error.message}</p>{redemption.error.uncertain && <p>O resultado ainda não foi confirmado. Tente novamente para conferir esta solicitação.</p>}</div>}
        {redemption.result && <div className={`coupon-feedback ${requirementsPending ? "coupon-feedback--pending" : "coupon-feedback--registered"}`} role="status"><Icon as={requirementsPending ? Clock3 : CircleCheck} size={18} /><div><strong>{requirementsPending ? "Cupom registrado: requisitos pendentes" : "Resgate registrado"}</strong><p>{requirementsPending ? "A recompensa ainda não foi liberada. Confira abaixo o que falta concluir." : "Consulte os detalhes no histórico e confira se há alguma pendência."}</p></div></div>}
        {(redemption.error?.authRequired || pending.error?.authRequired || history.error?.authRequired) && <Link className="coupon-secondary" to="/auth/login" onClick={onClose}>Entrar novamente</Link>}
      </form>
      <div className="coupon-tabs" role="group" aria-label="Listas de cupons"><button type="button" aria-pressed={tab === "pending"} onClick={() => setTab("pending")}>Pendências</button><button type="button" aria-pressed={tab === "history"} onClick={() => setTab("history")}>Histórico</button></div>
      <CouponList collection={tab === "pending" ? pending : history} pending={tab === "pending"} onClose={onClose} />
      <p className="coupon-time-note">Datas e horários de Brasília.</p>
    </section>
  </div>, document.body);
}
