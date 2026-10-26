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
import Home from "views/Home.js";
import TableList from "views/TableList.js";
import Typography from "views/Typography.js";
import Login from "views/Login";
import Register from "views/Register";
import AviatorGame from "views/AviatorGame";
import GoalsTracker from "views/GoalsTracker";
import Dashboard from "views/Dashboard";
import Deposits from "views/Deposit";
import Withdraw from "views/Withdraw";
import GamesSignal from "views/GamesSignal";
import AviatorPRO from "views/AviatorPRO";
import RealtimeAnalysis from "views/RealtimeAnalysis";
import AviatorCombined from "views/AviatorCombined";
import Aulas from "views/Aulas";
import BankrollManagement from "views/BankrollManagement";
import GameCatalog from "views/GameCatalog";
import DepositRanking from "views/DepositRanking";
import Gamification from "views/Gamification";
import Tournaments from "views/Tournaments";

// https://images.cometagaming.com/96df8b94-8149-41fe-694c-8973e30b6500/desktop
const AdminGameCatalog = () => <GameCatalog embedded />;
const AdminDepositRanking = () => <DepositRanking embedded />;

var routes = [
  {
    path: "/torneios/:tournamentId?", sidebarPath: "/torneios", sidebarSection: "Comunidade", name: "Torneios",
    icon: "fa fa-trophy", component: Tournaments, layout: "/admin",
  },
  {
    path: "/ranking", sidebarSection: "Comunidade", name: "Ranking de Players",
    icon: "fa fa-trophy", component: AdminDepositRanking, layout: "/admin",
  },
  {
    path: "/gamificacao", hideInSidebar: true, sidebarSection: "Comunidade", name: "Gamificação",
    icon: "fa fa-medal", component: Gamification, layout: "/admin",
  },
  {
    path: "/jogos",
    sidebarSection: "Jogar",
    name: "Jogos",
    icon: "fa fa-gamepad",
    component: AdminGameCatalog,
    layout: "/admin",
  },
  {
    path: "/dashboard",
    sidebarSection: "Ferramentas",
    name: "Histórico",
    icon: "fa fa-history",
    component: Home,
    layout: "/admin",
    showInBottom: true
  },
  {
    path: "/gestao-banca",
    sidebarSection: "Ferramentas",
    name: "Gestão de Banca",
    icon: "fa fa-chart-pie",
    component: BankrollManagement,
    layout: "/admin",
    showInBottom: true
  },
  {
    path: "/horarios",
    sidebarSection: "Ferramentas",
    name: "Paga Bandida I.A.",
    icon: "fa fa-clock", // ícone de horário
    component: AviatorPRO,
    layout: "/admin",
    showInBottom: true
  },
  {
    path: "/analises-tempo-real",
    sidebarSection: "Ferramentas",
    name: "Análises em Tempo Real",
    sidebarBadge: "NOVO",
    icon: "fa fa-bell",
    component: RealtimeAnalysis,
    layout: "/admin",
  },
  {
    path: "/deposit",
    sidebarSection: "Carteira",
    name: "Depositar",
    icon: "fa fa-wallet",
    component: Deposits,
    layout: "/admin",
    showInBottom: true
  },
  {
    path: "/withdraw",
    sidebarSection: "Carteira",
    name: "Sacar",
    icon: "fa fa-money-bill-wave",
    component: Withdraw,
    layout: "/admin"
  },
  {
    path: "/login",
    name: "Login",
    icon: "fa fa-sign-in-alt",
    component: Login,
    layout: "/auth",
    redirect: true
  },
  {
    path: "/aviator",
    name: "Aviator Game",
    icon: "fa fa-plane-departure", // avião em decolagem
    component: AviatorGame,
    layout: "/auth",
    redirect: true
  },
  {
    path: "/register/:role?",
    name: "Register",
    icon: "fa fa-user-plus",
    component: Register,
    layout: "/auth",
    redirect: true
  },
  {
    path: "/aulas",
    sidebarSection: "Ferramentas",
    name: "Aulas",
    icon: "fa fa-chalkboard-teacher",
    component: Aulas,
    layout: "/admin"
  }
];

export default routes;
