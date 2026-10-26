import Swal from "sweetalert2";
import { promptGameLogin } from "./gameLoginPrompt";
import { takePendingGame } from "./pendingGame";

jest.mock("sweetalert2", () => ({ fire: jest.fn() }));
beforeEach(() => { sessionStorage.clear(); jest.clearAllMocks(); });

const game = { name: "Fortune Tiger", launchSlug: "pgsoft/fortune-tiger" };

test("confirmação leva ao login e preserva o jogo para abertura após autenticar", async () => {
  Swal.fire.mockResolvedValue({ isConfirmed: true });
  const history = { push: jest.fn() };
  await promptGameLogin(game, history);
  expect(history.push).toHaveBeenCalledWith("/auth/login");
  expect(takePendingGame()).toEqual(game);
});

test("cancelar mantém o visitante no catálogo sem guardar seleção", async () => {
  Swal.fire.mockResolvedValue({ isConfirmed: false });
  const history = { push: jest.fn() };
  await promptGameLogin(game, history);
  expect(history.push).not.toHaveBeenCalled();
  expect(takePendingGame()).toBeNull();
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
    showCancelButton: true, confirmButtonText: "Fazer login", cancelButtonText: "Continuar explorando", returnFocus: true,
  }));
});
