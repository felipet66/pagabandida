import { SUPPORT_URL } from "config/support";
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
import { NavLink, Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Activity, BookOpen, ChartPie, Clock3, Gamepad2, History, Landmark, LayoutGrid, MessageCircle, Trophy, Wallet, X } from "lucide-react";
import Icon from "components/DesignSystem/Icon";

import { BackgroundColorContext } from "contexts/BackgroundColorContext";
import "./Sidebar.css";
import { useTournaments } from "../../contexts/TournamentsContext";

const routeIcons = { "/aulas": BookOpen, "/ranking": Trophy, "/jogos": Gamepad2, "/dashboard": History, "/gestao-banca": ChartPie, "/horarios": Clock3, "/analises-tempo-real": Activity, "/deposit": Wallet, "/withdraw": Landmark };

function Sidebar({ routes, rtlActive, logo, toggleSidebar }) {
  const { unsupported } = useTournaments();
  const closeSidebar = () => {
    if (document.documentElement.classList.contains("nav-open")) toggleSidebar?.();
  };
  const entries = routes.filter(route => !route.redirect && !route.hideInSidebar && !(unsupported && route.sidebarPath === "/torneios"));
  const sections = entries.reduce((groups, route) => {
    const section = route.sidebarSection || "Navegação";
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section).push(route);
    return groups;
  }, new Map());
  const orderedSections = Array.from(sections).sort(([left], [right]) =>
    Number(left === "Comunidade") - Number(right === "Comunidade")
  );
  const brand = logo && <img src={logo.imgSrc} alt={typeof logo.text === "string" ? logo.text : "Paga Bandida"} />;

  return (
    <BackgroundColorContext.Consumer>
      {({ color }) => (
        <aside className="sidebar app-sidebar" data={color} aria-label="Menu principal">
          <div className="sidebar-wrapper app-sidebar__wrapper">
            <div className="app-sidebar__header">
              {logo && (logo.innerLink || !logo.outterLink ?
                <Link className="app-sidebar__brand" to={logo.innerLink || "/admin/jogos"} onClick={closeSidebar}>{brand}</Link> :
                <a className="app-sidebar__brand" href={logo.outterLink} target="_blank" rel="noopener noreferrer" onClick={closeSidebar}>{brand}</a>)}
              <button className="app-sidebar__close" type="button" onClick={closeSidebar} aria-label="Fechar menu lateral"><Icon as={X} size={20} /></button>
            </div>
            <nav className="app-sidebar__navigation" aria-label="Seções do aplicativo">
              {orderedSections.map(([section, entries]) => (
                <section className="app-sidebar__section" key={section}>
                  <h2>{section}</h2>
                  <ul>
                    {entries.map(route => (
                      <li key={route.layout + route.path}>
                        <NavLink exact={!route.sidebarPath} to={route.layout + (route.sidebarPath || route.path)} className="app-sidebar__link" activeClassName="is-active" onClick={closeSidebar}>
                          <span className="app-sidebar__icon"><Icon as={route.sidebarPath === "/torneios" ? Trophy : routeIcons[route.path] || LayoutGrid} size={20} /></span>
                          <span className="app-sidebar__label">{rtlActive ? route.rtlName || route.name : route.name}</span>
                          {route.sidebarBadge && <span className="app-sidebar__badge">{route.sidebarBadge}</span>}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </nav>
            <footer className="app-sidebar__footer">
              <a className="app-sidebar__support" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
                <Icon as={MessageCircle} size={20} /><span>Fale com o suporte</span>
              </a>
              <span className="app-sidebar__caption">Paga Bandida · ganhebetBR</span>
            </footer>
          </div>
        </aside>
      )}
    </BackgroundColorContext.Consumer>
  );
}

Sidebar.propTypes = {
  rtlActive: PropTypes.bool,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
  toggleSidebar: PropTypes.func,
  logo: PropTypes.shape({ innerLink: PropTypes.string, outterLink: PropTypes.string, text: PropTypes.node, imgSrc: PropTypes.string }),
};

export default Sidebar;
