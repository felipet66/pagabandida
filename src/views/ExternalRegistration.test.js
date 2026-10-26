import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ExternalRegistration from "./ExternalRegistration";

test("cadastro usa o link fornecido em outra aba e mantém retorno ao login", () => {
  render(<MemoryRouter><ExternalRegistration /></MemoryRouter>);
  const link = screen.getByRole("link", { name: "Criar conta na ganhebetBR" });
  expect(link.getAttribute("href")).toBe("https://go.ganhebetbr.com/c/7ul");
  expect(link.getAttribute("target")).toBe("_blank");
  expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  expect(screen.getByRole("link", { name: "Entrar no Paga Bandida" }).getAttribute("href")).toBe("/auth/login");
  expect(screen.queryByLabelText("CPF")).toBeNull();
  expect(screen.getByText("O cadastro será aberto em outra aba.")).toBeTruthy();
});
