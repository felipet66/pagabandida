import { APP_ID } from "config/app";

export function initializeAnalytics() {
  const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
  const containerId = process.env.REACT_APP_GTM_ID;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ app_id: APP_ID });
  if (/^G-[A-Z0-9]+$/.test(measurementId || "")) {
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, { app_id: APP_ID });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }
  if (/^GTM-[A-Z0-9]+$/.test(containerId || "")) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js", app_id: APP_ID });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
    document.head.appendChild(script);
  }
}
