import { SUPPORT_URL } from "config/support";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaWhatsapp, FaArrowLeft } from "react-icons/fa";
import logo from "assets/brand/pagabandida-emblema-verde-512.webp";
import { AlertCircle, ArrowLeft, Eye, EyeOff, MessageCircle } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import ResponsiveImage from "components/ResponsiveImage/ResponsiveImage";
import "./AuthForm.css";
import "./AuthDesign.css";

export function AuthFormLayout({ title, description, banner, children, footer, mode }) {
  const usesDesignSystem = mode === "login" || mode === "register";
  return (
    <main className={`auth-form-page auth-form-page--${mode}${usesDesignSystem ? " auth-form-page--design-system" : ""}`}>
      <div className="auth-form-shell">
        <Link className="auth-form-back" to="/jogos">{usesDesignSystem ? <Icon as={ArrowLeft} size={16} /> : <FaArrowLeft aria-hidden="true" />} Explorar jogos</Link>
        {banner && <ResponsiveImage className="auth-form-banner" image={banner} loading="eager" fetchPriority="high" sizes="(max-width: 512px) calc(100vw - 32px), (max-width: 820px) 480px, (max-width: 1104px) calc((100vw - 104px) * 0.5556), 556px" alt="Bem-vindo ao Paga Bandida. Entre usando seu login e senha da ganhebetBR. Caso não tenha, crie uma conta abaixo." />}
        <section className={`auth-form-card${usesDesignSystem ? " glass edge" : ""}`} aria-labelledby="auth-form-title">
          <header className="auth-form-heading">
            <img src={logo} alt="Paga Bandida" className={usesDesignSystem ? "auth-access-logo" : "auth-form-logo"} width={80} height={80} />
            <h1 id="auth-form-title">{title}</h1>
            <p>{description}</p>
          </header>
          {children}
          <div className="auth-form-switch">{footer}</div>
        </section>
        <a className="auth-form-support" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
          {usesDesignSystem ? <Icon as={MessageCircle} size={16} /> : <FaWhatsapp aria-hidden="true" />} Precisa de ajuda? Fale com o suporte
        </a>
      </div>
    </main>
  );
}

export function AuthField({ id, label, error, hint, children, className = "" }) {
  return (
    <div className={`auth-field${error ? " auth-field--invalid" : ""} ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <p className="auth-field-error" id={`${id}-message`} role="alert"><Icon as={AlertCircle} size={16} /><span>{error}</span></p> : hint && <p className="auth-field-hint" id={`${id}-message`}>{hint}</p>}
    </div>
  );
}

export function PasswordInput({ id, error, autoComplete, designSystem = false, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-password">
      <input {...props} id={id} type={visible ? "text" : "password"} autoComplete={autoComplete}
        aria-invalid={!!error} aria-describedby={error ? `${id}-message` : undefined} />
      <button className="auth-password-toggle" type="button" disabled={props.disabled}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visible} aria-controls={id}
        onClick={() => setVisible(previous => !previous)}>
        {designSystem ? <Icon as={visible ? EyeOff : Eye} size={20} /> : visible ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
      </button>
    </div>
  );
}
