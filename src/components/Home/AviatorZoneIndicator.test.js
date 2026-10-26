import React from "react";
import { render, screen, within } from "@testing-library/react";
import AviatorZoneIndicator from "./AviatorZoneIndicator";

const history = (count, hits = []) => Array.from({ length: count }, (_, index) => ({
  roundId: String(500 - index), odd: hits.includes(index) ? "15" : "2",
  dataTime: new Date(Date.UTC(2026, 9, 15, 22) - index * 20000).toISOString(),
}));

test("mostra classificações independentes, concentração e distância em rodadas", () => {
  render(<AviatorZoneIndicator records={history(100, [2, 3, 4, 5])} version="Original" />);
  const recent = screen.getByRole("region", { name: "Concentração nas últimas 20 rodadas" });
  const broader = screen.getByRole("region", { name: "Concentração nas últimas 50 rodadas" });
  expect(within(recent).getByText("Zona quente")).toBeTruthy();
  expect(within(recent).getByText("20%")).toBeTruthy();
  expect(within(broader).getByText("Intermediária")).toBeTruthy();
  expect(within(broader).getByText("8%")).toBeTruthy();
  expect(screen.getByRole("region", { name: "Distância desde a última ocorrência acima de 10x" }).textContent).toContain("2 rodadas");
  expect(screen.getByText(/Concentração recente · Original/)).toBeTruthy();
});

test("ausência observada é um limite inferior, não uma distância exata inventada", () => {
  render(<AviatorZoneIndicator records={history(50)} />);
  expect(screen.getByText("Pelo menos 50 rodadas")).toBeTruthy();
  expect(screen.getAllByText("Zona fria")).toHaveLength(2);
});

test("lacuna invalida a janela incompleta e não usa uma ocorrência anterior à lacuna", () => {
  const records = history(60, [40]);
  records[30].roundId = "300";
  render(<AviatorZoneIndicator records={records} />);
  expect(screen.getByText("Janela incompleta")).toBeTruthy();
  expect(screen.getByText("Pelo menos 30 rodadas")).toBeTruthy();
  expect(screen.getByText(/Há uma lacuna/)).toBeTruthy();
});

test("carregamento e falha não exibem zonas nem números antigos", () => {
  const { rerender } = render(<AviatorZoneIndicator records={history(50)} loading />);
  expect(screen.getByRole("status").textContent).toContain("Carregando");
  expect(screen.queryByText("Zona fria")).toBeNull();
  rerender(<AviatorZoneIndicator records={history(50)} error="Network" />);
  expect(screen.getByRole("status").textContent).toContain("indisponível");
  expect(screen.queryByText("Zona fria")).toBeNull();
});
