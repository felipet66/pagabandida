import React from "react";
import { Redirect, useLocation } from "react-router-dom";
import { hasPendingGame } from "services/pendingGame";

export default function PendingGameRedirect({ children }) {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, "");
  const authenticated = Boolean(localStorage.getItem("access_token"));
  if (pathname === "/admin/jogos" && !authenticated) {
    return <Redirect to="/jogos" />;
  }
  if (authenticated && (pathname === "/jogos" ||
    ((pathname === "/admin" || pathname.startsWith("/admin/")) && pathname !== "/admin/jogos" && hasPendingGame()))) {
    return <Redirect to="/admin/jogos" />;
  }
  return children;
}
