import React from "react";
import ReactDOM from "react-dom";
import LogRocket from "logrocket";
import { BrowserRouter, Route, Switch, Redirect, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "assets/css/tokens.css";
import "@fontsource/chakra-petch/latin-600.css";
import "@fontsource/chakra-petch/latin-700.css";
import "@fontsource/sora/latin-400.css";
import "@fontsource/sora/latin-500.css";
import "@fontsource/sora/latin-600.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-600.css";
import "@fontsource/jetbrains-mono/latin-700.css";

import AdminLayout from "layouts/Admin/Admin.js";
import RTLLayout from "layouts/RTL/RTL.js";
import AuthLayout from "layouts/Auth/Auth.js";

import ThemeContextWrapper from "./components/ThemeWrapper/ThemeWrapper";
import BackgroundColorWrapper from "./components/BackgroundColorWrapper/BackgroundColorWrapper";
import MaintenanceNotice from "./components/MaintenanceNotice/MaintenanceNotice";
import LogRocketIdentity from "./components/LogRocketIdentity/LogRocketIdentity";

import "assets/scss/black-dashboard-react.scss";
import "assets/demo/demo.css";
import "assets/css/nucleo-icons.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "assets/css/app-layout.css";

import GameCatalog from "views/GameCatalog";
import PendingGameRedirect from "components/Catalog/PendingGameRedirect";

import { initializeAnalytics } from "services/analytics";
import useTrackingParams from "hooks/useTrackingParams";
import DepositRanking from "views/DepositRanking";
import useDepositSync from "hooks/useDepositSync";
import { migrateAppStorage, retireLegacyServiceWorkers } from "services/appStorage";
import "assets/css/design-system.css";
import { GamificationProvider } from "./contexts/GamificationContext";
import { TournamentsProvider } from "./contexts/TournamentsContext";
import InstallAppBanner from "components/InstallAppBanner/InstallAppBanner";
const AviatorLanding = React.lazy(() => import("views/landings/AviatorLanding"));

// The review route and its assets are excluded from production builds.
const StyleGuide = process.env.NODE_ENV !== "production" ? React.lazy(() => import("views/StyleGuide")) : null;

if (process.env.REACT_APP_LOGROCKET_APP_ID) LogRocket.init(process.env.REACT_APP_LOGROCKET_APP_ID);

migrateAppStorage();
initializeAnalytics();
retireLegacyServiceWorkers();

function DepositSessionSync({ children }) {
  useLocation();
  useDepositSync(null, { once: true });
  return children;
}

function TrackingCapture({ children }) {
  useTrackingParams();
  return children;
}

const queryClient = new QueryClient();

function CoreRoutes() {
  return <MaintenanceNotice>
    <InstallAppBanner>
    <GamificationProvider><TrackingCapture><PendingGameRedirect><DepositSessionSync><TournamentsProvider>
      <Switch>
        <Route exact path="/ranking" component={DepositRanking} />
        <Route exact path="/jogos" component={GameCatalog} />
        <Redirect exact from="/gamificacao" to="/admin/gamificacao" />
        <Redirect exact from="/torneios" to="/admin/torneios" />
        <Route path="/admin" render={props => <AdminLayout {...props} />} />
        <Route path="/rtl" render={props => <RTLLayout {...props} />} />
        <Route path="/auth" render={props => <AuthLayout {...props} />} />
        <Redirect from="/" to="/jogos" />
      </Switch>
    </TournamentsProvider></DepositSessionSync></PendingGameRedirect></TrackingCapture></GamificationProvider>
    </InstallAppBanner>
  </MaintenanceNotice>;
}

function ApplicationRoutes() {
  return <Switch>
    <Route exact path={['/lp', '/lp/:variant(quiz|analise|comunidade)']} render={() => <React.Suspense fallback={<p role="status">Carregando...</p>}><AviatorLanding /></React.Suspense>} />
    {StyleGuide && <Route exact path="/styleguide" render={() => <React.Suspense fallback={<p role="status">Carregando guia de estilo...</p>}><StyleGuide /></React.Suspense>} />}
    <Route component={CoreRoutes} />
  </Switch>;
}

ReactDOM.render(
  <QueryClientProvider client={queryClient}>
    <ThemeContextWrapper>
      <BackgroundColorWrapper>
        <BrowserRouter><LogRocketIdentity /><ApplicationRoutes /></BrowserRouter>
      </BackgroundColorWrapper>
    </ThemeContextWrapper>
  </QueryClientProvider>,
  document.getElementById("root")
);
