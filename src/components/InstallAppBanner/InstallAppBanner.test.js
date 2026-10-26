import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import InstallAppBanner from "./InstallAppBanner";

import Swal from "sweetalert2";

jest.mock("sweetalert2", () => ({
  fire: jest.fn(), getPopup: jest.fn(), close: jest.fn(),
}));

let root, host, popup;
let standalone = false;
const originalMatchMedia = window.matchMedia;
const originalAgent = navigator.userAgent;
beforeEach(() => {
  localStorage.clear();
  global.IS_REACT_ACT_ENVIRONMENT = true;
  standalone = false;
  Object.defineProperty(navigator, "userAgent", { configurable: true, value: "Desktop fixture browser" });
  popup = null;
  Swal.getPopup.mockImplementation(() => popup);
  Swal.fire.mockImplementation(options => {
    popup = document.createElement("div");
    popup.setAttribute("role", "dialog");
    popup.innerHTML = options.html;
    document.body.appendChild(popup);
    Swal.close.mockImplementation(() => {
      options.willClose(); popup?.remove(); popup = null;
    });
    options.didOpen(popup);
    return Promise.resolve({ isConfirmed: false });
  });
  window.matchMedia = jest.fn(query => ({
    matches: query.includes("standalone") ? standalone : true,
    addEventListener: jest.fn(), removeEventListener: jest.fn(),
  }));
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  popup?.remove();
  jest.clearAllMocks();
  window.matchMedia = originalMatchMedia;
  Object.defineProperty(navigator, "userAgent", { configurable: true, value: originalAgent });
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
const mount = () => act(() => root.render(<InstallAppBanner><main>Conteúdo do aplicativo</main></InstallAppBanner>));
const click = selector => act(() => document.querySelector(selector).click());

test("permite escolher Android ou iPhone e voltar ao login", () => {
  mount();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  click(".install-app-bar__action");
  expect(document.querySelector('[role="dialog"]').textContent).toContain("Google Chrome");
  click(".install-app-platform button:nth-child(2)");
  expect(document.querySelector('[role="dialog"]').textContent).toContain("Safari");
  expect(document.querySelectorAll(".install-app-steps li")).toHaveLength(3);
  expect(Swal.fire.mock.calls[0][0].confirmButtonText).toBe("Entendi");
  act(() => Swal.close());
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(host.querySelector(".install-app-bar")).not.toBeNull();
});

test("não sugere instalação no modo instalado", () => {
  standalone = true;
  mount();
  expect(host.querySelector(".install-app-bar")).toBeNull();
});

test("oculta o aviso e fecha as instruções quando o navegador confirma instalação", () => {
  mount(); click(".install-app-bar__action");
  act(() => window.dispatchEvent(new Event("appinstalled")));
  expect(host.querySelector(".install-app-bar")).toBeNull();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(localStorage.getItem("pagabandida:pwa-installed")).toBe("1");
  act(() => root.unmount()); root = createRoot(host); mount();
  expect(host.querySelector(".install-app-bar")).toBeNull();
});

test("oferece Baixar app também no desktop, preservando o conteúdo e instruções para computador", () => {
  mount();
  expect(host.textContent).toContain("Conteúdo do aplicativo");
  expect(host.querySelector(".install-app-bar__action").textContent).toContain("Baixar app");
  expect(host.querySelector(".has-install-banner")).not.toBeNull();
  click(".install-app-bar__action");
  expect(document.querySelector('[data-platform="desktop"]').getAttribute("aria-pressed")).toBe("true");
  expect(popup.textContent).toContain("Microsoft Edge");
});

test("evento nativo só é usado após clique, não sobrepõe prompts e é consumido uma vez", async () => {
  mount();
  let finish;
  const event = new Event("beforeinstallprompt", { cancelable: true });
  event.prompt = jest.fn(() => new Promise(resolve => { finish = resolve; }));
  event.userChoice = Promise.resolve({ outcome: "dismissed" });
  act(() => window.dispatchEvent(event));
  expect(event.defaultPrevented).toBe(true); expect(event.prompt).not.toHaveBeenCalled();
  act(() => { host.querySelector("button").click(); host.querySelector("button").click(); });
  expect(event.prompt).toHaveBeenCalledTimes(1); expect(host.querySelector("button").disabled).toBe(true);
  expect(Swal.fire).not.toHaveBeenCalled();
  await act(async () => finish());
  expect(host.querySelector("button").disabled).toBe(false);
  click(".install-app-bar__action");
  expect(event.prompt).toHaveBeenCalledTimes(1); expect(Swal.fire).toHaveBeenCalledTimes(1);
});

test("falha do prompt oferece instruções e libera o botão", async () => {
  mount(); const event = new Event("beforeinstallprompt", { cancelable: true });
  event.prompt = jest.fn().mockRejectedValue(new Error("unavailable"));
  act(() => window.dispatchEvent(event));
  await act(async () => host.querySelector("button").click());
  expect(Swal.fire).toHaveBeenCalledTimes(1); expect(host.querySelector("button").disabled).toBe(false);
});

test("detecta iPhone e não reserva espaço quando já instalado", () => {
  Object.defineProperty(navigator, "userAgent", { configurable: true, value: "iPhone Safari" });
  mount(); click(".install-app-bar__action");
  expect(popup.querySelector('[data-platform="ios"]').getAttribute("aria-pressed")).toBe("true");
  act(() => window.dispatchEvent(new Event("appinstalled")));
  expect(host.querySelector(".has-install-banner")).toBeNull();
  expect(host.querySelector("main").textContent).toBe("Conteúdo do aplicativo");
});

test("desmontar remove listeners e não fecha outro modal da aplicação", () => {
  mount(); click(".install-app-bar__action");
  const remove = jest.spyOn(window, "removeEventListener");
  Swal.getPopup.mockReturnValue(document.createElement("div"));
  act(() => root.unmount());
  expect(Swal.close).not.toHaveBeenCalled();
  expect(remove).toHaveBeenCalledWith("beforeinstallprompt", expect.any(Function));
  expect(remove).toHaveBeenCalledWith("appinstalled", expect.any(Function));
  remove.mockRestore(); root = createRoot(host);
});

test("mudança para modo independente fecha as instruções e retira a faixa", () => {
  mount(); click(".install-app-bar__action");
  const watcher = window.matchMedia.mock.results.map(result => result.value).find(media => media.addEventListener.mock.calls.length);
  standalone = true;
  act(() => watcher.addEventListener.mock.calls[0][1]({ matches: true }));
  expect(host.querySelector(".has-install-banner")).toBeNull();
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});

test("navegar entre conteúdos mantém uma única faixa e o evento de instalação disponível", async () => {
  mount(); const event = new Event("beforeinstallprompt", { cancelable: true });
  event.prompt = jest.fn().mockResolvedValue({ outcome: "dismissed" });
  act(() => window.dispatchEvent(event));
  act(() => root.render(<InstallAppBanner><main>Cadastro</main></InstallAppBanner>));
  expect(host.querySelectorAll(".install-app-bar")).toHaveLength(1);
  await act(async () => host.querySelector("button").click());
  expect(event.prompt).toHaveBeenCalledTimes(1); expect(Swal.fire).not.toHaveBeenCalled();
  expect(host.querySelector("main").textContent).toBe("Cadastro");
});

test("fechar oculta a faixa sem gravar dispensa; uma nova visita volta a oferecer instalação", () => {
  mount();
  const close = host.querySelector('button[aria-label="Fechar aviso de instalação"]');
  expect(close).not.toBeNull();
  act(() => close.click());
  expect(host.querySelector(".install-app-bar")).toBeNull();
  expect(host.querySelector(".has-install-banner")).toBeNull();
  expect(localStorage.length).toBe(0);
  act(() => root.render(<InstallAppBanner><main>Outra tela</main></InstallAppBanner>));
  expect(host.querySelector(".install-app-bar")).toBeNull();
  expect(host.textContent).toContain("Outra tela");
  act(() => root.unmount()); root = createRoot(host); mount();
  expect(host.querySelector(".install-app-bar")).not.toBeNull();
});

test("aceitar o prompt sem confirmação appinstalled não registra instalação", async () => {
  mount();
  const event = new Event("beforeinstallprompt", { cancelable: true });
  event.prompt = jest.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome: "accepted" });
  act(() => window.dispatchEvent(event));
  await act(async () => host.querySelector(".install-app-bar__action").click());
  expect(localStorage.getItem("pagabandida:pwa-installed")).toBeNull();
  expect(host.querySelector(".install-app-bar")).not.toBeNull();
});

test("modo instalado é lembrado ao voltar pelo navegador e nova oferta nativa permite reinstalar", () => {
  standalone = true; mount();
  expect(localStorage.getItem("pagabandida:pwa-installed")).toBe("1");
  act(() => root.unmount()); root = createRoot(host);
  standalone = false; mount();
  expect(host.querySelector(".install-app-bar")).toBeNull();
  const event = new Event("beforeinstallprompt", { cancelable: true });
  act(() => window.dispatchEvent(event));
  expect(localStorage.getItem("pagabandida:pwa-installed")).toBeNull();
  expect(host.querySelector(".install-app-bar")).not.toBeNull();
});
