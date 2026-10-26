import fs from "fs";
import path from "path";
import { contrastRatio, composite } from "./designContrast";
const css = fs.readFileSync(path.join(process.cwd(), "src/assets/css/tokens.css"), "utf8");
const reference = fs.readFileSync(path.join(process.cwd(), "docs/design/tokens-referencia.css"), "utf8");
const declarations = body => Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
const themes = source => Object.fromEntries([...source.matchAll(/:root\[data-theme="(dark|light)"\]\s*\{([^}]+)\}/g)].map(([, theme, body]) => [theme, { body, tokens: declarations(body) }]));
const actual = themes(css), expected = themes(reference), common = declarations(css);
const semanticText = ["--text", "--text-2", "--text-3", "--primary-text", "--pink", "--success", "--warning", "--danger", "--info"];
const documented = Object.entries(expected).flatMap(([theme, { body }]) => [...body.matchAll(/(--[\w-]+)\s*:\s*(#[\da-f]+)\s*;\s*\/\*[^*]*\d+(?:[.,]\d+)?:1[^*]*\*\//gi)].map(([, token]) => [theme, token]));

test.each(["dark", "light"])("todos os valores da fonte da verdade são preservados no tema %s", theme => {
  expect(actual[theme].tokens).toEqual(expected[theme].tokens);
});

test.each(documented)("contraste AA documentado: %s / %s", (theme, token) => {
  const palette = actual[theme].tokens;
  const foreground = token === "--hero" ? (palette["--on-primary"] || common["--on-primary"]) : palette[token];
  const background = token === "--hero" ? palette[token] : palette["--surface-solid"];
  expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
});

test.each(["dark", "light"])("texto, semânticas e 6 alertas sobre superfície sólida: %s", theme => {
  const palette = actual[theme].tokens;
  const alerts = Object.keys(palette).filter(token => /^--a-/.test(token) && !token.endsWith("-soft"));
  expect(alerts).toHaveLength(6);
  for (const token of [...semanticText, ...alerts]) expect(contrastRatio(palette[token], palette["--surface-solid"])).toBeGreaterThanOrEqual(4.5);
  for (const token of alerts) {
    const softened = composite(palette[`${token}-soft`], palette["--surface-solid"]);
    expect(contrastRatio(palette[token], softened)).toBeGreaterThanOrEqual(4.5);
  }
  expect(contrastRatio(palette["--on-primary"] || common["--on-primary"], palette["--primary"])).toBeGreaterThanOrEqual(4.5);
});

test.each(["light", "dark"])("texto passa AA no gradiente primário: %s", theme => {
  const palette = actual[theme].tokens;
  const stops = (palette["--gradient-primary"] || common["--gradient-primary"]).match(/#[\da-f]{6}/gi);
  for (const stop of stops) expect(contrastRatio(palette["--on-primary"] || common["--on-primary"], composite(common["--button-scrim"], stop))).toBeGreaterThanOrEqual(4.5);
});

test("referências WCAG conhecidas validam a fórmula", () => {
  expect(contrastRatio("#FFFFFF", "#000000")).toBe(21);
  expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBe(1);
});
