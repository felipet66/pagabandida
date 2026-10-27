export const HISTORY_ODD_FILTER_OPTIONS = [
  { value: "", label: "Todas as odds" },
  { value: "blue", label: "Azul · ODD < 2" },
  { value: "purple", label: "Roxo · 2 ≤ ODD < 10" },
  { value: "pink", label: "Rosa · ODD ≥ 10" },
  ...[20, 30, 50, 100].map(value => ({ value, label: `ODD > ${value}` })),
];

export function matchesHistoryOddFilter(odd, filter) {
  const value = Number(odd);
  if (filter == null || filter === "") return true;
  if (filter === "blue") return value < 2;
  if (filter === "purple") return value >= 2 && value < 10;
  if (filter === "pink") return value >= 10;
  return value > Number(filter);
}

export function emptyHistoryOddFilterMessage(filter) {
  const range = {
    blue: "azuis (abaixo de 2x)",
    purple: "roxas (de 2x até abaixo de 10x)",
    pink: "rosas (10x ou mais)",
  }[filter] || `acima de ${filter}x`;
  return `Não há velas ${range} para esta seleção. Remova o filtro ou tente atualizar.`;
}
