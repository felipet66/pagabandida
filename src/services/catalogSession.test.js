import { makeFixtureUrl, testCookie, testSession } from "../testSupport/fixtures";
const fixtureGameUrl0 = makeFixtureUrl();
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { MemoryRouter, Route, Switch } from "react-router-dom";
import bffApi from "./bffApi";
import PendingGameRedirect from "../components/Catalog/PendingGameRedirect";
import { rememberPendingGame, takePendingGame } from "./pendingGame";

jest.mock("sweetalert2", () => ({ fire: jest.fn() }));

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

it("uses the app key publicly and adds existing session headers only for launch", async () => {
  localStorage.setItem("access_token", testSession);
  localStorage.setItem("cookie_key", testCookie);
  const adapter = jest.fn(async config => ({ config, status: 200, statusText: "OK", headers: {}, data: { success: true, data: {} } }));
  await bffApi.get("api/games/catalog", { publicRequest: true, adapter });
  const publicHeaders = adapter.mock.calls[0][0].headers;
  expect(publicHeaders.get("X-App-Key")).toBeTruthy();
  expect(publicHeaders.get("Authorization")).toBeUndefined();
  expect(publicHeaders.get("X-Cookie-Key")).toBeUndefined();
  await bffApi.get("api/games/start-game-v2", { params: { slug: "pgsoft/fortune-tiger" }, adapter });
  const launchHeaders = adapter.mock.calls[1][0].headers;
  expect(launchHeaders.get("Authorization")).toBe(`Bearer ${testSession}`);
  expect(launchHeaders.get("X-Cookie-Key")).toBe(testCookie);
});

it("resumes the catalog after login without mounting the dashboard or storing a launch URL", () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const game = { launchSlug: "pgsoft/fortune-tiger", name: "Fortune Tiger", gameURL: fixtureGameUrl0 };
  rememberPendingGame(game);
  localStorage.setItem("access_token", testSession);
  const dashboardMounted = jest.fn();
  const Dashboard = () => { dashboardMounted(); return null; };
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(
    <MemoryRouter initialEntries={["/admin/dashboard"]}>
      <PendingGameRedirect><Switch>
        <Route path="/admin/dashboard" component={Dashboard} />
        <Route path="/admin/jogos" render={() => <p>Catálogo</p>} />
      </Switch></PendingGameRedirect>
    </MemoryRouter>
  ));
  expect(container.textContent).toBe("Catálogo");
  expect(dashboardMounted).not.toHaveBeenCalled();
  expect(takePendingGame()).toEqual({ launchSlug: game.launchSlug, name: game.name });
  expect(takePendingGame()).toBeNull();
  act(() => root.unmount());
  container.remove();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

it.each([
  ["/jogos", true, "Jogos no admin"],
  ["/admin/jogos", true, "Jogos no admin"],
  ["/admin/jogos", false, "Jogos públicos"],
  ["/jogos", false, "Jogos públicos"],
])("routes %s with authenticated=%s to the appropriate catalog", (path, authenticated, expected) => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  if (authenticated) localStorage.setItem("access_token", testSession);
  const container = document.createElement("div");
  const root = createRoot(container);
  act(() => root.render(
    <MemoryRouter initialEntries={[path]}>
      <PendingGameRedirect><Switch>
        <Route exact path="/admin/jogos" render={() => <p>Jogos no admin</p>} />
        <Route exact path="/jogos" render={() => <p>Jogos públicos</p>} />
      </Switch></PendingGameRedirect>
    </MemoryRouter>
  ));
  expect(container.textContent).toBe(expected);
  act(() => root.unmount());
  delete global.IS_REACT_ACT_ENVIRONMENT;
});
