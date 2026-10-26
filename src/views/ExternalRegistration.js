import React from "react";
import { Link } from "react-router-dom";
import { BET_HOUSE } from "config/betHouse";
import { AuthFormLayout } from "components/AuthForm/AuthForm";
import { ArrowUpRight } from "lucide-react";
import Icon from "components/DesignSystem/Icon";

// Keep existing registration URLs usable while signup is completed on the house website.
export default function ExternalRegistration() {
  return <AuthFormLayout mode="register" title="Crie sua conta na ganhebetBR"
    description="Conclua o cadastro no site da ganhebetBR. Depois, volte ao Paga Bandida para entrar."
    footer={<>Já tem uma conta? <Link to="/auth/login">Entrar no Paga Bandida</Link></>}>
    <p>O cadastro será aberto em outra aba.</p>
    <a className="auth-form-submit btn btn-primary" href={BET_HOUSE.registrationUrl} target="_blank" rel="noopener noreferrer">
      Criar conta na ganhebetBR <Icon as={ArrowUpRight} size={20} />
    </a>
  </AuthFormLayout>;
}
