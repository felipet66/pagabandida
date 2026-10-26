import { useEffect } from "react";

const useTrackingParams = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    ["axioAffId", "axioClickId"].forEach(key => {
      const value = params.get(key);
      if (value) localStorage.setItem(key, value);
    });
    if (!localStorage.getItem("landingUrl") || params.has("axioAffId") || params.has("axioClickId")) {
      localStorage.setItem("landingUrl", window.location.href);
    }

    const utm_campaign = params.get("utm_campaign");
    const utm_source = params.get("utm_source");
    const utm_medium = params.get("utm_medium");
    const utm_content = params.get("utm_content");
    const utm_term = params.get("utm_term");

    // Só sobrescreve se vier na URL — preserva o valor anterior se não vier
    if (utm_campaign) localStorage.setItem("utm_campaign", utm_campaign);
    if (utm_source) localStorage.setItem("utm_source", utm_source);
    if (utm_medium) localStorage.setItem("utm_medium", utm_medium);
    if (utm_content) localStorage.setItem("utm_content", utm_content);
    if (utm_term) localStorage.setItem("utm_term", utm_term);

    // Captura ga_client_id do cookie do Google Analytics
    const gaCookie = document.cookie
      .split("; ")
      .find(row => row.startsWith("_ga="));

    if (gaCookie) {
      // Formato do cookie: GA1.1.XXXXXXXXXX.XXXXXXXXXX
      // ga_client_id = últimas duas partes: XXXXXXXXXX.XXXXXXXXXX
      const gaParts = gaCookie.split("=")[1].split(".");
      if (gaParts.length >= 4) {
        const gaClientId = `${gaParts[0]}.${gaParts[1]}.${gaParts[2]}.${gaParts[3]}`;
        localStorage.setItem("ga_client_id", gaClientId);
      }
    }
  }, []);
};

export default useTrackingParams;
