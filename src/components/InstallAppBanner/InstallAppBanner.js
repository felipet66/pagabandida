import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { Download, X } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import appIcon from "assets/brand/pagabandida-emblema-verde-512.webp";
import { systemMatches, watchMedia } from "services/themePreferences";
import "./InstallAppBanner.css";

const INSTALLATION_KEY = "pagabandida:pwa-installed";
const isStandalone = () => Boolean(navigator.standalone || systemMatches("(display-mode: standalone)"));
const rememberInstallation = installed => {
  try {
    if (installed) localStorage.setItem(INSTALLATION_KEY, "1");
    else localStorage.removeItem(INSTALLATION_KEY);
  } catch { /* The banner still works when browser storage is unavailable. */ }
};
const isInstalled = () => {
  if (isStandalone()) return true;
  try { return localStorage.getItem(INSTALLATION_KEY) === "1"; } catch { return false; }
};
const detectPlatform = () => {
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return /Android/i.test(navigator.userAgent) ? "android" : "desktop";
};
const platforms = { android: { label: "Android", icon: "fab fa-android", browser: "Google Chrome" }, ios: { label: "iPhone / iPad", icon: "fab fa-apple", browser: "Safari" }, desktop: { label: "Computador", icon: "fas fa-desktop", browser: "Google Chrome ou Microsoft Edge" } };
const instructions = {
  android: [
    { title: "Abra o menu do Chrome", description: "Toque nos três pontos do navegador." },
    { title: "Adicione à tela inicial", description: "Escolha “Adicionar à tela inicial” ou “Instalar app”, conforme a opção exibida." },
    { title: "Confirme a instalação", description: "Toque em “Instalar” ou “Adicionar”. Depois, procure o ícone da Paga Bandida na sua tela inicial." },
  ],
  desktop: [
    { title: "Abra no Chrome ou Edge", description: "Acesse este site no navegador do computador." },
    { title: "Procure a opção de instalar", description: "Use o ícone de instalação na barra de endereço ou procure a opção de instalar o site no menu do navegador." },
    { title: "Confirme em Instalar", description: "Se essa opção não aparecer, salve o site nos favoritos para acessar facilmente." },
  ],
  ios: [
    { title: "Abra Compartilhar no Safari", description: "Toque no ícone de um quadrado com uma seta para cima. Ele também pode estar no menu do navegador." },
    { title: "Adicione à Tela de Início", description: "Role a lista de ações e escolha “Adicionar à Tela de Início”." },
    { title: "Confirme em Adicionar", description: "Se aparecer “Abrir como App da Web”, mantenha ativado. O ícone da Paga Bandida ficará na sua tela inicial." },
  ],
};

function InstallAppBanner({ children }) {
  const [installed, setInstalled] = useState(isInstalled);
  // Closing is temporary: it is deliberately not written to browser storage.
  const [dismissed, setDismissed] = useState(false);
  const [platform, setPlatform] = useState(detectPlatform);
  const [busy, setBusy] = useState(false);
  const popupRef = useRef(null);
  const deferredPrompt = useRef(null);
  const prompting = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const closeOwnPopup = () => { if (popupRef.current && Swal.getPopup() === popupRef.current) Swal.close(); };
    const complete = () => { rememberInstallation(true); deferredPrompt.current = null; setInstalled(true); closeOwnPopup(); };
    if (isStandalone()) complete();
    const stopDisplayWatch = watchMedia("(display-mode: standalone)", () => {
      if (isStandalone()) complete();
    });
    const ready = event => {
      event.preventDefault(); deferredPrompt.current = event;
      // A new native install offer can indicate that the user uninstalled the PWA.
      if (!isStandalone()) { rememberInstallation(false); setInstalled(false); }
    };
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", complete);
    return () => {
      mounted.current = false; deferredPrompt.current = null; stopDisplayWatch();
      window.removeEventListener("beforeinstallprompt", ready);
      window.removeEventListener("appinstalled", complete);
      closeOwnPopup();
    };
  }, []);

  const showInstructions = () => {
    const renderGuide = selected => `
      <p class="install-app-browser">Use o <strong>${platforms[selected].browser}</strong> para seguir estes passos.</p>
      <ol class="install-app-steps">${instructions[selected].map(({ title, description }, index) => `
        <li><span class="install-app-steps__number" aria-hidden="true">${index + 1}</span>
        <div><h3>${title}</h3><p>${description}</p></div></li>`).join("")}</ol>
      <p class="install-app-tip">Não encontrou a opção? Abra este site no ${platforms[selected].browser}, fora do navegador do WhatsApp ou Instagram.</p>`;

    Swal.fire({
      title: "Instale a Paga Bandida",
      html: `<p class="install-app-intro">Adicione à tela inicial para abrir como aplicativo.</p>
        <div class="install-app-platform" role="group" aria-label="Seu dispositivo">
          ${Object.entries(platforms).map(([key, item]) => `<button type="button" data-platform="${key}" aria-pressed="${platform === key}"><i class="${item.icon}" aria-hidden="true"></i> ${item.label}</button>`).join("")}
        </div><div class="install-app-guide" aria-live="polite" aria-atomic="true">${renderGuide(platform)}</div>`,
      showCloseButton: true,
      closeButtonAriaLabel: "Fechar instruções",
      confirmButtonText: "Entendi",
      buttonsStyling: false,
      returnFocus: true,
      customClass: {
        popup: "install-app-popup install-app-popup--design-system",
        title: "install-app-popup__title",
        htmlContainer: "install-app-popup__content",
        confirmButton: "install-app-popup__done",
        actions: "install-app-popup__actions",
        closeButton: "install-app-popup__close",
      },
      didOpen: popup => {
        popupRef.current = popup;
        const buttons = popup.querySelectorAll("[data-platform]");
        buttons.forEach(button => button.addEventListener("click", () => {
          const selected = button.dataset.platform;
          if (!instructions[selected]) return;
          setPlatform(selected);
          buttons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
          popup.querySelector(".install-app-guide").innerHTML = renderGuide(selected);
        }));
      },
      willClose: () => { popupRef.current = null; },
    });
  };

  const install = async () => {
    if (prompting.current) return;
    const prompt = deferredPrompt.current;
    if (!prompt) { showInstructions(); return; }
    deferredPrompt.current = null; prompting.current = true; setBusy(true);
    try { await prompt.prompt(); if (prompt.userChoice) await prompt.userChoice; }
    catch { if (mounted.current) showInstructions(); }
    finally { prompting.current = false; if (mounted.current) setBusy(false); }
  };

  const visible = !installed && !dismissed;
  return <div className={`install-app-layout${visible ? " has-install-banner" : ""}`}>
    {visible && <section className="install-app-bar" aria-label="Instalar Paga Bandida">
      <div className="install-app-bar__inner">
        <img className="install-app-bar__icon" src={appIcon} width="36" height="36" alt="" />
        <div className="install-app-bar__content"><h2>Paga Bandida</h2><p>Tenha o app na tela inicial.</p></div>
        <button type="button" className="install-app-bar__action" onClick={install} disabled={busy} aria-haspopup="dialog"><Icon as={Download} size={16} />{busy ? "Aguarde..." : "Baixar app"}</button>
        <button type="button" className="install-app-bar__close" onClick={() => setDismissed(true)} disabled={busy} aria-label="Fechar aviso de instalação" title="Fechar aviso de instalação"><Icon as={X} size={18} /></button>
      </div>
    </section>}
    {children}
  </div>;
}

export default InstallAppBanner;
