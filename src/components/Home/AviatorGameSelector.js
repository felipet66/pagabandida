import React from "react";
import { Hourglass, Plane, PlaneTakeoff } from "lucide-react";
import Icon from "components/DesignSystem/Icon";

export const AVIATOR_VERSIONS = [
  { id: "aviator", name: "Original", title: "Aviator Original", chartNumber: 1, slug: "spribe/aviator", icon: "fa-plane" },
  { id: "aviator2", name: "VIP", title: "Aviator VIP", chartNumber: 2, slug: "spribe/aviator-vip", icon: "fa-plane-departure" },
  { id: "aviator-premium", name: "Premium", title: "Aviator Premium", chartNumber: 3, slug: "spribe/aviator-premium" },
];

export default function AviatorGameSelector({ selected, onSelect }) {
  return (
    <div className="aviator-version-selector" role="group" aria-label="Versão do Aviator">
      {AVIATOR_VERSIONS.map(game => <button key={game.id} type="button" aria-pressed={selected === game.id}
        className={selected === game.id ? "is-active" : ""} disabled={game.comingSoon}
        title={game.comingSoon ? "Histórico do Aviator Premium em breve" : undefined}
        onClick={() => { if (!game.comingSoon) onSelect(game); }}>
        <span className="aviator-version-label">{!game.comingSoon && <Icon as={game.id === "aviator" ? Plane : PlaneTakeoff} size={20} />}{game.name}</span>
        {game.comingSoon && <span className="aviator-version-coming-soon"><Icon as={Hourglass} size={14} /> Em breve</span>}
      </button>)}
    </div>
  );
}
