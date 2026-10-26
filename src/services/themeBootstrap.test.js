import fs from "fs";
import path from "path";
import vm from "vm";
import { LIGHT_QUERY, MOTION_QUERY } from "./themePreferences";
const html = fs.readFileSync(path.join(process.cwd(), "public/index.html"), "utf8");
const script = html.match(/<script id="pagabandida-theme-bootstrap">([\s\S]*?)<\/script>/)[1];
const run = ({ theme = null, motion = null, light = false, reduced = false, blocked = false } = {}) => {
  vm.runInNewContext(script, { document, window: { matchMedia: query => ({ matches: query === LIGHT_QUERY ? light : query === MOTION_QUERY ? reduced : false }) }, localStorage: { getItem(key) {
    if (blocked) throw new Error("Storage unavailable");
    return key === "pagabandida:theme" ? theme : motion;
  } } });
};
test("bootstrap precede recursos e define o tema persistido antes do React", () => {
  expect(html.indexOf("pagabandida-theme-bootstrap")).toBeLessThan(html.indexOf('<link rel="manifest"'));
  run({ theme: "light", motion: "true" });
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(document.documentElement.dataset.motion).toBe("reduced");
});
test("sem preferência válida usa escuro mesmo com sistema claro e armazenamento bloqueado", () => {
  run({ light: true });
  expect(document.documentElement.dataset.theme).toBe("dark");
  run({ theme: "invalid", light: true });
  expect(document.documentElement.dataset.theme).toBe("dark");
  run({ blocked: true, light: true, reduced: true });
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(document.documentElement.dataset.motion).toBe("reduced");
});
test("sem APIs de preferência, usa modo escuro e não depende de fontes remotas", () => {
  vm.runInNewContext(script, { document, window: {}, localStorage: { getItem: () => null } });
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(html).not.toContain("fonts.googleapis.com");
});
