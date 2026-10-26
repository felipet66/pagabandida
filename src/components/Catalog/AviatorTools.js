import React from "react";
import { Link } from "react-router-dom";
import { historyArt, analysisArt } from "assets/responsiveImages";
import ResponsiveImage from "components/ResponsiveImage/ResponsiveImage";
import "./AviatorTools.css";
import { Activity, ArrowRight, Brain, ChartColumn, ChartNoAxesCombined, Plane } from "lucide-react";
import Icon from "components/DesignSystem/Icon";

// Artwork for the two Aviator tools, linked to their respective screens.
export const AVIATOR_TOOLS = [
  {
    id: "history",
    title: "Histórico Completo Aviators",
    description: "Confira os resultados de Original, VIP e Premium.",
    label: "Histórico",
    icon: "fa-chart-column",
    path: "/admin/dashboard",
    image: historyArt,
  },
  {
    id: "analysis",
    title: "Análises com I.A. Aviator",
    description: "Acesse as análises de horários do Aviator PRO.",
    label: "Análises I.A.",
    icon: "fa-brain",
    path: "/admin/horarios",
    image: analysisArt,
  },
];

export default function AviatorTools() {
  return (
    <section className="catalog-section catalog-tools" aria-labelledby="aviator-tools-heading">
      <div className="catalog-section-heading">
        <div><h2 id="aviator-tools-heading"><Icon as={ChartNoAxesCombined} size={22} /> Ferramentas Aviator</h2><p>Histórico e análises para acompanhar os resultados</p></div>
      </div>
      <div className="catalog-tools__grid">
        {AVIATOR_TOOLS.map(tool => <Link key={tool.id} to={tool.path} className="catalog-game catalog-tool">
          <span className={`catalog-tool__art catalog-tool__art--${tool.id}`} aria-hidden="true">
            {tool.image ? <ResponsiveImage image={tool.image} alt="" loading="lazy" sizes="(max-width: 600px) calc((100vw - 48px) / 2), (max-width: 1199px) 292px, 196px" /> : <>
              <span className="catalog-tool__brand">Paga Bandida</span>
              <Icon as={tool.id === "history" ? ChartColumn : Brain} size={26} className="catalog-tool__icon" />
              <span className="catalog-tool__label">{tool.label}</span>
              <Icon as={Plane} size={20} className="catalog-tool__plane" />
            </>}
          </span>
          <span className="catalog-tool__details">
            <strong>{tool.title}</strong>
            <span>{tool.description}</span>
            <span className="catalog-tool__action">Acessar <Icon as={ArrowRight} size={16} /></span>
          </span>
        </Link>)}
      </div>
      <Link to="/admin/analises-tempo-real" className="catalog-tools__realtime">
        <span className="catalog-tools__realtime-icon"><Icon as={Activity} size={22} /></span>
        <span><strong>Análises em Tempo Real <small>RADAR 5X</small><small className="catalog-tools__new">NOVO</small></strong><span>Acompanhe os alertas de 4x a 5x do Aviator.</span></span>
        <Icon as={ArrowRight} size={18} />
      </Link>
    </section>
  );
}
