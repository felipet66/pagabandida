import React from "react";
import "./EmptyState.css";
import { ChartColumn } from "lucide-react";
import Icon from "components/DesignSystem/Icon";

export default function EmptyState({ title = "Nenhum resultado encontrado", description = "Ajuste os filtros para encontrar resultados.", actionLabel, onAction, designSystem = false }) {
  return (
    <div className="app-empty-state" role="status">
      <span className="app-empty-state__icon" aria-hidden="true">{designSystem ? <Icon as={ChartColumn} size={22} /> : <i className="fas fa-chart-bar" />}</span>
      <strong>{title}</strong>
      <p>{description}</p>
      {actionLabel && onAction && <button type="button" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}
