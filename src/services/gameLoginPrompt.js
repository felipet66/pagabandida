import Swal from "sweetalert2";
import { rememberPendingGame } from "./pendingGame";

export async function promptGameLogin(game, history) {
  const result = await Swal.fire({
    title: "Entre para jogar",
    text: `Você precisa fazer login para acessar os jogos. Após entrar, abriremos ${game.name} para você.`,
    icon: "info",
    iconHtml: '<i class="fas fa-lock" aria-hidden="true"></i>',
    showCancelButton: true,
    confirmButtonText: "Fazer login",
    cancelButtonText: "Continuar explorando",
    buttonsStyling: false,
    returnFocus: true,
    customClass: {
      popup: "catalog-login-prompt",
      icon: "catalog-login-prompt__icon",
      confirmButton: "catalog-login-prompt__confirm",
      cancelButton: "catalog-login-prompt__cancel",
    },
  });
  if (result.isConfirmed) {
    rememberPendingGame(game);
    history.push("/auth/login");
  }
}
