import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useState, useRef } from "react";
import useTrackingParams from "../hooks/useTrackingParams";
import { BET_HOUSE } from "config/betHouse";
import bffApi from "../services/bffApi";

import { AuthFormLayout, AuthField, PasswordInput } from "components/AuthForm/AuthForm";
import { welcomeBanner } from "assets/responsiveImages";
import { AlertCircle, ArrowRight } from "lucide-react";
import Icon from "components/DesignSystem/Icon";

const LOGIN_COOLDOWN_MS = 3 * 60 * 1000;
const TOO_MANY_REQUESTS_CODE = "TOO_MANY_REQUESTS";
const TOO_MANY_REQUESTS_MESSAGE =
  "Detectamos muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.";

const getNormalizedEmail = email => email.trim().toLowerCase();
const getLoginCooldownKey = email => `pagabandida:loginCooldown:${getNormalizedEmail(email)}`;
const getCooldownRemainingText = cooldownUntil => {
  const remainingMs = Number(cooldownUntil) - Date.now();
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));

  return `Aguarde ${remainingMinutes} minuto${remainingMinutes > 1 ? "s" : ""} antes de tentar novamente.`;
};

function Login() {
  const history = useHistory();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginRequestInFlightRef = useRef(false);

  useTrackingParams();

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (loginRequestInFlightRef.current) return;

    if (!email || !password) {
      setError("Todos os campos são obrigatórios");
      return;
    }

    const cooldownKey = getLoginCooldownKey(email);
    const cooldownUntil = localStorage.getItem(cooldownKey);

    if (cooldownUntil && Date.now() < Number(cooldownUntil)) {
      setError(getCooldownRemainingText(cooldownUntil));
      return;
    }

    if (cooldownUntil) {
      localStorage.removeItem(cooldownKey);
    }

    loginRequestInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      const { data } = await bffApi.post("api/auth/login", {
        email,
        password,
      }, { publicRequest: true });

      if (data?.success === false) {
        const apiError = new Error(data.error?.message || "Não foi possível realizar o login.");
        apiError.apiError = data.error;
        throw apiError;
      }

      const result = data.data || data;

      localStorage.setItem("access_token", result.access_token);
      try { sessionStorage.removeItem("pagabandida:gamification-day"); } catch { /* Check-in also has an in-memory guard. */ }
      localStorage.setItem("cookie_key", result.cookie_key);
      localStorage.setItem("expires_in", result.expires_in);
      localStorage.setItem("user_id", result.user.id);
      localStorage.setItem("user_name", result.user.name);
      localStorage.setItem("user_email", result.user.email);
      localStorage.setItem("user_token", result.user.token);
      localStorage.setItem("email", email);

      history.push("/admin/jogos");
    } catch (err) {
      const responseError = err.apiError || err.response?.data?.error;

      if (responseError?.code === TOO_MANY_REQUESTS_CODE) {
        localStorage.setItem(cooldownKey, String(Date.now() + LOGIN_COOLDOWN_MS));
        setError(TOO_MANY_REQUESTS_MESSAGE);
      } else if (err.response?.status === 401 || responseError?.code === "INVALID_CREDENTIALS") {
        setError(responseError?.message || "E-mail ou senha inválidos. Confira seus dados e tente novamente.");
      } else {
        setError(responseError?.message || "Não foi possível entrar. Tente novamente.");
      }

      loginRequestInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <AuthFormLayout mode="login" title="Entre na sua conta" description="Use seu e-mail e senha da ganhebetBR para acessar." banner={welcomeBanner}
        footer={<>Ainda não tem conta? <a href={BET_HOUSE.registrationUrl} target="_blank" rel="noopener noreferrer">Criar conta</a></>}>
        <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
          {error && <div className="auth-form-alert" role="alert"><Icon as={AlertCircle} size={20} /><span>{error}</span></div>}
          <fieldset disabled={isSubmitting}>
            <AuthField id="login-email" label="E-mail">
              <input id="login-email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required
                value={email} onChange={e => setEmail(e.target.value)} />
            </AuthField>
            <AuthField id="login-password" label="Senha">
              <PasswordInput designSystem id="login-password" name="password" autoComplete="current-password" placeholder="Digite sua senha" required
                value={password} onChange={e => setPassword(e.target.value)} disabled={isSubmitting} />
            </AuthField>
          </fieldset>
          <button className="auth-form-submit btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting && <span className="auth-form-spinner" aria-hidden="true" />}
            {isSubmitting ? "Entrando..." : "Entrar"}
            {!isSubmitting && <Icon as={ArrowRight} size={20} />}
          </button>
          <p><a href={BET_HOUSE.recoveryUrl || BET_HOUSE.siteUrl} target="_blank" rel="noopener noreferrer">Recuperar senha no site da ganhebetBR</a></p>
          <span className="sr-only" role="status">{isSubmitting ? "Verificando seu acesso. Aguarde." : ""}</span>
        </form>
      </AuthFormLayout>
    </>
  );
}

export default Login;
