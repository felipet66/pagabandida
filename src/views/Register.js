import React, { useState, useRef, useEffect } from "react";
import InputMask from "react-input-mask";
import { Link, useHistory } from "react-router-dom";
import { registerAccount, validateRegistrationDocument, registrationError, saveRegistrationSession } from "../services/registration";
import useTrackingParams from "../hooks/useTrackingParams";
import useTurnstile from "../hooks/useTurnstile";
import { AuthFormLayout, AuthField, PasswordInput } from "components/AuthForm/AuthForm";
import { AlertCircle, ArrowRight } from "lucide-react";
import Icon from "components/DesignSystem/Icon";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [cpf, setCpf] = useState("");
  const [documentInfo, setDocumentInfo] = useState(null);
  const [validatingCpf, setValidatingCpf] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorCode, setErrorCode] = useState(null);
  const submitLock = useRef(false);
  const documentRequest = useRef(null);
  const validatedCpf = useRef(null);
  const registrationRequest = useRef(null);
  const mounted = useRef(true);
  const cpfRef = useRef("");
  const [phone, setPhone] = useState("");
  const [errorMessages, setErrorMessages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const history = useHistory();
  const { containerRef, getToken, checking } = useTurnstile();

  useTrackingParams();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      documentRequest.current?.controller.abort();
      registrationRequest.current?.abort();
    };
  }, []);

  const handleCpfChange = e => {
    cpfRef.current = e.target.value;
    documentRequest.current?.controller.abort();
    documentRequest.current = null;
    validatedCpf.current = null;
    setCpf(e.target.value);
    setDocumentInfo(null);
    setValidatingCpf(false);
    setFieldErrors(previous => ({ ...previous, cpf: undefined }));
  };

  const handleCpfBlur = async () => {
    const number = cpfRef.current.replace(/\D/g, "");
    if (number.length !== 11 || submitLock.current || documentRequest.current?.number === number || validatedCpf.current === number) return;
    documentRequest.current?.controller.abort();
    const controller = new AbortController();
    const request = { number, controller };
    documentRequest.current = request;
    const isCurrent = () => mounted.current && !controller.signal.aborted && documentRequest.current === request && cpfRef.current.replace(/\D/g, "") === number;
    setValidatingCpf(true);
    setDocumentInfo(null);
    setFieldErrors(previous => ({ ...previous, cpf: undefined }));
    try {
      const data = await validateRegistrationDocument(number, { signal: controller.signal, getToken });
      if (isCurrent()) { validatedCpf.current = number; setDocumentInfo(data); }
    } catch (error) {
      if (isCurrent()) {
        const result = registrationError(error);
        const message = error.securityError || ["INVALID_DOCUMENT", "BOT_CHECK_FAILED"].includes(result.code)
          ? result.message : "Não foi possível validar o CPF agora. Tente novamente.";
        setFieldErrors(previous => ({ ...previous, cpf: message }));
      }
    } finally {
      if (isCurrent()) { documentRequest.current = null; setValidatingCpf(false); }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (submitLock.current || documentRequest.current) return;
    setErrorMessages([]);
    setErrorCode(null);
    const fields = {};
    if (!email.trim()) fields.email = "Informe seu e-mail.";
    if (!password) fields.password = "Informe sua senha.";
    if (password !== passwordConfirmation) fields.passwordConfirmation = "As senhas não conferem.";
    if (cpf.replace(/\D/g, "").length !== 11) fields.cpf = "Informe um CPF com 11 dígitos.";
    if (phone.replace(/\D/g, "").length !== 11) fields.phone = "Informe o telefone com DDD.";
    setFieldErrors(fields);
    if (Object.keys(fields).length) return;
    submitLock.current = true;
    setIsSubmitting(true);
    const controller = new AbortController();
    registrationRequest.current = controller;
    try {
      const data = await registerAccount({ email: email.trim(), password, phone, cpf }, { getToken, signal: controller.signal });
      if (!mounted.current || controller.signal.aborted) return;
      saveRegistrationSession(data);
      history.replace("/admin/dashboard");
    } catch (error) {
      if (!mounted.current || controller.signal.aborted) return;
      const result = registrationError(error);
      setErrorMessages([result.message]);
      setFieldErrors(result.fields);
      setErrorCode(result.code);
    } finally {
      submitLock.current = false;
      if (mounted.current) setIsSubmitting(false);
      registrationRequest.current = null;
    }
  };

  return (
    <AuthFormLayout mode="register" title="Crie sua conta" description="Cadastre-se na ganhebetBR para acessar o Paga Bandida."
      footer={<>Já tem uma conta? <Link to="/auth/login">Entrar</Link></>}>
      <form onSubmit={handleSubmit} aria-busy={isSubmitting || validatingCpf}>
        {errorMessages.length > 0 && (
          <div className="auth-form-alert" role="alert">
            <Icon as={AlertCircle} size={20} />
            <div>
              {errorMessages.map((message, index) => <p key={index}>{message}</p>)}
              {errorCode === "USER_ALREADY_EXISTS" && <Link to={{ pathname: "/auth/login", state: { email } }}>Fazer login</Link>}
            </div>
          </div>
        )}
        <fieldset disabled={isSubmitting}>
          <h2 className="auth-form-section">Seus dados</h2>
          <AuthField id="register-email" label="E-mail" error={fieldErrors.email} className="auth-field--full">
            <input id="register-email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required
              aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "register-email-message" : undefined}
              value={email} onChange={e => setEmail(e.target.value)} />
          </AuthField>
          <AuthField id="register-phone" label="Celular" error={fieldErrors.phone} hint="Inclua o DDD do seu número.">
            <InputMask id="register-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" mask="(99) 99999-9999" maskChar={null}
              placeholder="(11) 99999-9999" required disabled={isSubmitting} aria-invalid={!!fieldErrors.phone} aria-describedby="register-phone-message"
              value={phone} onChange={e => setPhone(e.target.value)} />
          </AuthField>
          <AuthField id="register-cpf" label="CPF" error={fieldErrors.cpf} hint="Usado para identificar o titular da conta.">
            <div className="auth-cpf-input">
              <InputMask id="register-cpf" name="cpf" inputMode="numeric" mask="999.999.999-99" maskChar={null}
                placeholder="000.000.000-00" required disabled={isSubmitting} aria-invalid={!!fieldErrors.cpf}
                aria-describedby={`register-cpf-message${documentInfo || validatingCpf ? " register-cpf-result" : ""}`}
                value={cpf} onChange={handleCpfChange} onBlur={handleCpfBlur} />
              {(validatingCpf || documentInfo) && <div className="auth-cpf-result" id="register-cpf-result" role="status">
                {validatingCpf ? (checking ? "Verificando segurança…" : "Conferindo CPF...") : <>
                  <strong>{documentInfo.nameMasked}</strong>
                  <span>CPF: {documentInfo.cpfMasked}</span>
                  <span>Nascimento: {documentInfo.birthDateMasked}</span>
                </>}
              </div>}
              {fieldErrors.cpf && cpf.replace(/\D/g, "").length === 11 && !validatingCpf && !isSubmitting &&
                <button type="button" className="btn btn-link" onClick={handleCpfBlur}>Tentar validar CPF</button>}
            </div>
          </AuthField>
          <h2 className="auth-form-section auth-form-section--divider">Sua senha de acesso</h2>
          <AuthField id="register-password" label="Senha" error={fieldErrors.password}>
            <PasswordInput designSystem id="register-password" name="password" autoComplete="new-password" placeholder="Crie uma senha" required
              error={fieldErrors.password} disabled={isSubmitting} value={password} onChange={e => setPassword(e.target.value)} />
          </AuthField>
          <AuthField id="register-confirm-password" label="Confirmar senha" error={fieldErrors.passwordConfirmation}>
            <PasswordInput designSystem id="register-confirm-password" name="passwordConfirmation" autoComplete="new-password" placeholder="Repita sua senha" required
              error={fieldErrors.passwordConfirmation} disabled={isSubmitting} value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} />
          </AuthField>
        </fieldset>
        <div className={`auth-security${checking ? " auth-security--active" : ""}`} aria-label="Verificação de segurança">
          {checking && <p role="status">Verificando segurança…</p>}
          <div ref={containerRef} className="auth-security-widget" />
        </div>
        <button className="auth-form-submit btn btn-primary" type="submit" disabled={isSubmitting || validatingCpf}>
          {isSubmitting && <span className="auth-form-spinner" aria-hidden="true" />}
          {checking ? "Verificando segurança…" : isSubmitting ? "Criando conta..." : "Criar conta"}
          {!isSubmitting && <Icon as={ArrowRight} size={20} />}
        </button>
        <span className="sr-only" role="status">{isSubmitting ? "Criando sua conta. Aguarde." : ""}</span>
      </form>
    </AuthFormLayout>
  );
}

export default Register;
