import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardBody,
  Row,
  Col,
  Spinner,
  UncontrolledTooltip,
  Button
} from "reactstrap";
import { Enviroments } from "../../enviroments/enviroments";
import GraphModal from "../GraphModal/GraphModal"; // ajuste o caminho conforme sua estrutura

const classColors = {
  PÉSSIMA: "dark",
  RUIM: "dark",
  REGULAR: "dark",
  MODERADA: "dark",
  BOA: "dark",
  MÉDIA: "dark",
  ÓTIMA: "dark",
  EXCELENTE: "dark",
  RECOVERY: "dark",
  EXTREMA: "dark"
};

function MaximosMultiplicadores({ betHouse = "BRAZUKA", date }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [top3Intervalos, setTop3Intervalos] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOdd, setSelectedOdd] = useState(null);

  const openGraph = odd => {
    setSelectedOdd(parseFloat(odd));
    setModalOpen(true);
  };

  useEffect(() => {
    const fetchMaximos = async () => {
      try {
        const headers = {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("apiToken")}`
          }
        };

        const response = await axios.get(
          `${Enviroments.API_URL_NODE}maximos-dia?date=${date}&betHouse=${betHouse}`,
          headers
        );

        const maximos = response.data.maximos;
        setData(maximos);

        // Calcula os top 3 maiores intervalos
        const ordenado = Object.entries(maximos)
          .sort((a, b) => b[1].maior_intervalo - a[1].maior_intervalo)
          .slice(0, 3)
          .map(([key]) => key);
        setTop3Intervalos(ordenado);
      } catch (err) {
        console.error("Não foi possível concluir a operação.");
      } finally {
        setLoading(false);
      }
    };

    fetchMaximos();
  }, [betHouse, date]);

  if (loading) return <Spinner color="light" />;

  return (
    <div className="p-4 text-white">
      <h4>📊 Distâncias Máximas por Multiplicador</h4>
      <Row>
        {Object.entries(data).map(([key, val], index) => {
          const tooltipPrefix = `tooltip-${index}`;
          const isTop3 = top3Intervalos.includes(key);
          const cor = classColors[val.classificacao] || "secondary";

          return (
            <Col md="4" sm="6" xs="12" key={key} className="mb-3">
              <Card color={cor} inverse>
                <CardBody>
                  <h3 className="mb-2" id={`${tooltipPrefix}-title`}>
                    🎯 {key} {isTop3 && <span>⚠️</span>}
                  </h3>
                  {isTop3 && (
                    <UncontrolledTooltip target={`${tooltipPrefix}-title`}>
                      Este multiplicador tem um dos 3 maiores intervalos do dia.
                    </UncontrolledTooltip>
                  )}

                  <p id={`${tooltipPrefix}-classificacao`}>
                    <strong>Classificação:</strong> {val.classificacao}
                  </p>
                  <UncontrolledTooltip
                    target={`${tooltipPrefix}-classificacao`}
                  >
                    Nível de confiabilidade desse multiplicador no dia.
                  </UncontrolledTooltip>

                  <p id={`${tooltipPrefix}-acertos`}>
                    <strong>Acertos:</strong> {val.acertos}
                  </p>
                  <UncontrolledTooltip target={`${tooltipPrefix}-acertos`}>
                    Quantas vezes esse multiplicador apareceu hoje.
                  </UncontrolledTooltip>

                  <p id={`${tooltipPrefix}-intervalo`}>
                    <strong>Maior Intervalo:</strong> {val.maior_intervalo}{" "}
                    rodadas
                  </p>
                  <UncontrolledTooltip target={`${tooltipPrefix}-intervalo`}>
                    Distância máxima (em rodadas) entre acertos.
                  </UncontrolledTooltip>

                  <p id={`${tooltipPrefix}-tempo`}>
                    <strong>Maior Tempo:</strong> {val.tempo_maximo}
                  </p>
                  <UncontrolledTooltip target={`${tooltipPrefix}-tempo`}>
                    Tempo máximo sem aparecer esse multiplicador.
                  </UncontrolledTooltip>

                  <div className="d-flex justify-content-between mt-3">
                    <Button
                      color="light"
                      size="sm"
                      outline
                      onClick={() => openGraph(key)}
                    >
                      Ver gráfico
                    </Button>

                    {isTop3 && (
                      <span className="text-warning">
                        ⏳ Pode estar próximo!
                      </span>
                    )}
                  </div>
                </CardBody>
              </Card>
            </Col>
          );
        })}
      </Row>
      <GraphModal
        isOpen={modalOpen}
        toggle={() => setModalOpen(false)}
        odd={selectedOdd}
        betHouse={betHouse}
        date={date}
      />
    </div>
  );
}

export default MaximosMultiplicadores;
