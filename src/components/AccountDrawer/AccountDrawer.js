import React, { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Check, Copy, LogOut, RefreshCw, SunMoon, Trophy, UserRound, Wallet, X } from "lucide-react";
import Icon from "../DesignSystem/Icon";
import ThemeToggle from "../DesignSystem/ThemeToggle";
import MotionToggle from "../DesignSystem/MotionToggle";
import { ThemeContext } from "../../contexts/ThemeContext";
import "./AccountDrawer.css";
import { useTournaments } from "../../contexts/TournamentsContext";

export default function AccountDrawer({ balance, wallet, currency, loading, error, onRefresh, onClose, onLogout }) {
  const { unsupported } = useTournaments();
  const { systemReducedMotion, manualReduceMotion } = useContext(ThemeContext);
  const followsSystemMotion = systemReducedMotion && manualReduceMotion == null;
  const panel = useRef(null);
  const close = useRef(null);
  const [copyMessage, setCopyMessage] = useState("");
  const name = localStorage.getItem("user_name") || "Minha conta";
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const root = document.getElementById("root");
    const previousInert = root?.inert;
    if (root) root.inert = true;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    const onKey = event => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const controls = Array.from(panel.current?.querySelectorAll('button:not(:disabled), a[href]') || []);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (root) root.inert = previousInert;
      document.removeEventListener("keydown", onKey);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose]);

  const format = value => {
    const numeric = value == null || String(value).trim() === "" ? NaN : Number(value);
    return Number.isFinite(numeric) ? numeric.toLocaleString("pt-BR", { style: "currency", currency }) : loading ? "Carregando..." : "—";
  };
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopyMessage("ID copiado");
    } catch {
      setCopyMessage("Não foi possível copiar o ID.");
    }
  };

  return createPortal(
    <div className="account-drawer-layer">
      <button type="button" className="account-drawer-backdrop" onClick={onClose} tabIndex={-1} aria-label="Fechar painel da conta" />
      <section className="account-drawer" role="dialog" aria-modal="true" aria-labelledby="account-drawer-title" ref={panel}>
        <button ref={close} className="account-drawer__close" type="button" onClick={onClose} aria-label="Fechar conta"><Icon as={X} size={20} /></button>
        <header className="account-drawer__profile">
          <div className="account-drawer__avatar"><Icon as={UserRound} size={20} /></div>
          <div className="account-drawer__identity">
            <span className="account-drawer__eyebrow">Minha conta</span>
            <h2 id="account-drawer-title" title={name}>{name}</h2>
            {userId && <div className="account-drawer__id"><span title={userId}>ID: {userId}</span>
              <button type="button" onClick={copyId} aria-label="Copiar ID da conta">{copyMessage === "ID copiado" ? <Icon as={Check} size={20} /> : <Icon as={Copy} size={20} />}</button>
            </div>}
            <span className="account-drawer__copy-status" role="status">{copyMessage}</span>
          </div>
        </header>
        <section className="account-drawer__appearance" aria-labelledby="account-drawer-appearance-title">
          <h3 id="account-drawer-appearance-title"><Icon as={SunMoon} size={18} /> Aparência</h3>
          <div className="account-drawer__preferences">
            <ThemeToggle className="account-drawer__theme-toggle" />
            <MotionToggle className="account-drawer__motion-toggle" aria-describedby={followsSystemMotion ? "account-drawer-motion-note" : undefined} />
          </div>
          {followsSystemMotion && <p className="account-drawer__motion-note" id="account-drawer-motion-note">
            Seguindo a preferência do aparelho. Você pode alterar aqui para este aplicativo.
          </p>}
        </section>
        <div className="account-drawer__wallet" aria-busy={loading}>
          <div className="account-drawer__total"><div><h3>Saldo geral</h3><strong>{format(balance)}</strong></div>
            <button type="button" onClick={onRefresh} disabled={loading} aria-label="Atualizar saldo" title="Atualizar saldo">
              <Icon as={RefreshCw} size={20} />
            </button>
          </div>
          {error && <p className="account-drawer__error" role="alert">{error}</p>}
          <dl className="account-drawer__balances">
            <div><dt>Saldo real</dt><dd>{format(wallet?.available)}</dd></div>
            <div><dt>Bônus</dt><dd>{format(wallet?.bonus)}</dd></div>
            <div><dt>Disponível</dt><dd>{format(balance)}</dd></div>
          </dl>
          {wallet?.locked != null && <p className="account-drawer__locked">Bloqueado <span>{format(wallet.locked)}</span></p>}
          <Link className="account-drawer__deposit btn btn-primary" to="/admin/deposit" onClick={onClose}><Icon as={Wallet} size={20} /> Depositar</Link>
        </div>
        {!unsupported && <nav className="account-drawer__shortcuts" aria-label="Atalhos da conta">
          <Link className="account-ranking__link account-drawer__tournaments" to="/admin/torneios" onClick={onClose}><Icon as={Trophy} size={18} /> Torneios</Link>
        </nav>}
        <div className="account-drawer__footer">
          <button className="account-drawer__logout btn btn-outline-primary" type="button" onClick={onLogout}><Icon as={LogOut} size={20} /> Sair da conta</button>
        </div>
      </section>
    </div>, document.body
  );
}
