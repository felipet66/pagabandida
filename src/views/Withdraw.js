import { SUPPORT_URL } from "config/support";
import React, { useEffect, useRef, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { AuthField } from "components/AuthForm/AuthForm";
import { requestWithdraw, PIX_KEY_TYPES } from "services/withdrawApi";
import { parseMoneyAmount } from "services/walletAmount";
import { clearDepositSession } from "services/depositApi";
import { BET_HOUSE } from "config/betHouse";
import { ArrowLeft, ArrowUpRight, BadgeCheck, CircleHelp, Landmark, MessageCircle } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import "./Withdraw.css";

export default function Withdraw() {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("CPF");
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const request = useRef(null);
  const amountInput = useRef(null);
  const history = useHistory();
  useEffect(() => () => request.current?.abort(), []);
  const submit = async event => {
    event.preventDefault();
    if (request.current || submitted) return;
    setError("");
    const value = parseMoneyAmount(amount);
    if (!value || value < 30) {
      setError("O saque mínimo é de R$ 30,00. Informe um valor igual ou maior.");
      amountInput.current?.focus();
      return;
    }
    if (type !== "CPF" && !key.trim()) {
      setError("Confira a chave Pix.");
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      await requestWithdraw(value, { type, ...(type !== "CPF" ? { key } : {}) }, controller.signal);
      if (controller.signal.aborted) return;
      setSubmitted(true);
      setKey("");
      window.dispatchEvent(new Event("wallet-balance-updated"));
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (failure.response?.status === 401) {
        clearDepositSession(); history.replace("/auth/login");
      } else setError(failure.apiError?.message || failure.response?.data?.error?.message || "Não foi possível solicitar o saque. Tente novamente.");
    } finally {
      if (request.current === controller) request.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  };
  return (
    <div className="content withdraw-page">
      <div className="withdraw-shell">
        <Link to="/admin/jogos" className="withdraw-back"><Icon as={ArrowLeft} size={20} /> Voltar para jogos</Link>
        <header className="withdraw-header">
          <span className="withdraw-eyebrow">Sua carteira</span>
          <h1>Saque</h1>
          <p>Solicite a retirada do seu saldo na {BET_HOUSE.name} via Pix.</p>
        </header>

        <section className="withdraw-card glass edge" aria-labelledby="withdraw-title">
          <div className="withdraw-card-heading">
            <span className="withdraw-icon"><Icon as={Landmark} size={20} /></span>
            <div><span className="withdraw-location">Na {BET_HOUSE.name}</span><h2 id="withdraw-title">Solicitar saque via Pix</h2></div>
          </div>
          {submitted ? <div className="withdraw-success" role="status"><Icon as={BadgeCheck} size={26} /><div><strong>Solicitação de saque enviada</strong><p>Acompanhe o status na ganhebetBR.</p></div></div> : <form onSubmit={submit} aria-busy={loading}>
            <fieldset disabled={loading}>
              <AuthField id="withdraw-amount" label="Valor do saque (R$)" hint="Saque mínimo: R$ 30,00.">
                <input ref={amountInput} id="withdraw-amount" inputMode="decimal" placeholder="0,00" autoComplete="off" aria-invalid={Boolean(error)} aria-describedby={error ? "withdraw-amount-message withdraw-error" : "withdraw-amount-message"} required value={amount} onChange={event => setAmount(event.target.value)} />
              </AuthField>
              <label htmlFor="withdraw-pix-type">Tipo de chave Pix</label>
              <select aria-describedby={type === "CPF" ? "withdraw-key-hint" : undefined} id="withdraw-pix-type" value={type} onChange={event => { setType(event.target.value); setKey(""); }}>
                {PIX_KEY_TYPES.map(value => <option key={value} value={value}>{({ CPF: "CPF", EMAIL: "E-mail", PHONE: "Celular", CNPJ: "CNPJ", RANDOM: "Aleatória" })[value]}</option>)}
              </select>
              {type === "CPF" ? <p id="withdraw-key-hint" className="withdraw-hint">Será usado o CPF do titular da conta.</p> : <AuthField id="withdraw-pix-key" label="Chave Pix">
                <input id="withdraw-pix-key" autoComplete="off" required value={key} onChange={event => setKey(event.target.value)} />
              </AuthField>}
            </fieldset>
            {error && <p id="withdraw-error" className="withdraw-error" role="alert">{error}</p>}
            <button className="withdraw-primary btn btn-primary" type="submit" disabled={loading}>{loading ? "Solicitando..." : "Solicitar saque"}</button>
          </form>}
          <div className="withdraw-action-area">
            <a className="withdraw-secondary btn btn-outline-primary" href={BET_HOUSE.siteUrl} target="_blank" rel="noopener noreferrer">
              Ir para a {BET_HOUSE.name}<Icon as={ArrowUpRight} size={20} />
            </a>
            <p>O site será aberto em uma nova aba.</p>
          </div>
        </section>

        <aside className="withdraw-support glass" aria-labelledby="withdraw-support-title">
          <span className="withdraw-support-icon"><Icon as={CircleHelp} size={20} /></span>
          <div><h2 id="withdraw-support-title">Precisa de ajuda?</h2><p>Fale com o suporte sobre sua solicitação de saque.</p></div>
          <a className="withdraw-secondary btn btn-outline-primary" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" aria-label="Falar com o suporte pelo WhatsApp, abre em nova aba">
            <Icon as={MessageCircle} size={20} /> Falar com suporte
          </a>
        </aside>
      </div>
    </div>
  );
}
