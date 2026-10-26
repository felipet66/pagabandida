import React, { useContext } from "react";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import ThemeContextWrapper from "./ThemeWrapper";
import BackgroundColorWrapper from "../BackgroundColorWrapper/BackgroundColorWrapper";
import { ThemeContext } from "contexts/ThemeContext";
import { BackgroundColorContext } from "contexts/BackgroundColorContext";
import ThemeToggle from "../DesignSystem/ThemeToggle";
import MotionToggle from "../DesignSystem/MotionToggle";
import { THEME_STORAGE_KEY, MOTION_STORAGE_KEY, LIGHT_QUERY, MOTION_QUERY } from "services/themePreferences";
let current, background, media;
function Harness() {
  current = useContext(ThemeContext); background = useContext(BackgroundColorContext);
  return <><ThemeToggle /><MotionToggle /></>;
}
const mount = () => render(<ThemeContextWrapper><BackgroundColorWrapper><Harness /></BackgroundColorWrapper></ThemeContextWrapper>);
const notify = (query, matches) => act(() => {
  media[query].matches = matches; media[query].listeners.forEach(listener => listener({ matches }));
});
beforeEach(() => {
  localStorage.clear();
  ["theme", "motion", "themeReady"].forEach(key => delete document.documentElement.dataset[key]);
  media = Object.fromEntries([LIGHT_QUERY, MOTION_QUERY].map(query => [query, {
    matches: false, listeners: new Set(),
    addEventListener(event, listener) { this.listeners.add(listener); },
    removeEventListener(event, listener) { this.listeners.delete(listener); },
  }]));
  window.matchMedia = jest.fn(query => media[query]);
});
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

test("padrão é escuro mesmo com o sistema claro e mantém BackgroundColorContext integrado", () => {
  media[LIGHT_QUERY].matches = true; mount();
  expect(current.theme).toBe("dark");
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(background.theme).toBe("dark");
  notify(LIGHT_QUERY, false);
  notify(LIGHT_QUERY, true);
  expect(current.theme).toBe("dark");
  expect(background.color).toBe("primary");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
});

test("sem matchMedia, usa escuro e movimento completo", () => {
  delete window.matchMedia; mount();
  expect(current.theme).toBe("dark");
  expect(document.documentElement.dataset.motion).toBe("full");
});

test("preferência persistida vence o sistema; interruptor salva sem white-content", () => {
  localStorage.setItem(THEME_STORAGE_KEY, "dark"); media[LIGHT_QUERY].matches = true;
  document.body.classList.add("white-content"); mount();
  expect(current.theme).toBe("dark");
  fireEvent.click(screen.getByRole("switch", { name: "Modo claro" }));
  expect(current.theme).toBe("light");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  expect(document.body.classList.contains("white-content")).toBe(false);
  notify(LIGHT_QUERY, false);
  expect(current.theme).toBe("light");
});

test("valor inválido usa escuro e seguir o sistema exige escolha explícita", () => {
  localStorage.setItem(THEME_STORAGE_KEY, "invalid"); mount();
  expect(current.theme).toBe("dark");
  notify(LIGHT_QUERY, true);
  expect(current.theme).toBe("dark");
  act(() => current.changeTheme("invalid"));
  expect(current.theme).toBe("dark");
  act(() => current.changeTheme("dark"));
  act(() => current.followSystemTheme());
  expect(current.theme).toBe("light");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
});

test("falha de leitura e escrita do localStorage não bloqueia tema nem movimento", () => {
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage unavailable"); });
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage unavailable"); });
  mount();
  fireEvent.click(screen.getByRole("switch", { name: "Modo claro" }));
  fireEvent.click(screen.getByRole("switch", { name: "Reduzir movimento" }));
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(document.documentElement.dataset.motion).toBe("reduced");
});

test("segue o sistema até o usuário escolher e permite desativar movimento reduzido", () => {
  media[MOTION_QUERY].matches = true; mount();
  expect(current.reduceMotion).toBe(true);
  expect(screen.getByRole("switch", { name: "Reduzir movimento" }).disabled).toBe(false);
  fireEvent.click(screen.getByRole("switch", { name: "Reduzir movimento" }));
  expect(document.documentElement.dataset.motion).toBe("full");
  expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe("false");
  notify(MOTION_QUERY, false);
  notify(MOTION_QUERY, true);
  expect(document.documentElement.dataset.motion).toBe("full");
});

test("escolha de movimento completo persiste mesmo com redução ativada no aparelho", () => {
  media[MOTION_QUERY].matches = true;
  const view = mount();
  fireEvent.click(screen.getByRole("switch", { name: "Reduzir movimento" }));
  view.unmount(); mount();
  expect(current.reduceMotion).toBe(false);
  expect(document.documentElement.dataset.motion).toBe("full");
  fireEvent.click(screen.getByRole("switch", { name: "Reduzir movimento" }));
  expect(document.documentElement.dataset.motion).toBe("reduced");
});

test("interruptor do app persiste movimento e preferência sobrevive à remontagem", () => {
  const view = mount();
  fireEvent.click(screen.getByRole("switch", { name: "Reduzir movimento" }));
  expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe("true");
  expect(background.reduceMotion).toBe(true);
  view.unmount(); mount();
  expect(current.reduceMotion).toBe(true);
  fireEvent.click(screen.getByRole("switch", { name: "Reduzir movimento" }));
  expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe("false");
  expect(document.documentElement.dataset.motion).toBe("full");
});

test("preferência de movimento inválida é ignorada", () => {
  localStorage.setItem(MOTION_STORAGE_KEY, "invalid"); mount();
  expect(current.reduceMotion).toBe(false);
  notify(MOTION_QUERY, true);
  expect(current.reduceMotion).toBe(true);
});

test("remove listeners de preferências quando o provedor é desmontado", () => {
  const view = mount();
  expect(media[LIGHT_QUERY].listeners.size).toBe(1);
  expect(media[MOTION_QUERY].listeners.size).toBe(1);
  view.unmount();
  expect(media[LIGHT_QUERY].listeners.size).toBe(0);
  expect(media[MOTION_QUERY].listeners.size).toBe(0);
});
