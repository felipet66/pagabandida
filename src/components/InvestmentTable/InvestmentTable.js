import React, { useMemo, useState } from "react";
import { Button } from "reactstrap";
import Swal from "sweetalert2";
import "./InvestmentTable.css";
import { Calculator, ChartColumn, List, ShieldAlert, Target, TrendingUp, Wallet } from "lucide-react";
import Icon from "components/DesignSystem/Icon";
import { trackGamification } from "../../services/gamificationApi";

const strategies = {
  conservador: {
    label: "Conservador",
    entryRate: 0.01,
    goalRate: 0.05,
    stopMultiplier: 2,
    description: "Meta menor, mais controle por sessão"
  },
  moderado: {
    label: "Moderado",
    entryRate: 0.02,
    goalRate: 0.1,
    stopMultiplier: 2,
    description: "Equilíbrio entre crescimento e risco"
  },
  agressivo: {
    label: "Agressivo",
    entryRate: 0.03,
    goalRate: 0.15,
    stopMultiplier: 2,
    description: "Meta maior, exige mais disciplina"
  }
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const InvestmentTable = () => {
  const [banca, setBanca] = useState(1000);
  const [data, setData] = useState([]);
  const [strategy, setStrategy] = useState("conservador");
  const configured = React.useRef(false);

  const selectedStrategy = strategies[strategy];
  const entrySuggestion = useMemo(() => {
    const balance = parseFloat(banca);
    const validBalance = Number.isFinite(balance) && balance > 0 ? balance : 0;
    const totalEntry = validBalance * selectedStrategy.entryRate;

    return {
      totalEntry,
      firstEntry: totalEntry * 0.8,
      secondEntry: totalEntry * 0.2
    };
  }, [banca, selectedStrategy.entryRate]);

  const summary = useMemo(() => {
    if (!data.length) return null;

    const firstDay = data[0];
    const lastDay = data[data.length - 1];
    const startBalance = Number(firstDay.saldoAtual);
    const finalBalance = Number(lastDay.saldoFinal);
    const growth = startBalance > 0 ? ((finalBalance / startBalance - 1) * 100).toFixed(1) : "0.0";

    return {
      firstGoal: firstDay.meta,
      firstStop: firstDay.stopLoss,
      finalBalance: lastDay.saldoFinal,
      growth
    };
  }, [data]);

  const handleCalcular = () => {
    const initialBalance = parseFloat(banca);

    if (!initialBalance || initialBalance <= 0) {
      Swal.fire({
        title: "Informe uma banca válida",
        text: "Use um valor maior que zero para gerar o plano.",
        icon: "warning",
        confirmButtonText: "Ok",
        customClass: {
          popup: "bankroll-popup"
        }
      });
      return;
    }

    const newData = [];
    let saldoAtual = initialBalance;
    const startDate = new Date();

    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const meta = saldoAtual * selectedStrategy.goalRate;
      const stopLoss = meta * selectedStrategy.stopMultiplier;
      const saldoFinal = saldoAtual + meta;

      newData.push({
        date: currentDate.toLocaleDateString(),
        saldoAtual: saldoAtual.toFixed(2),
        meta: meta.toFixed(2),
        stopLoss: stopLoss.toFixed(2),
        saldoFinal: saldoFinal.toFixed(2)
      });

      saldoAtual = saldoFinal;
    }

    setData(newData);
    if (!configured.current) {
      configured.current = true;
      trackGamification("bankroll_configured");
    }
  };

  const handleDetalhes = () => {
    Swal.fire({
      title: "Detalhes da Gestão",
      html: `
        <div class="bankroll-details-scroll" role="region" aria-label="Plano diário de gestão" tabindex="0">
        <table class="table bankroll-details-table text-left">
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">Saldo inicial</th>
              <th scope="col">Meta</th>
              <th scope="col">Stop loss</th>
              <th scope="col">Saldo final</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                row => `
              <tr>
                <td>${row.date}</td>
                <td>${currency.format(Number(row.saldoAtual))}</td>
                <td>${currency.format(Number(row.meta))}</td>
                <td>${currency.format(Number(row.stopLoss))}</td>
                <td>${currency.format(Number(row.saldoFinal))}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        </div>
      `,
      showCancelButton: false,
      confirmButtonText: "Fechar",
      customClass: {
        popup: "bankroll-popup bankroll-popup--details",
        htmlContainer: "bankroll-popup__content"
      }
    });
  };

  return (
    <div className="bankroll-manager">
      <div className="bankroll-manager__header">
        <div>
          <span className="bankroll-manager__eyebrow">Gestão de banca</span>
          <h1>Plano de 30 dias</h1>
          <p>Defina sua banca, escolha o perfil e acompanhe meta, stop e saldo projetado.</p>
        </div>
        <div className="bankroll-manager__rate">
          <span>Meta diária</span>
          <strong>{(selectedStrategy.goalRate * 100).toFixed(0)}%</strong>
        </div>
      </div>

      <div className="bankroll-manager__controls">
        <div className="bankroll-field">
          <label htmlFor="bankroll-value">Valor da banca</label>
          <div className="bankroll-field__input">
            <span>R$</span>
            <input
              id="bankroll-value"
              type="number"
              className="form-control"
              min="1"
              step="50"
              placeholder="1000"
              value={banca}
              onChange={e => setBanca(e.target.value)}
            />
          </div>
        </div>

        <div className="bankroll-profile">
          <span className="bankroll-profile__label">Perfil de gestão</span>
          <div className="bankroll-strategies" role="group" aria-label="Perfil de gestão">
          {Object.entries(strategies).map(([key, option]) => (
            <button
              key={key}
              type="button"
              className={`bankroll-strategy ${strategy === key ? "is-active" : ""}`}
              onClick={() => setStrategy(key)}
              aria-pressed={strategy === key}
            >
              <span>{option.label}</span>
              <strong>{(option.entryRate * 100).toFixed(0)}%</strong>

            </button>
          ))}
          </div>
          <p className="bankroll-profile__description">{selectedStrategy.description}. Entrada de {(selectedStrategy.entryRate * 100).toFixed(0)}% da banca.</p>
        </div>

        <div className="bankroll-actions">
          <Button color="primary" className="btn-fill" onClick={handleCalcular}>
            <Icon as={Calculator} size={20} />
            Calcular plano
          </Button>
          {data.length > 0 && (
            <Button color="secondary" onClick={handleDetalhes}>
              <Icon as={List} size={20} />
              Ver detalhes
            </Button>
          )}
        </div>
      </div>

      <div className="bankroll-entry-suggestion" aria-label="Sugestão de entradas">
        <div className="bankroll-entry-suggestion__heading">
          <span>Sugestão de entradas</span>
          <strong>
            {selectedStrategy.label} - {(selectedStrategy.entryRate * 100).toFixed(0)}% da banca
          </strong>
          <small>Total exposto: {currency.format(entrySuggestion.totalEntry)}</small>
        </div>

        <div className="bankroll-entry-grid">
          {[
            { label: "Entrada principal", share: "80% da entrada", amount: entrySuggestion.firstEntry },
            { label: "Entrada complementar", share: "20% da entrada", amount: entrySuggestion.secondEntry }
          ].map(entry => (
            <div className="bankroll-entry" key={entry.label}>
              <div>
                <span>{entry.label}</span>
                <small>{entry.share}</small>
              </div>
              <strong>{currency.format(entry.amount)}</strong>
            </div>
          ))}
        </div>
      </div>

      {summary ? (
        <>
          <div className="bankroll-summary">
            <div>
              <Icon as={Target} size={20} />
              <span>Meta do 1º dia</span>
              <strong>{currency.format(Number(summary.firstGoal))}</strong>
            </div>
            <div>
              <Icon as={ShieldAlert} size={20} />
              <span>Stop do 1º dia</span>
              <strong>{currency.format(Number(summary.firstStop))}</strong>
            </div>
            <div>
              <Icon as={Wallet} size={20} />
              <span>Saldo projetado</span>
              <strong>{currency.format(Number(summary.finalBalance))}</strong>
            </div>
            <div>
              <Icon as={TrendingUp} size={20} />
              <span>Crescimento</span>
              <strong>{summary.growth}%</strong>
            </div>
          </div>

          <p className="bankroll-projection-note">Simulação considerando a meta atingida todos os dias. Os valores são projeções, sem garantia de resultado.</p>
          <div className="bankroll-table-wrap" role="region" aria-label="Plano diário de gestão" tabIndex={0}>
            <table className="table bankroll-table">
              <thead>
                <tr>
                  <th scope="col">Dia</th>
                  <th scope="col">Saldo inicial</th>
                  <th scope="col">Meta</th>
                  <th scope="col">Stop loss</th>
                  <th scope="col">Saldo final</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={row.date}>
                    <td>
                      <span className="bankroll-day">{String(index + 1).padStart(2, "0")}</span>
                      {row.date}
                    </td>
                    <td>{currency.format(Number(row.saldoAtual))}</td>
                    <td className="text-success">{currency.format(Number(row.meta))}</td>
                    <td className="text-warning">{currency.format(Number(row.stopLoss))}</td>
                    <td>{currency.format(Number(row.saldoFinal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bankroll-empty">
          <Icon as={ChartColumn} size={26} />
          <div>
            <strong>Pronto para calcular</strong>
            <span>O plano aparece aqui com metas diárias e saldo projetado.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentTable;
