import React, { useState } from "react";
import EmptyState from "components/EmptyState/EmptyState";
import CandleStats from "./CandleStats";
import SelectField from "components/SelectField/SelectField";
import { Check, CircleDot, RefreshCw, ScanLine } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import Switch from "components/DesignSystem/Switch";
import { HISTORY_ODD_FILTER_OPTIONS, emptyHistoryOddFilterMessage } from "helpers/historyOddFilter";

export default function HistoryOdds({ records = [], loading, error, onRefresh, numberVelas, onQuantityChange, candleGreaterThan, onOddFilterChange,
  autoRefresh = false, onAutoRefreshChange, refreshing, refreshError, lastUpdated, retryDelay = 30000, autoRefreshPaused }) {
  const [historyOddActive, setHistoryOddActive] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState("");
  const [showRounds, setShowRounds] = useState(false);
  const filtered = candleGreaterThan != null;
  const handleSetOddHistory = odd => setHistoryOddActive(previous => previous.includes(odd) ? previous.filter(value => value !== odd) : [...previous, odd]);
  const specialQuotes = new Set([
    "1.00", "2.00", "3.00", "9.99", "1.04", "1.66", "1.01", "1.11",
    "1.02", "1.03", "99.00", "1.37", "3.04", "1.99", "1.88"
  ]);

  const detectPatternIndices = (history, pattern) => {
    const indices = new Set();
    if (!history?.length) return [];

    for (let i = 0; i < history.length; i++) {
      const curr = parseFloat(history[i].odd);

      switch (pattern) {
        case "espelhamento":
          if (curr >= 10 && i > 0 && parseFloat(history[i - 1].odd) >= 10) {
            indices.add(i - 1);
            indices.add(i);
          }
          break;

        case "alternancia":
          if (
            curr >= 10 &&
            i >= 2 &&
            parseFloat(history[i - 2].odd) >= 10 &&
            parseFloat(history[i - 1].odd) < 10
          ) {
            indices.add(i - 2);
            indices.add(i - 1);
            indices.add(i);
          }
          break;

        case "4a6aposrosa":
          if (curr >= 10) {
            for (let j = i - 6; j <= i - 4; j++) {
              if (j >= 0 && parseFloat(history[j].odd) >= 10) {
                for (let k = j; k <= i; k++) indices.add(k);
              }
            }
          }
          break;

        case "sequenciabaixos":
          for (let i = 0; i < history.length - 5; i++) {
            const proxCinco = history.slice(i + 1, i + 6);
            const atualOdd = parseFloat(history[i].odd);

            if (proxCinco.every(item => parseFloat(item.odd) < 2) && atualOdd >= 10) {
              for (let j = i; j <= i + 5; j++) indices.add(j);
            }
          }
          break;

        case "cotacoes":
          for (let i = 3; i < history.length; i++) {
            const atual = history[i];
            if (specialQuotes.has(Number(atual.odd).toFixed(2))) {
              for (let offset = 1; offset <= 3; offset++) {
                const idx = i - offset;
                if (idx >= 0 && parseFloat(history[idx].odd) >= 10) {
                  for (let j = idx; j <= i; j++) indices.add(j);
                }
              }
            }
          }
          break;

        default:
          break;
      }
    }

    return Array.from(indices);
  };

  const patternHighlightIndices = new Set(filtered ? [] : detectPatternIndices(records, selectedPattern));
  return (
    <section className="aviator-history-panel glass edge" aria-labelledby="aviator-history-title">
      <header className="aviator-panel-heading">
        <div><h2 id="aviator-history-title">Histórico de velas</h2><p>Recentes primeiro · Brasília</p></div>
        <div className="aviator-history-actions">
          <button type="button" className="aviator-secondary-action aviator-auto-refresh" aria-pressed={autoRefresh}
            onClick={() => onAutoRefreshChange?.(!autoRefresh)}>
            <Icon as={RefreshCw} size={18} />{autoRefresh ? "Desativar atualização automática" : "Ativar atualização automática"}
          </button>
          <button type="button" className="aviator-secondary-action" onClick={onRefresh} disabled={loading || refreshing}>
            <Icon as={RefreshCw} size={20} />{loading || refreshing ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </header>
      <div className="aviator-history-sync" role="status">
        <span>{autoRefresh ? autoRefreshPaused ? "Atualização automática pausada enquanto a aba está oculta." : `Atualização automática ativa · a cada ${retryDelay / 1000}s${retryDelay > 30000 ? " temporariamente, após falha" : ""}.` : "Atualização automática desativada · intervalo de 30s."}</span>
        {lastUpdated && <span>Última consulta: <time dateTime={lastUpdated.toISOString()}>{lastUpdated.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hourCycle: "h23" })}</time> · Brasília</span>}
        {refreshError && <span className="aviator-history-sync__error">{refreshError}</span>}
      </div>
      <div className="aviator-history-controls">
        <label htmlFor="history-candle-quantity">Qde de velas
          <SelectField designSystem id="history-candle-quantity" label="Qde de velas" value={numberVelas} onChange={onQuantityChange}
            options={[10, 50, 100, 200, 500, 1000].map(value => ({ value, label: String(value) }))} />
        </label>
        <label htmlFor="history-odd-filter">Filtrar odds
          <SelectField designSystem id="history-odd-filter" label="Filtrar odds" value={candleGreaterThan ?? ""}
            onChange={value => onOddFilterChange(value === "" ? undefined : value)} options={HISTORY_ODD_FILTER_OPTIONS} />
        </label>
        <label htmlFor="history-pattern">Padrão visual
          <SelectField designSystem id="history-pattern" label="Padrão visual" value={selectedPattern} disabled={filtered} onChange={setSelectedPattern}
            describedBy={filtered ? "history-pattern-note" : undefined} options={[
              { value: "", label: "Nenhum" }, { value: "espelhamento", label: "Espelhamento de rosas" },
              { value: "alternancia", label: "Alternância de rosas" }, { value: "4a6aposrosa", label: "4ª a 6ª após rosa" },
              { value: "sequenciabaixos", label: "Sequência de baixos" }, { value: "cotacoes", label: "Cotações especiais" },
            ]} />
        </label>
        <Switch className="aviator-rounds-toggle" label="Exibir rodadas" checked={showRounds} onChange={setShowRounds} aria-controls="aviator-candle-grid" />
      </div>
      <p className="aviator-history-note">Histórico limitado às últimas {Math.max(100, Number(numberVelas) || 100)} rodadas da versão selecionada.</p>
      {filtered && <p className="aviator-history-note" id="history-pattern-note">Para destacar padrões entre rodadas, selecione “Todas as odds”.</p>}
      {!filtered && selectedPattern && records.length < 100 && <p className="aviator-history-note">Aumente a quantidade para 100 velas ou mais para visualizar uma sequência maior.</p>}
      <div className="aviator-history-results" aria-busy={loading}>
        {loading ? <div className="aviator-loading-state" role="status"><span className="aviator-loading-spinner" aria-hidden="true" /> Carregando resultados...</div> : error ?
          <EmptyState designSystem title="Histórico indisponível" description={error} actionLabel="Tentar novamente" onAction={onRefresh} /> : records.length === 0 ?
          <EmptyState designSystem title="Nenhuma vela encontrada" description={filtered ? emptyHistoryOddFilterMessage(candleGreaterThan) : "Ainda não há resultados para este Aviator. Tente atualizar o histórico."}
            actionLabel={filtered ? "Limpar filtro de odd" : "Atualizar histórico"} onAction={filtered ? () => onOddFilterChange(undefined) : onRefresh} /> : <>
          <div className="aviator-candle-grid" id="aviator-candle-grid">
            {records.map((record, index) => {
              const odd = Number(record.odd);
              const oddText = odd.toFixed(2);
              const active = historyOddActive.includes(record.odd);
              const pattern = patternHighlightIndices.has(index);
              const roundId = record.roundId ?? record.id;
              const roundLabel = roundId == null || String(roundId).trim() === "" ? "—" : String(roundId);
              return <div className="aviator-candle-item" key={record.id || index}><button type="button" onClick={() => handleSetOddHistory(record.odd)} aria-pressed={active}
                style={{ "--candle-odd-scale": Math.min(1, 5.5 / (oddText.length + 1)) }}
                aria-label={`${odd.toFixed(2)}x às ${record.hour}${showRounds ? `, rodada ${roundLabel === "—" ? "indisponível" : roundLabel}` : ""}${pattern ? ", padrão destacado" : ""}`}
                className={`aviator-candle aviator-candle--${odd < 2 ? "low" : odd < 10 ? "medium" : "high"}${active ? " is-selected" : ""}${pattern ? " is-pattern" : ""}`}>
                {(active || pattern) && <span className="aviator-candle-marker">{active && <Icon as={Check} size={10} />}{pattern && <Icon as={ScanLine} size={10} />}</span>}
                <strong>{oddText}<span>x</span></strong>
                {showRounds && <span className="aviator-candle-round" title={`Rodada ${roundLabel}`}>{roundLabel}</span>}
              </button>
                <time dateTime={record.dataTime} title={record.formattedDate}>{record.hour}</time>
              </div>;
            })}
          </div>
          <div className="aviator-history-legend"><span className="low"><Icon as={CircleDot} size={16} /> Abaixo de 2x</span><span className="medium"><Icon as={CircleDot} size={16} /> 2x a 9,99x</span><span className="high"><Icon as={CircleDot} size={16} /> 10x ou mais</span><span>{records.length} velas</span></div>
        </>}
      </div>
      {!loading && !error && records.length > 0 && <CandleStats records={records} filtered={filtered} />}
    </section>
  );
}
