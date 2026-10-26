import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Clock3, Gamepad2, History, Menu, Wallet } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import "./BottomNavigation.css";

export default function BottomNavigation({ routes, onOpenAccount, accountOpen = false }) {
  const location = useLocation();
  const findRoute = path => routes.find(route => !route.redirect && route.layout === "/admin" && route.path === path);
  const shortcuts = [
    { route: findRoute("/dashboard"), label: "Histórico", icon: History },
    { route: findRoute("/horarios"), label: "I.A PRO", icon: Clock3 },
    { route: findRoute("/jogos"), label: "Jogos", central: true },
    { route: findRoute("/deposit"), label: "Depositar", icon: Wallet },
  ];
  return (
    <nav className="bottom-navigation bottom-navigation--games" aria-label="Navegação principal">
      {shortcuts.filter(item => item.route).map(({ route, label, central, icon }) => {
        const path = route.layout + route.path;
        const active = location.pathname.replace(/\/+$/, "") === path;
        return (
          <NavLink key={path} to={path} exact activeClassName="active" className={`bottom-nav-item${central ? " bottom-nav-item--games" : ""}`} aria-label={central ? "Abrir jogos" : label}>
            {central ? <span className="bottom-nav-games-icon"><Icon as={Gamepad2} size={26} /></span> : <Icon as={icon} size={20} />}
            <span className="bottom-nav-label">{label}</span>
            {active && <span className="bottom-nav-active-dot" aria-hidden="true" />}
          </NavLink>
        );
      })}
      <button type="button" className={`bottom-nav-item${accountOpen ? " active" : ""}`} onClick={onOpenAccount} aria-label="Abrir menu da conta" aria-haspopup="dialog" aria-expanded={accountOpen}>
        <Icon as={Menu} size={20} />
        <span className="bottom-nav-label">Menu</span>
      </button>
    </nav>
  );
}
