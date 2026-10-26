import { BET_HOUSE } from "config/betHouse";
import { useEffect } from "react";
import Swal from "sweetalert2";
import pagaBandidaLoginHero from "assets/brand/pagabandida-emblema-verde-512.webp";
import { useMaintenanceNotice } from "contexts/MaintenanceNoticeContext";

function LoginModal() {
  const { maintenanceAcknowledged } = useMaintenanceNotice();

  useEffect(() => {
    if (!maintenanceAcknowledged) return;

    Swal.fire({
      background: "#111416",
      color: "#ffffff",
      width: 430,
      padding: 0,
      html: `
        <div class="pagabandida-login-alert__hero">
          <img src="${pagaBandidaLoginHero}" alt="Paga Bandida" />
        </div>
        <h2 class="pagabandida-login-alert__heading">Paga Bandida</h2>
        <div class="pagabandida-login-alert__content">
          <p class="pagabandida-login-alert__lead">
            Para acessar o <strong>Paga Bandida</strong>, é necessário ter uma conta na <strong style="color: var(--primary-text);">${BET_HOUSE.name}</strong>.
          </p>
          <div class="pagabandida-login-alert__step">
            <strong>1. Não tenho uma conta.</strong>
            <span>Crie sua conta na ${BET_HOUSE.name} e acesse a plataforma pelo botão abaixo.</span>
            <a
              href="${BET_HOUSE.registrationUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="pagabandida-login-alert__link"
            >
              Criar uma conta
            </a>
          </div>
          <div class="pagabandida-login-alert__step">
            <strong>2. Já tenho uma conta.</strong>
            <span>Continue para acessar a plataforma.</span>
          </div>
        </div>
      `,
      confirmButtonText: "Acessar Paga Bandida",
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        popup: "pagabandida-login-alert",
        htmlContainer: "pagabandida-login-alert__html",
        confirmButton: "pagabandida-login-alert__confirm",
      },
      buttonsStyling: false,
    });
  }, [maintenanceAcknowledged]);

  return null;
}

export default LoginModal;
