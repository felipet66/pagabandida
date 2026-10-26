import React, { useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import "./RecentWins.css";

const NAMES = ["Felipe", "Ana", "Lucas", "Camila", "João", "Mariana", "Pedro", "Julia", "Rafael", "Bruna", "Gabriel", "Larissa", "Diego", "Beatriz", "Thiago", "Carolina", "André", "Renata", "Vinícius", "Paula"];
const AVIATORS = ["Aviator", "Aviator VIP", "Aviator Premium"];
const OTHER_GAMES = ["Fortune Tiger", "Fortune Ox", "Fortune Rabbit"];
const REFRESH_MS = 8000;
const pick = values => values[Math.floor(Math.random() * values.length)];
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const maskName = name => `${name.trim().slice(0, 2)}****`;

function createMockWin() {
  const games = Math.random() < 0.75 ? AVIATORS : OTHER_GAMES;
  return { name: pick(NAMES), game: pick(games), amount: (200 + Math.floor(Math.random() * 149801)) / 100 };
}

// Pass API data as wins=[{ id, name, game, amount }]. An empty API list stays
// empty; synthetic activity is used only when the wins prop is omitted.
export default function RecentWins({ wins }) {
  const simulated = wins === undefined;
  const available = useMemo(() => Array.isArray(wins) ? wins.filter(win =>
    typeof win?.name === "string" && win.name.trim() && typeof win.game === "string" && win.game.trim()
    && typeof win.amount === "number" && Number.isFinite(win.amount) && win.amount > 0) : [], [wins]);
  const [mockWin, setMockWin] = useState(createMockWin);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!simulated && available.length < 2) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      if (simulated) setMockWin(createMockWin());
      setIndex(value => value + 1);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [simulated, available.length]);

  const win = simulated ? mockWin : available[index % available.length];
  if (!win) return null;
  const name = maskName(win.name);
  const amount = currency.format(win.amount);
  const message = `${name} ganhou ${amount} no ${win.game}`;

  return (
    <div className="recent-wins" aria-label={simulated ? "Prévia de ganhos simulados" : "Ganhos recentes"} aria-live="off" title={simulated ? `Simulação com dados fictícios: ${message}` : message}>
      <span className="recent-wins__icon" aria-hidden="true"><Icon as={Trophy} size={14} /></span>
      <div className="recent-wins__message" key={`${win.id || "win"}:${index}`}>
        <span className="recent-wins__name">{name}</span><span>ganhou</span><strong>{amount}</strong><span>no</span><span className="recent-wins__game">{win.game}</span>
      </div>
    </div>
  );
}
