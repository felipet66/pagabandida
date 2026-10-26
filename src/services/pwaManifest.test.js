import fs from "fs";
import path from "path";

const html = fs.readFileSync(path.join(process.cwd(), "public/index.html"), "utf8");
const manifestHref = new DOMParser().parseFromString(html, "text/html")
  .querySelector('link[rel="manifest"]').getAttribute("href");

test.each([
  "https://pagabandida.example.invalid",
  "https://main--pagabandida.example.invalid",
  "https://deploy-preview-42--pagabandida.example.invalid",
  "https://app.example.invalid",
])("instalação a partir do login mantém todas as rotas no escopo em %s", origin => {
  const installUrl = new URL("/auth/login?source=homescreen", origin);
  const manifestUrl = new URL(manifestHref, installUrl);
  expect(manifestUrl.origin).toBe(installUrl.origin);

  for (const file of ["manifest.json", "site.webmanifest"]) {
    const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", file), "utf8"));
    const startUrl = new URL(manifest.start_url, manifestUrl);
    const scope = new URL(manifest.scope, manifestUrl);
    expect(startUrl.origin).toBe(installUrl.origin);
    expect(startUrl.pathname.startsWith(scope.pathname)).toBe(true);
    expect(manifest.display).toBe("standalone");
    for (const route of ["/", "/auth/login", "/auth/register", "/jogos", "/admin/jogos", "/admin/dashboard"]) {
      const destination = new URL(route, installUrl);
      expect(destination.origin).toBe(scope.origin);
      expect(destination.pathname.startsWith(scope.pathname)).toBe(true);
    }
  }
});
