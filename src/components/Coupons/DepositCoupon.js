import React from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Clock3, Ticket } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import { AVIATOR_COUPON_PROMOTION, isAviatorPromotion } from "config/couponPromotion";
import { couponFieldError, couponResultStatus, couponStatus } from "services/couponPresentation";
import "./DepositCoupon.css";

export function DepositCouponConfirmation({ code, result, compact = false }) {
  const status = couponResultStatus(result);
  const pending = status === "pending_requirements";
  return <div className={`deposit-coupon-confirmation${compact ? " deposit-coupon-confirmation--compact" : ""}`} role="status">
    <Icon as={pending ? Clock3 : Check} size={19} />
    <div><strong>Cupom {code.trim()} registrado</strong>
      <p>{pending ? "A recompensa ainda não foi liberada. O depósito precisa ser confirmado e os requisitos concluídos." : couponStatus(status)}</p>
    </div>
  </div>;
}

export default function DepositCoupon({ open, onToggle, code, onCodeChange, redemption, inputRef, disabled, amount, onUseMinimum, gateError, onContinueWithout }) {
  const promotion = isAviatorPromotion(code) ? AVIATOR_COUPON_PROMOTION : null;
  const locked = disabled || redemption.loading;
  const activate = () => { if (!locked && code.trim() && !redemption.result) redemption.submit(code); };
  return <section className="deposit-coupon" aria-label="Cupom no depósito">
    <button type="button" className="deposit-coupon-toggle" aria-expanded={open} aria-controls="deposit-coupon-fields" onClick={onToggle} disabled={locked}>
      <Icon as={Ticket} size={20} /><span>{redemption.result ? "Seu cupom" : "Possui cupom?"}<small>{redemption.result ? "Registrado na sua conta" : "Digite abaixo e ative antes de pagar"}</small></span><Icon as={ChevronDown} size={18} className={open ? "is-open" : ""} />
    </button>
    {open && <div id="deposit-coupon-fields" className="deposit-coupon-fields">
      {redemption.result ? <DepositCouponConfirmation code={code} result={redemption.result} /> : <>
        <label className="deposit-label" htmlFor="deposit-coupon-code">Código do cupom <span>(opcional)</span></label>
        <div className="deposit-coupon-row"><input id="deposit-coupon-code" ref={inputRef} value={code} maxLength={128} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="Digite seu cupom" disabled={locked} aria-invalid={Boolean(redemption.error || gateError)} aria-describedby={redemption.error || gateError ? "deposit-coupon-error" : "deposit-coupon-hint"} onChange={event => onCodeChange(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); activate(); } }} />
          <button type="button" className="deposit-coupon-activate" onClick={activate} disabled={locked || !code.trim()}>{redemption.loading ? <><span className="deposit-spinner" aria-hidden="true" /> {redemption.checking ? "Conferindo…" : "Ativando…"}</> : redemption.error?.uncertain ? "Tentar novamente" : "Ativar cupom"}</button></div>
        <p id="deposit-coupon-hint" className="deposit-coupon-hint">Ative o cupom antes de gerar o Pix.</p>
      </>}
      {promotion && <div className="deposit-coupon-offer"><strong>{promotion.quantity} rodadas no {promotion.game}</strong><p>Depósito a partir de R$100,00. Liberação após confirmação e conclusão dos requisitos.</p>
        {amount < promotion.minimumDeposit && <button type="button" onClick={onUseMinimum} disabled={locked}>Usar valor de R$100,00</button>}
      </div>}
      {(redemption.error || gateError) && <div id="deposit-coupon-error" className="deposit-coupon-error" role="alert"><p>{couponFieldError(redemption.error) || redemption.error?.message || gateError}</p>
        {redemption.error?.uncertain && <p>A ativação ainda não foi confirmada. Tente novamente para conferir a mesma solicitação.</p>}
        {redemption.error?.authRequired && <Link to="/auth/login">Entrar novamente</Link>}
      </div>}
      {!redemption.result && code.trim() && !locked && <button type="button" className="deposit-coupon-skip" onClick={onContinueWithout}>Continuar sem cupom</button>}
    </div>}
  </section>;
}
