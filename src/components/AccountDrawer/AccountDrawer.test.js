import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import AccountDrawer from "./AccountDrawer";
import useDepositRanking from "../../hooks/useDepositRanking";
import ThemeContextWrapper from "../ThemeWrapper/ThemeWrapper";
import { THEME_STORAGE_KEY, MOTION_STORAGE_KEY, MOTION_QUERY } from "../../services/themePreferences";
jest.mock("../../hooks/useDepositRanking", () => jest.fn());

let root, host, trigger;
beforeEach(() => {
  useDepositRanking.mockReturnValue({ players: [], loading: false, error: null });
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  localStorage.setItem("user_name", "Pessoa de teste");
  localStorage.setItem("user_id", "user-test");
  host = document.createElement("div");
  host.id = "root";
  document.body.appendChild(host);
  trigger = document.createElement("button");
  host.appendChild(trigger);
  trigger.focus();
  root = createRoot(document.createElement("div"));
});
afterEach(() => { act(() => root.unmount()); host.remove(); delete global.IS_REACT_ACT_ENVIRONMENT; });
const mount = props => act(() => root.render(<MemoryRouter><AccountDrawer balance={12.34} currency="BRL" wallet={{ available: "10", bonus: "2.34", locked: "0" }} {...props} /></MemoryRouter>));

test("menu oculta ranking e top depositantes sem consultar a API de ranking", () => {
  mount({ onClose: jest.fn() });
  expect(document.querySelector('.account-ranking')).toBeNull();
  expect(document.querySelector('a[href="/ranking"]')).toBeNull();
  expect(useDepositRanking).not.toHaveBeenCalled();
});

test("menu mobile não exibe o item de Gamificação", () => {
  mount({ onClose: jest.fn() });
  expect(document.querySelector('a[href="/admin/gamificacao"]')).toBeNull();
});

test("menu mobile abre os torneios e fecha o painel", () => {
  const onClose = jest.fn(); mount({ onClose });
  const link = document.querySelector('.account-drawer__tournaments');
  expect(link.getAttribute('href')).toBe('/admin/torneios');
  act(() => link.click()); expect(onClose).toHaveBeenCalledTimes(1);
});

test("menu alterna escuro/claro em todo o app e mantém a preferência ao reabrir", () => {
  localStorage.setItem(THEME_STORAGE_KEY, "dark");
  const onClose = jest.fn();
  const mountThemed = () => act(() => root.render(<MemoryRouter><ThemeContextWrapper>
    <AccountDrawer balance={12.34} currency="BRL" onClose={onClose} />
  </ThemeContextWrapper></MemoryRouter>));
  mountThemed();
  const toggle = () => document.querySelector('.account-drawer__appearance [role="switch"]');
  expect(toggle().textContent).toContain("Modo claro");
  expect(toggle().getAttribute("aria-checked")).toBe("false");
  act(() => toggle().click());
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(toggle().getAttribute("aria-checked")).toBe("true");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  expect(onClose).not.toHaveBeenCalled();
  act(() => root.render(null)); mountThemed();
  expect(toggle().getAttribute("aria-checked")).toBe("true");
  act(() => toggle().click());
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
});

test("painel apresenta sessão e saldo e permite fechar por Escape e pelo fundo", () => {
  const onClose = jest.fn();
  mount({ onClose });
  const dialog = document.querySelector('[role="dialog"]');
  expect(dialog.textContent).toContain("Pessoa de teste");
  expect(dialog.textContent).toContain("user-test");
  expect(dialog.textContent).toContain("12,34");
  expect(dialog.querySelector('a').getAttribute('href')).toBe("/admin/deposit");
  expect(document.activeElement.getAttribute('aria-label')).toBe("Fechar conta");
  expect(host.inert).toBe(true);
  act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  expect(onClose).toHaveBeenCalledTimes(1);
  act(() => document.querySelector('.account-drawer-backdrop').click());
  expect(onClose).toHaveBeenCalledTimes(2);
  act(() => root.unmount());
  expect(document.activeElement).toBe(trigger);
  expect(host.inert).not.toBe(true);
});

test("menu salva a preferência de movimento e permite reativar animações", () => {
  const mountThemed = () => act(() => root.render(<MemoryRouter><ThemeContextWrapper>
    <AccountDrawer balance={0} currency="BRL" onClose={jest.fn()} />
  </ThemeContextWrapper></MemoryRouter>));
  mountThemed();
  const toggle = () => document.querySelector('.account-drawer__motion-toggle');
  expect(toggle().getAttribute("aria-checked")).toBe("false");
  act(() => toggle().click());
  expect(document.documentElement.dataset.motion).toBe("reduced");
  expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe("true");
  act(() => root.render(null)); mountThemed();
  expect(toggle().getAttribute("aria-checked")).toBe("true");
  act(() => toggle().click());
  expect(document.documentElement.dataset.motion).toBe("full");
  expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe("false");
});

test("preferência do celular aparece no menu e pode ser desativada sem fechar o painel", () => {
  const previousMatchMedia = window.matchMedia;
  window.matchMedia = jest.fn(query => ({ matches: query === MOTION_QUERY, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  try {
    act(() => root.render(<MemoryRouter><ThemeContextWrapper><AccountDrawer balance={0} currency="BRL" onClose={jest.fn()} /></ThemeContextWrapper></MemoryRouter>));
    const toggle = document.querySelector('.account-drawer__motion-toggle');
    expect(toggle.disabled).toBe(false);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(document.getElementById(toggle.getAttribute("aria-describedby")).textContent).toContain("preferência do aparelho");
    act(() => toggle.click());
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(document.documentElement.dataset.motion).toBe("full");
    expect(document.querySelector('.account-drawer')).not.toBeNull();
    expect(document.getElementById('account-drawer-motion-note')).toBeNull();
  } finally {
    window.matchMedia = previousMatchMedia;
  }
});

test("teclado permanece no painel e copiar ID utiliza apenas o identificador", async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  mount({ onClose: jest.fn(), onLogout: jest.fn() });
  const dialog = document.querySelector('[role="dialog"]');
  const close = dialog.querySelector('[aria-label="Fechar conta"]');
  const last = dialog.querySelector('.account-drawer__logout');
  act(() => { last.focus(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })); });
  expect(document.activeElement).toBe(close);
  act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })));
  expect(document.activeElement).toBe(last);
  await act(async () => dialog.querySelector('[aria-label="Copiar ID da conta"]').click());
  expect(writeText).toHaveBeenCalledWith("user-test");
  expect(dialog.textContent).toContain("ID copiado");
});
