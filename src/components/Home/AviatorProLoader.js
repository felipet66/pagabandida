import React from "react";
import { TerminalSquare } from "lucide-react";
import Icon from "../DesignSystem/Icon";

const lines = [
  ["01", "Consultando o histórico..."],
  ["02", "Lendo a amostra de 100 velas..."],
  ["03", "Mapeando os intervalos de 3x e 10x..."],
  ["04", "Preparando os horários estimados..."],
];

export default function AviatorProLoader() {
  return <div className="aviator-pro-loader" role="status" aria-label="Analisando horários">
    <div className="aviator-pro-loader__noise" aria-hidden="true">01001001 01000001 00100000 01010000 01010010 01001111</div>
    <div className="aviator-pro-loader__header" aria-hidden="true"><Icon as={TerminalSquare} size={18} /><span>PAGA BANDIDA I.A. // ANÁLISE</span><span className="aviator-pro-loader__pulse" /></div>
    <span className="sr-only">Consultando o histórico e calculando os próximos horários estimados.</span>
    <div className="aviator-pro-loader__terminal" aria-hidden="true">{lines.map(([step, text], index) => <div key={step} className="aviator-pro-loader__line" style={{ "--loader-delay": `${index * 800}ms` }}><span>{step}</span><span><b>&gt;</b> {text}</span></div>)}</div>
    <div className="aviator-pro-loader__track" aria-hidden="true"><span /></div>
    <div className="aviator-pro-loader__footer" aria-hidden="true"><span>PROCESSANDO A AMOSTRA</span><span className="aviator-pro-loader__cursor">▌</span></div>
  </div>;
}
