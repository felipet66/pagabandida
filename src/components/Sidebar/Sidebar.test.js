import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "./Sidebar";
jest.mock("../../contexts/TournamentsContext", () => ({ useTournaments: () => ({ unsupported: false }) }));

test("menu oculta gamificação e cupons e mantém a navegação da carteira", () => {
  const toggleSidebar = jest.fn();
  document.documentElement.classList.add("nav-open");
  try {
    render(<MemoryRouter><Sidebar routes={[
      { path: "/deposit", layout: "/admin", name: "Depositar", sidebarSection: "Carteira" },
      { path: "/gamificacao", layout: "/admin", name: "Gamificação", sidebarSection: "Comunidade", hideInSidebar: true },
    ]} toggleSidebar={toggleSidebar} /></MemoryRouter>);
    expect(screen.queryByRole("link", { name: "Gamificação" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Meus cupons/i })).toBeNull();
    const link = screen.getByRole("link", { name: "Depositar" });
    expect(link.getAttribute("href")).toBe("/admin/deposit");
    fireEvent.click(link);
    expect(toggleSidebar).toHaveBeenCalledTimes(1);
  } finally { document.documentElement.classList.remove("nav-open"); }
});
