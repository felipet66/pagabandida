import { initializeAnalytics } from "./analytics";

beforeEach(() => {
  delete process.env.REACT_APP_GA_MEASUREMENT_ID;
  delete process.env.REACT_APP_GTM_ID;
  delete window.gtag;
  window.dataLayer = [];
  document.head.innerHTML = "";
});

test("sem propriedades novas não carrega serviços nem IDs herdados", () => {
  initializeAnalytics();
  expect(document.querySelectorAll("script")).toHaveLength(0);
  expect(window.dataLayer).toEqual([{ app_id: "pagabandida" }]);
});

test("propriedades configuradas recebem o identificador do aplicativo correto", () => {
  process.env.REACT_APP_GA_MEASUREMENT_ID = "G-FIXTURE";
  process.env.REACT_APP_GTM_ID = "GTM-FIXTURE";
  initializeAnalytics();
  expect([...document.querySelectorAll("script")].map(script => script.src)).toEqual([
    "https://www.googletagmanager.com/gtag/js?id=G-FIXTURE",
    "https://www.googletagmanager.com/gtm.js?id=GTM-FIXTURE",
  ]);
  const config = Array.from(window.dataLayer.find(event => event[0] === "config"));
  expect(config).toEqual(["config", "G-FIXTURE", { app_id: "pagabandida" }]);
  expect(window.dataLayer.find(event => event.event === "gtm.js").app_id).toBe("pagabandida");
});
