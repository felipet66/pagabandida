import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Swal from "sweetalert2";
import { ArrowLeft, Copy, QrCode, Wallet } from "lucide-react";
import Icon from "../components/DesignSystem/Icon";
import useDepositSync from "../hooks/useDepositSync";
import useDeposit from "../hooks/useDeposit";
import { BET_HOUSE } from "../config/betHouse";
import { AVIATOR_COUPON_PROMOTION, isAviatorPromotion } from "../config/couponPromotion";
import DepositCoupon, { DepositCouponConfirmation } from "../components/Coupons/DepositCoupon";
import { useCouponList, useCouponRedemption } from "../hooks/useCoupons";
import "./Deposit.css";
import { parseMoneyAmount as parseDepositAmount } from "../services/walletAmount";
export { parseMoneyAmount as parseDepositAmount } from "../services/walletAmount";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });


export default function Deposits() {
  const location = useLocation();
  const initialCoupon = (new URLSearchParams(location.search).get("coupon") || "").trim().slice(0, 128);
  const [amountStr, setAmountStr] = useState(() => isAviatorPromotion(initialCoupon) ? `${AVIATOR_COUPON_PROMOTION.minimumDeposit},00` : "");
  const [couponCode, setCouponCode] = useState(initialCoupon);
  const [couponOpen, setCouponOpen] = useState(Boolean(initialCoupon));
  const [couponGateError, setCouponGateError] = useState("");
  const couponInput = useRef(null);
  const afterCouponActivation = useCallback(() => setCouponGateError(""), []);
  const coupon = useCouponRedemption(afterCouponActivation);
  const [formError, setFormError] = useState("");
  const [pixDetails, setPixDetails] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [copying, setCopying] = useState(false);
  const history = useHistory();
  const submittingRef = useRef(false);
  const amountInput = useRef(null);
  const paymentTitle = useRef(null);
  const { loading: submitting, createDeposit, error: apiError, clearError } = useDeposit();
  const { status, remaining, error: paymentError, checkPayment, checking } = useDepositSync(pixDetails);
  const pendingCoupons = useCouponList("pending", !pixDetails);
  const registeredCoupon = pendingCoupons.items.find(item => typeof item.code === "string" && item.code.trim().toUpperCase() === couponCode.trim().toUpperCase());
  const couponResult = coupon.result || registeredCoupon;
  const checkingCoupon = pendingCoupons.loading && Boolean(couponCode.trim());
  const couponForForm = { ...coupon, result: couponResult, loading: coupon.loading || checkingCoupon, checking: checkingCoupon };
  const displayedError = apiError?.fields?.amount || apiError?.message || formError;
  const countdown = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const amount = parseDepositAmount(amountStr);
  const working = submitting || couponForForm.loading;
  const couponNeedsActivation = Boolean(couponCode.trim() && !couponResult);

  useEffect(() => { if (pixDetails) paymentTitle.current?.focus(); }, [pixDetails]);
  useEffect(() => { if (couponGateError && couponOpen) couponInput.current?.focus(); }, [couponGateError, couponOpen]);

  useEffect(() => {
    if (status !== "confirmed") return;
    Swal.fire({ toast: true, position: "top", icon: "success", title: "Depósito confirmado!", timer: 2500, showConfirmButton: false });
    history.replace("/admin/jogos");
  }, [status, history]);

  const handleDeposit = async event => {
    event.preventDefault();
    if (submittingRef.current || couponForForm.loading) return;
    setFormError("");
    clearError?.();
    if (!amount || amount < 5) {
      setFormError("O depósito mínimo é de R$ 5,00. Informe um valor com até duas casas decimais.");
      amountInput.current?.focus();
      return;
    }
    if (couponNeedsActivation) {
      setCouponOpen(true);
      setCouponGateError("Ative o cupom antes de gerar o Pix ou escolha continuar sem cupom.");
      couponInput.current?.focus();
      return;
    }
    submittingRef.current = true;
    try {
      const result = await createDeposit(amount);
      if (!result?.transaction?.id || !result?.paymentPayload?.pix_payment) {
        setFormError("Não foi possível gerar o Pix. Tente novamente.");
        return;
      }
      setPixDetails(result);
      setCopyStatus("");
    } catch {
      setFormError("Não foi possível gerar o Pix. Tente novamente.");
    } finally {
      submittingRef.current = false;
    }
  };

  const copyCode = async () => {
    if (!pixDetails?.paymentPayload?.pix_payment || copying || status !== "pending") return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(pixDetails.paymentPayload.pix_payment);
      setCopyStatus("Código copiado. Cole no aplicativo do seu banco.");
    } catch {
      setCopyStatus("Não foi possível copiar. Selecione o código abaixo e copie manualmente.");
    } finally { setCopying(false); }
  };

  return (
    <div className="content deposit-page">
      <div className="deposit-shell">
        <Link to="/admin/jogos" className="deposit-back" aria-label="Voltar para jogos"><Icon as={ArrowLeft} size={20} /><span>Voltar para jogos</span></Link>
        <header className="deposit-header">
          <span className="deposit-eyebrow">Sua carteira</span>
          <h1>Depósito via Pix</h1>
          <p>{pixDetails ? "Use o QR Code ou o código Pix para fazer o pagamento." : "Escolha o valor que deseja adicionar à sua conta."}</p>
        </header>
        <ol className="deposit-steps" aria-label="Etapas do depósito">
          <li className={!pixDetails ? "is-current" : "is-complete"} aria-current={!pixDetails ? "step" : undefined}><span>1</span> Escolher valor</li>
          <li className={pixDetails ? "is-current" : ""} aria-current={pixDetails ? "step" : undefined}><span>2</span> Pagar com Pix</li>
        </ol>
        <section className="deposit-card glass edge">
          {!pixDetails ? <form onSubmit={handleDeposit} aria-busy={working}>
            <div className="deposit-card-heading"><span className="deposit-icon"><Icon as={Wallet} size={20} /></span><div><h2>Quanto deseja depositar?</h2><p>Digite um valor ou escolha uma das opções abaixo.</p></div></div>
            <label className="deposit-label" htmlFor="deposit-amount">Valor do depósito</label>
            <div className={`deposit-amount ${displayedError ? "has-error" : ""}`}><span aria-hidden="true">R$</span><input id="deposit-amount" ref={amountInput} inputMode="decimal" autoComplete="off" placeholder="0,00" value={amountStr} disabled={working} aria-invalid={Boolean(displayedError)} aria-describedby={displayedError ? "deposit-error" : "deposit-amount-hint"} onChange={event => { setAmountStr(event.target.value); setFormError(""); clearError?.(); }} /></div>
            <p id="deposit-amount-hint" className="deposit-hint">Depósito mínimo: R$ 5,00.</p>
            <div className="deposit-presets" role="group" aria-label="Valores sugeridos">
              {[20, 50, 150, 400, 800, 1000, 2500, 5000].map(value => <button type="button" key={value} aria-pressed={amount === value} className={amount === value ? "is-active" : ""} disabled={working} onClick={() => { setAmountStr(`${value},00`); setFormError(""); clearError?.(); }}>{currency.format(value)}</button>)}
            </div>
            <DepositCoupon open={couponOpen} onToggle={() => setCouponOpen(value => !value)} code={couponCode} onCodeChange={value => { setCouponCode(value); setCouponGateError(""); coupon.resetFeedback(); }} redemption={couponForForm} inputRef={couponInput} disabled={submitting} amount={amount} onUseMinimum={() => { setAmountStr(`${AVIATOR_COUPON_PROMOTION.minimumDeposit},00`); setFormError(""); clearError?.(); }} gateError={couponGateError} onContinueWithout={() => { setCouponCode(""); setCouponOpen(false); setCouponGateError(""); coupon.resetFeedback(); }} />
            {displayedError && <div id="deposit-error" className="deposit-error" role="alert">{displayedError}
              {apiError?.code === "DOCUMENT_REQUIRED" && <p><a href={BET_HOUSE.siteUrl} target="_blank" rel="noopener noreferrer">Verificar documento na ganhebetBR</a></p>}
            </div>}
            <div className="deposit-submit-panel">
              <div className="deposit-total"><span>Valor do Pix</span><strong>{currency.format(amount)}</strong></div>
              <button className="deposit-primary btn btn-primary" type="submit" disabled={working}>{submitting ? <><span className="deposit-spinner" aria-hidden="true" /> Gerando Pix...</> : couponForForm.loading ? <><span className="deposit-spinner" aria-hidden="true" /> Verificando cupom…</> : <><Icon as={QrCode} size={20} /> Gerar Pix</>}</button>
              <p className="deposit-footnote">Na próxima etapa você verá o QR Code e os dados para pagamento.</p>
            </div>
          </form> : <>
            <div className="deposit-payment-heading"><span className="deposit-icon"><Icon as={QrCode} size={20} /></span><h2 ref={paymentTitle} tabIndex={-1}>Pix gerado</h2><span className={`deposit-status deposit-status--${status}`}>{status === "expired" ? "Pix expirado" : status === "confirmed" ? "Pagamento confirmado" : "Aguardando pagamento"}</span></div>
            <div className="deposit-payment-value"><span>Valor do depósito</span><strong>{currency.format(Number(pixDetails.transaction.amount))}</strong></div>
            {couponResult && <DepositCouponConfirmation code={couponCode} result={couponResult} compact />}
            {status === "expired" ? <p className="deposit-error" role="status">Este Pix expirou. Gere um novo código para continuar.</p> : <>
              {remaining != null ? <p className="deposit-validity">Pague em <strong>{countdown}</strong> · válido até {new Date(pixDetails.paymentPayload.expiresAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília)</p> : <p className="deposit-validity">A validade deste Pix não foi informada. Aguardando pagamento.</p>}
              <div className="deposit-payment-grid">
                <div className="deposit-qr-section"><div className="deposit-qr"><QRCodeSVG value={pixDetails.paymentPayload.pix_payment} size={240} marginSize={4} title="QR Code para pagar o depósito via Pix" /></div><p>Abra o aplicativo do seu banco e escolha pagar com Pix.</p></div>
                <div className="deposit-copy-section"><h3>Pix Copia e Cola</h3><p>No celular, copie o código e cole na opção Pix Copia e Cola do seu banco.</p><label htmlFor="deposit-pix-code" className="deposit-label">Código do pagamento</label><textarea id="deposit-pix-code" readOnly value={pixDetails.paymentPayload.pix_payment} rows={3} onFocus={event => event.target.select()} /><button className="deposit-primary btn btn-primary" type="button" onClick={copyCode} disabled={copying || status !== "pending"}><Icon as={Copy} size={20} />{copying ? "Copiando..." : "Copiar código Pix"}</button><p className="deposit-copy-status" role="status">{copyStatus}</p></div>
              </div>
            </>}
            {paymentError && status === "pending" && <p className="deposit-error" role="status">{paymentError}</p>}
            <div className="deposit-payment-footer"><p>O saldo é verificado automaticamente enquanto esta tela está aberta.</p>
              {status === "pending" && <button className="deposit-secondary btn btn-outline-primary" type="button" onClick={checkPayment} disabled={checking}>{checking ? "Verificando..." : "Já paguei"}</button>}
              <button className="deposit-secondary btn btn-outline-primary" type="button" onClick={() => { setPixDetails(null); setCopyStatus(""); setFormError(""); clearError?.(); }}>Gerar outro Pix</button></div>
          </>}
        </section>
      </div>
    </div>
  );
}
