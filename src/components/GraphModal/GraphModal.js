import React, { useEffect, useState } from "react";
import { Modal, ModalHeader, ModalBody, Spinner } from "reactstrap";
import axios from "axios";
import { Enviroments } from "../../enviroments/enviroments";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function GraphModal({ isOpen, toggle, odd, betHouse, date }) {
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("apiToken")}`
          }
        };
        const response = await axios.get(
          `${Enviroments.API_URL_NODE}candles-by-hour?date=${date}&odd=${odd}&betHouse=${betHouse}`,
          headers
        );
        setGraphData(response.data.oddsByHour || []);
      } catch (err) {
        console.error("Não foi possível concluir a operação.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, odd, betHouse, date]);

  const chartConfig = {
    labels: graphData.map(item => item.hour),
    datasets: [
      {
        label: `Ocorrências > ${odd}x`,
        data: graphData.map(item => item.count),
        backgroundColor: "#e30613"
      }
    ]
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      size="lg"
      className="bg-dark text-white"
    >
      <ModalHeader toggle={toggle} className="bg-dark">
        <h3>📊 Gráfico de Ocorrências - {odd}x+</h3>
      </ModalHeader>
      <ModalBody className="bg-dark text-white">
        {loading ? (
          <Spinner color="primary" />
        ) : (
          <Bar
            data={chartConfig}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  labels: {
                    color: "#ffffff" // Cor do texto da legenda
                  }
                },
                tooltip: {
                  enabled: true,
                  backgroundColor: "#333", // Cor de fundo do tooltip
                  titleColor: "#fff",
                  bodyColor: "#fff"
                }
              },
              scales: {
                x: {
                  ticks: {
                    color: "#ffffff"
                  },
                  grid: {
                    color: "rgba(255,255,255,0.1)"
                  }
                },
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: "#ffffff"
                  },
                  grid: {
                    color: "rgba(255,255,255,0.1)"
                  }
                }
              }
            }}
          />
        )}
      </ModalBody>
    </Modal>
  );
}

export default GraphModal;
