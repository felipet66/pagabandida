export const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
export const TURNSTILE_TIMEOUT_MS = 120000;
const SCRIPT_ID = "pagabandida-turnstile";

export const securityError = (code, message, turnstileCode) => Object.assign(new Error(message), {
  securityError: true, code, turnstileCode,
});
export const abortError = () => Object.assign(new Error("Operação cancelada."), { name: "AbortError" });

function widgetError(code) {
  const value = String(code || "");
  if (["110200", "400021"].includes(value)) return securityError("TURNSTILE_DOMAIN_UNAUTHORIZED",
    `A verificação de segurança não está autorizada para ${window.location.hostname}. A ganhebetBR precisa liberar este domínio para a sitekey do app.`, value);
  if (["110100", "110110", "400020", "400070"].includes(value)) return securityError("TURNSTILE_SITEKEY_INVALID",
    "A chave de segurança do app está inválida ou desativada. A ganhebetBR precisa confirmar e habilitar a sitekey.", value);
  return securityError("TURNSTILE_FAILED", "Não foi possível verificar a segurança. Tente novamente.", value);
}

function ensureScript() {
  let script = document.getElementById(SCRIPT_ID) || document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`);
  // A failed download may be retried manually; never insert two active scripts.
  if (script?.dataset.turnstileFailed === "true") { script.remove(); script = null; }
  if (!script) {
    script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.addEventListener("error", () => { script.dataset.turnstileFailed = "true"; }, { once: true });
    document.head.appendChild(script);
  }
  return script;
}

// A fresh widget per operation. Tokens live only in the promise result, never in storage or logs.
export function getTurnstileToken({ container, action, signal, sitekey = process.env.REACT_APP_TURNSTILE_SITE_KEY }) {
  if (signal?.aborted) return Promise.reject(abortError());
  if (!sitekey?.trim()) return Promise.reject(securityError("TURNSTILE_NOT_CONFIGURED", "A verificação de segurança não está configurada. Entre em contato com o suporte."));
  if (!container || !["cpf_lookup", "register"].includes(action)) return Promise.reject(securityError("TURNSTILE_NOT_READY", "A verificação de segurança não está disponível. Tente novamente."));

  return new Promise((resolve, reject) => {
    let api, widgetId, poll, deadline, script, settled = false;
    const cleanup = () => {
      clearTimeout(deadline);
      clearTimeout(poll);
      signal?.removeEventListener("abort", onAbort);
      script?.removeEventListener("error", onScriptError);
      if (widgetId != null) { try { api.remove(widgetId); } catch { /* The frame may already be gone. */ } }
    };
    const finish = (error, token) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error); else resolve(token);
    };
    const onAbort = () => finish(abortError());
    const onScriptError = () => finish(securityError("TURNSTILE_SCRIPT_FAILED", "Não foi possível carregar a verificação de segurança. Confira sua conexão e tente novamente."));
    const timeout = () => finish(securityError("TURNSTILE_TIMEOUT", "A verificação de segurança demorou demais. Tente novamente."));
    deadline = setTimeout(timeout, TURNSTILE_TIMEOUT_MS);
    signal?.addEventListener("abort", onAbort, { once: true });
    const renderWhenReady = () => {
      if (settled) return;
      if (typeof window.turnstile?.render !== "function") {
        poll = setTimeout(renderWhenReady, 50);
        return;
      }
      api = window.turnstile;
      try {
        widgetId = api.render(container, {
          sitekey, action, appearance: "interaction-only", retry: "auto",
          theme: document.documentElement.dataset.theme === "light" ? "light" : "dark",
          size: container.clientWidth > 0 && container.clientWidth < 300 ? "compact" : "flexible",
          language: "pt-br", "response-field": false,
          "refresh-expired": "never", "refresh-timeout": "never",
          callback: token => typeof token === "string" && token.trim()
            ? finish(null, token) : finish(widgetError()),
          "error-callback": code => { finish(widgetError(code)); return true; },
          "expired-callback": () => finish(securityError("TURNSTILE_EXPIRED", "A verificação de segurança expirou. Tente novamente.")),
          "timeout-callback": timeout,
        });
        // Handles APIs/test adapters that call a callback synchronously inside render().
        if (settled && widgetId != null) { try { api.remove(widgetId); } catch { /* Already removed. */ } }
      } catch { finish(widgetError()); }
    };
    try {
      script = ensureScript();
      script.addEventListener("error", onScriptError, { once: true });
      renderWhenReady();
    } catch { onScriptError(); }
  });
}
