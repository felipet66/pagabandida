import React, { useEffect, useState } from "react";
import { ProgressBar, Badge, Alert } from "react-bootstrap";
import axios from "axios";
import { Enviroments } from "../../enviroments/enviroments";

function PredictNext({
  betHouse = "BRAZUKA",
  window = 10,
  date,
  numberVelas
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const headers = {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("apiToken")}`,
            User: `User ${localStorage.getItem("user")}`
          }
        };

        const response = await axios.get(
          `${Enviroments.API_URL_NODE}predict/next?date=${date}&window=30&betHouse=${betHouse}`,
          headers
        );
        setData(response.data);
      } catch (error) {
        console.error("Não foi possível concluir a operação.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
    const interval = setInterval(fetchPrediction, 10000);
    return () => clearInterval(interval);
  }, [betHouse, date, numberVelas]);

  if (loading) return <p>Carregando análise da IA...</p>;
  if (!data || data.error) return <p>Não foi possível carregar os dados.</p>;

  const getVariant = score => {
    if (score >= 0.7) return "success";
    if (score >= 0.4) return "warning";
    return "danger";
  };

  const getBadge = interpretacao => {
    if (interpretacao.includes("Alta"))
      return <Badge bg="success">{interpretacao}</Badge>;
    if (interpretacao.includes("Moderada"))
      return (
        <Badge bg="warning" text="dark">
          {interpretacao}
        </Badge>
      );
    return <Badge bg="danger">{interpretacao}</Badge>;
  };

  const getCustomColor = value => {
    if (value < 2) {
      return "#1d8cf8";
    } else if (value <= 9.99) {
      return "#c1121f";
    } else {
      return "#e30613";
    }
  };

  const interpretaIA = () => {
    const tempoUltimo10x = data.periodo_alto_10x.ultima_ocorrencia;
    const risco =
      data.janela_risco.em_duracao.includes("4") ||
      data.janela_risco.em_duracao.includes("5")
        ? "ALERTA: sequência longa de perdas. Evite entrada."
        : "Momento relativamente seguro para observar uma entrada.";

    return {
      periodo10x: `Foram detectadas ${data.periodo_alto_10x.quantidade} rodadas com multiplicador acima de 10x nos últimos 30 minutos. Última ocorreu às ${tempoUltimo10x}. Tendência: ${data.periodo_alto_10x.tendencia}.`,
      risco
    };
  };

  const explicacoes = interpretaIA();

  return (
    <div className="predict-next p-4 text-white rounded">
      <h3 className="mb-0">🔮 Análise da IA – Próxima Rodada</h3>
      <p className="text-muted small d-flex align-items-center mt-0 p-0 mb-3">
        <span className="mr-1">⏱️ Atualização em tempo real</span>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#28a745",
            animation: "pulse 1s infinite"
          }}
        ></span>
      </p>
      <p>
        <strong>📌 Padrão:</strong> {data.padrão_detectado}
      </p>
      <p>
        <strong>📎 Sugestão:</strong> {data.sugestao}
      </p>

      {data.faixas["10x"].score >= 0.2 && (
        <Alert variant="danger">
          <strong>ALERTA:</strong> Probabilidade elevada de um 10x surgir em
          breve. Fique atento!
        </Alert>
      )}

      <hr />
      <h5>🎯 Probabilidade por Faixa:</h5>
      {Object.entries(data.faixas).map(([faixa, val]) => {
        const totalRodadas = data.ultimas_rodadas_analisadas.length;
        const scorePercent = Math.round(val.score * 100);
        const estimativaAcertos = Math.round(val.score * totalRodadas);

        return (
          <div key={faixa} className="mb-4">
            <strong>{faixa}:</strong> {scorePercent}% ({estimativaAcertos} de{" "}
            {totalRodadas}) – {getBadge(val.interpretação)}
            <ProgressBar
              now={scorePercent}
              label={`${scorePercent}%`}
              variant={getVariant(val.score)}
              className="mt-2"
            />
            <small className="text-muted d-block mt-1">
              Nas últimas {totalRodadas} rodadas, aproximadamente{" "}
              {estimativaAcertos} atingiram {faixa} ou mais.
            </small>
          </div>
        );
      })}

      <hr />
      <h5>🔥 Atividade de 10x+: </h5>
      <p>{explicacoes.periodo10x}</p>

      <hr />
      <h5>⚠️ Janela de Risco:</h5>
      <p>{explicacoes.risco}</p>

      <hr />
      <h5>📈 Últimas Rodadas Analisadas:</h5>
      <p style={{ fontSize: "0.95rem", whiteSpace: "pre-wrap" }}>
        {data.ultimas_rodadas_analisadas.reverse().map((v, i) => (
          <span key={i} style={{ color: getCustomColor(v), fontWeight: 600 }}>
            {v}
            {i < data.ultimas_rodadas_analisadas.length - 1 ? ", " : ""}
          </span>
        ))}
      </p>

      <hr />
      <small className="text-muted">
        <strong>Legenda:</strong> <br />
        Odds de 2x, 3x, 5x e 10x indicam a força do multiplicador. <br /> Janela
        de risco aponta sequência de perdas.
      </small>
    </div>
  );
}

export default PredictNext;
