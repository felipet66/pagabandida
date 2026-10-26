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
import { Link } from "react-router-dom";
import { FaRegQuestionCircle } from "react-icons/fa";
import { CircleHelp } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import logo from "assets/brand/pagabandida-emblema-verde-512.webp";
import "./AuthNavbar.css";

export default function AuthNavbar({ brandText, designSystem = false }) {
  return (
    <nav className="navbar auth-navbar" aria-label="Navegação de acesso">
      <div className="auth-navbar__inner">
        <div className="auth-navbar__brand">
          <Link to="/jogos" className="auth-navbar__logo" aria-label="Paga Bandida — explorar jogos">
            <img src={logo} alt="Paga Bandida" />
          </Link>
          <span className="auth-navbar__page">{brandText}</span>
        </div>
        <a className="auth-navbar__help"
          href={SUPPORT_URL}
          target="_blank" rel="noopener noreferrer" aria-label="Falar com o suporte pelo WhatsApp (abre em nova aba)">
          {designSystem ? <Icon as={CircleHelp} size={20} /> : <FaRegQuestionCircle aria-hidden="true" />}<span>Ajuda</span>
        </a>
      </div>
    </nav>
  );
}
