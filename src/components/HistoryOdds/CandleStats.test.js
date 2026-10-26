import React from "react";
import { render, screen, within } from "@testing-library/react";
import CandleStats from "./CandleStats";

const records = [1, 1.5, 2, 5, 10, 30].map(odd => ({ odd }));

test("mostra resumos, distribuição, frequências e distância desde a última ocorrência", () => {
  render(<CandleStats records={records} />);
  expect(screen.getByText("Menor resultado").nextSibling.textContent).toBe("1.00x");
  expect(screen.getByText("Maior resultado").nextSibling.textContent).toBe("30.00x");
  const distribution = screen.getByRole("region", { name: "Distribuição dos resultados", hidden: true });
  expect(distribution.textContent).toContain("2 de 6 (33,3%)");
  const row = screen.getByRole("rowheader", { name: "10x", hidden: true }).closest("tr");
  expect(within(row).getAllByRole("cell", { hidden: true }).map(cell => cell.textContent)).toEqual(["2", "33,3%", "Há 4 rodadas"]);
  expect(screen.getByRole("region", { name: "Sequências na amostra", hidden: true }).textContent).toContain("Sequência atual: 2 velas");
  expect(screen.getByText(/não preveem as próximas rodadas/)).toBeTruthy();
});

test("filtro recalcula o denominador e não apresenta sequências ou distância entre rodadas", () => {
  const { rerender } = render(<CandleStats records={records} />);
  rerender(<CandleStats records={[{ odd: 30 }, { odd: 20 }]} filtered />);
  expect(screen.getByText(/Os percentuais representam apenas esta seleção/)).toBeTruthy();
  expect(screen.queryByText("Última ocorrência")).toBeNull();
  expect(screen.queryByRole("region", { name: "Sequências na amostra", hidden: true })).toBeNull();
  const row = screen.getByRole("rowheader", { name: "10x", hidden: true }).closest("tr");
  expect(within(row).getAllByRole("cell", { hidden: true }).map(cell => cell.textContent)).toEqual(["2", "100%"]);
});

test("não apresenta estatísticas com amostra vazia", () => {
  const { container } = render(<CandleStats records={[]} />);
  expect(container.innerHTML).toBe("");
});
