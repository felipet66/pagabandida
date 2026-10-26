import { BET_HOUSE } from "config/betHouse";
/*!

=========================================================
* Black Dashboard React v1.2.1
=========================================================
 
* Product Page: https://www.creative-tim.com/product/black-dashboard-react
* Copyright 2022 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/black-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";
import Swal from "sweetalert2";
import {
  Route,
  Switch,
  Redirect,
  useLocation
} from "react-router-dom";
// javascript plugin used to create scrollbars on windows
import PerfectScrollbar from "perfect-scrollbar";

// core components
import AdminNavbar from "components/Navbars/AdminNavbar.js";
import Footer from "components/Footer/Footer.js";
import Sidebar from "components/Sidebar/Sidebar.js";
import BottomNavigation from "components/BottomNavigation/BottomNavigation";
import FloatingClock from "components/FloatingClock/FloatingClock";

import routes from "routes.js";
import bffApi from "../../services/bffApi";

import { BackgroundColorContext } from "contexts/BackgroundColorContext";
import { useMaintenanceNotice } from "contexts/MaintenanceNoticeContext";
import logo from "assets/brand/pagabandida-emblema-verde-512.webp";
import "assets/css/app-design.css";

import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

var ps;
const KYC_POLL_INTERVAL_MS = 5000;
const KYC_MAX_POLL_ATTEMPTS = 24;
const getResponseData = response => response?.data?.data || response?.data || {};

function Admin(props) {
  const location = useLocation();
  const tournamentScreen = /^\/admin\/torneios(?:\/|$)/.test(location.pathname);
  const { maintenanceAcknowledged } = useMaintenanceNotice();
  const mainPanelRef = React.useRef(null);
  const kycAlertOpenRef = React.useRef(false);
  const kycPollingRef = React.useRef(null);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const openAccount = React.useCallback(() => setAccountOpen(true), []);
  const closeAccount = React.useCallback(() => setAccountOpen(false), []);
  const [sidebarOpened, setsidebarOpened] = React.useState(
    document.documentElement.className.indexOf("nav-open") !== -1
  );

  const openKycStatusPolling = React.useCallback(kycId => {
    if (!kycId || kycPollingRef.current) return;

    let attempts = 0;

    kycPollingRef.current = window.setInterval(async () => {
      attempts += 1;

      try {
        const statusResponse = await bffApi.get("api/auth/kyc/status", {
          params: { kyc_id: kycId }
        });
        const statusData = getResponseData(statusResponse);

        if (statusData?.status === 1) {
          window.clearInterval(kycPollingRef.current);
          kycPollingRef.current = null;

          await bffApi.get("api/auth/user-profile");

          Swal.fire({
            icon: "success",
            title: "KYC aprovado",
            text: "Sua verificação foi concluída com sucesso.",
            confirmButtonText: "Continuar"
          });
        }
      } catch (error) {
        window.clearInterval(kycPollingRef.current);
        kycPollingRef.current = null;
      }

      if (attempts >= KYC_MAX_POLL_ATTEMPTS && kycPollingRef.current) {
        window.clearInterval(kycPollingRef.current);
        kycPollingRef.current = null;
      }
    }, KYC_POLL_INTERVAL_MS);
  }, []);

  const handleOpenKyc = React.useCallback(async () => {
    try {
      const kycResponse = await bffApi.get("api/auth/kyc", {
        params: { source: "casino" }
      });
      const kycData = getResponseData(kycResponse);
      const kycUrl = kycData?.url || BET_HOUSE.siteUrl;
      const kycId = kycData?.kyc_id || kycData?.correlation_id;

      window.open(kycUrl, "_blank", "noopener,noreferrer");
      openKycStatusPolling(kycId);
    } catch (error) {
      if (error.response?.status === 401) return;

      Swal.fire({
        icon: "warning",
        title: "Validação KYC necessária",
        text: `Não foi possível abrir a verificação automática. Realize a verificação diretamente pelo site da ${BET_HOUSE.name}.`,
        confirmButtonText: `Abrir ${BET_HOUSE.name}`,
        showCancelButton: true,
        cancelButtonText: "Agora não",
      }).then(result => {
        if (result.isConfirmed) {
          window.open(BET_HOUSE.siteUrl, "_blank", "noopener,noreferrer");
        }
      });
    }
  }, [openKycStatusPolling]);

  React.useEffect(() => {
    if (!maintenanceAcknowledged) return undefined;

    let isMounted = true;

    const validateKyc = async () => {
      if (kycAlertOpenRef.current) return;

      try {
        const profileResponse = await bffApi.get("api/auth/user-profile");
        const profile = getResponseData(profileResponse);
        const kyc = profile?.kyc;

        const needsKyc = Boolean(kyc?.required);
        const isKycValidated = Boolean(kyc?.validated);
        const isKycApproved = kyc?.status === 1 || Boolean(kyc?.validated_at);

        if (!isMounted || isKycValidated || isKycApproved || !needsKyc) return;

        kycAlertOpenRef.current = true;

        Swal.fire({
          icon: "warning",
          title: "Verificação de documentos pendente",
          text: `Para continuar usando os jogos, realize a validação KYC da sua conta ${BET_HOUSE.name}.`,
          confirmButtonText: "Verificar agora",
          showCancelButton: true,
          cancelButtonText: "Fazer depois",
          allowOutsideClick: false,
        }).then(result => {
          kycAlertOpenRef.current = false;

          if (result.isConfirmed) {
            handleOpenKyc();
          }
        });
      } catch (error) {
        if (error.response?.status === 401) return;
        if (!isMounted || kycAlertOpenRef.current) return;

        kycAlertOpenRef.current = true;

        Swal.fire({
          icon: "warning",
          title: "Não foi possível validar o KYC",
          text: `Realize ou confira sua verificação diretamente pelo site da ${BET_HOUSE.name}.`,
          confirmButtonText: `Abrir ${BET_HOUSE.name}`,
          showCancelButton: true,
          cancelButtonText: "Agora não",
        }).then(result => {
          kycAlertOpenRef.current = false;

          if (result.isConfirmed) {
            window.open(BET_HOUSE.siteUrl, "_blank", "noopener,noreferrer");
          }
        });
      }
    };

    validateKyc();

    return () => {
      isMounted = false;

      if (kycPollingRef.current) {
        window.clearInterval(kycPollingRef.current);
        kycPollingRef.current = null;
      }
    };
  }, [handleOpenKyc, maintenanceAcknowledged]);

  React.useEffect(() => {
    if (navigator.platform.indexOf("Win") > -1) {
      document.documentElement.className += " perfect-scrollbar-on";
      document.documentElement.classList.remove("perfect-scrollbar-off");
      ps = new PerfectScrollbar(mainPanelRef.current, {
        suppressScrollX: true
      });
      let tables = document.querySelectorAll(".table-responsive");
      for (let i = 0; i < tables.length; i++) {
        ps = new PerfectScrollbar(tables[i]);
      }
    }
    // Specify how to clean up after this effect:
    return function cleanup() {
      if (navigator.platform.indexOf("Win") > -1) {
        ps.destroy();
        document.documentElement.classList.add("perfect-scrollbar-off");
        document.documentElement.classList.remove("perfect-scrollbar-on");
      }
    };
  });
  React.useEffect(() => {
    if (navigator.platform.indexOf("Win") > -1) {
      let tables = document.querySelectorAll(".table-responsive");
      for (let i = 0; i < tables.length; i++) {
        ps = new PerfectScrollbar(tables[i]);
      }
    }
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    if (mainPanelRef.current) {
      mainPanelRef.current.scrollTop = 0;
    }
  }, [location]);
  // this function opens and closes the sidebar on small devices
  const toggleSidebar = () => {
    document.documentElement.classList.toggle("nav-open");
    setsidebarOpened(!sidebarOpened);
  };
  const getRoutes = routes => {
    return routes.map((prop, key) => {
      if (prop.layout === "/admin") {
        return (
          <Route
            path={prop.layout + prop.path}
            component={prop.component}
            key={key}
          />
        );
      } else {
        return null;
      }
    });
  };
  const getBrandText = path => {
    for (let i = 0; i < routes.length; i++) {
      if (location.pathname.indexOf(routes[i].layout + (routes[i].sidebarPath || routes[i].path)) !== -1) {
        return routes[i].name;
      }
    }
    return "Brand";
  };
  return (
    <BackgroundColorContext.Consumer>
      {({ color }) => (
        <React.Fragment>
          <div className={`wrapper${(tournamentScreen || ["/admin/jogos", "/admin/dashboard", "/admin/gestao-banca", "/admin/horarios", "/admin/analises-tempo-real", "/admin/deposit", "/admin/withdraw", "/admin/ranking", "/admin/gamificacao"].includes(location.pathname)) ? " app-design-layout fx" : ""}`}>
            <FloatingClock designSystem={(tournamentScreen || ["/admin/jogos", "/admin/dashboard", "/admin/gestao-banca", "/admin/horarios", "/admin/analises-tempo-real", "/admin/deposit", "/admin/withdraw", "/admin/ranking", "/admin/gamificacao"].includes(location.pathname))} />
            <Sidebar
              routes={routes}
              logo={{
                innerLink: "/admin/jogos",
                text: "Paga Bandida",
                imgSrc: logo
              }}
              toggleSidebar={toggleSidebar}
            />
            {sidebarOpened && <button type="button" className="admin-sidebar-backdrop" aria-label="Fechar menu lateral" onClick={toggleSidebar} />}
            <div className="main-panel admin-main-panel" ref={mainPanelRef} data={color}>
              <AdminNavbar
                brandText={getBrandText(location.pathname)}
                toggleSidebar={toggleSidebar}
                sidebarOpened={sidebarOpened}
                accountOpen={accountOpen}
                onOpenAccount={openAccount}
                onCloseAccount={closeAccount}
              />
              <Switch>
                {getRoutes(routes)}
                <Redirect from="*" to="/auth/login" />
              </Switch>
              <BottomNavigation
                routes={routes}
                onOpenAccount={openAccount}
                accountOpen={accountOpen}
              />
              {// we don't want the Footer to be rendered on map page
              location.pathname === "/admin/maps" ? null : <Footer fluid />}
            </div>
          </div>
        </React.Fragment>
      )}
    </BackgroundColorContext.Consumer>
  );
}

export default Admin;
