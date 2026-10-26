import React, { useState, useRef, useEffect } from "react";
import InputMask from "react-input-mask";
import { Link, useHistory } from "react-router-dom";
import { registerAccount, validateRegistrationDocument, registrationError, saveRegistrationSession } from "../services/registration";
import useTrackingParams from "../hooks/useTrackingParams";
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
  const cpfRef = useRef("");
  const [phone, setPhone] = useState("");
  const [errorMessages, setErrorMessages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const history = useHistory();

  useTrackingParams();
  useEffect(() => () => documentRequest.current?.abort(), []);

  const handleCpfChange = e => {
    cpfRef.current = e.target.value;
    documentRequest.current?.abort();
    setCpf(e.target.value);
    setDocumentInfo(null);
    setValidatingCpf(false);
    setFieldErrors(previous => ({ ...previous, cpf: undefined }));
  };

  const handleCpfBlur = async () => {
    const number = cpfRef.current.replace(/\D/g, "");
    if (number.length !== 11) return;
    documentRequest.current?.abort();
    const controller = new AbortController();
    documentRequest.current = controller;
    setValidatingCpf(true);
    try {
      const data = await validateRegistrationDocument(number, controller.signal);
      if (!controller.signal.aborted) setDocumentInfo(data);
    } catch (error) {
      if (!controller.signal.aborted) {
        const result = registrationError(error);
        setFieldErrors(previous => ({ ...previous, cpf: result.code === "INVALID_DOCUMENT" ? result.message : "Não foi possível validar o CPF agora. Você pode continuar o cadastro." }));
      }
    } finally {
      if (!controller.signal.aborted) setValidatingCpf(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (submitLock.current) return;
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
    documentRequest.current?.abort();
    setValidatingCpf(false);
    try {
      const data = await registerAccount({ email: email.trim(), password, phone, cpf });
      saveRegistrationSession(data);
      history.replace("/admin/dashboard");
    } catch (error) {
      const result = registrationError(error);
      setErrorMessages([result.message]);
      setFieldErrors(result.fields);
      setErrorCode(result.code);
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormLayout mode="register" title="Crie sua conta" description="Cadastre-se na ganhebetBR para acessar o Paga Bandida."
      footer={<>Já tem uma conta? <Link to="/auth/login">Entrar</Link></>}>
      <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
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
                {validatingCpf ? "Conferindo CPF..." : <>
                  <strong>{documentInfo.nameMasked}</strong>
                  <span>CPF: {documentInfo.cpfMasked}</span>
                  <span>Nascimento: {documentInfo.birthDateMasked}</span>
                </>}
              </div>}
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
        <button className="auth-form-submit btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting && <span className="auth-form-spinner" aria-hidden="true" />}
          {isSubmitting ? "Criando conta..." : "Criar conta"}
          {!isSubmitting && <Icon as={ArrowRight} size={20} />}
        </button>
        <span className="sr-only" role="status">{isSubmitting ? "Criando sua conta. Aguarde." : ""}</span>
      </form>
    </AuthFormLayout>
  );
}

export default Register;
