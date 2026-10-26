import React, { useState, useEffect } from "react";
import axios from "axios";
import { Row, Col } from "reactstrap";
import Swal from "sweetalert2";
import { TailSpin } from 'react-loader-spinner';


const Aviator10 = () => {
  const [updates, setUpdates] = useState([]);
  const [hourValidSignal, setHourValidSignal] = useState();
  const [strategySignal, setStrategySignal] = useState();
  const [resultGreen, setResultGreen] = useState("");
  const [activeSignal, setActiveSignal] = useState(false);
  const [green, setGreen] = useState(false);
  const [red, setRed] = useState(false);

  useEffect(() => {
    const showToast = (type, text) => {
      Swal.fire({
        icon: type,
        title: text,
        toast: true,
        position: "top", // Alterar para 'top' para exibir no topo
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
        didOpen: toast => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        }
      });
    };

    if (activeSignal) {
      showToast("info", `${hourValidSignal}X`);
    }

    if (green) {
      showToast("success", `PAGAAAAAAA ${resultGreen} ✅✅✅✅ `);
    }

    if (red) {
      showToast("error", `Deu Red! Faça gestão da sua banca!`);
    }
  }, [green, red, activeSignal]);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        if (!process.env.REACT_APP_SIGNALS_URL) return;
        const response = await axios.get(
          process.env.REACT_APP_SIGNALS_URL
        );
        setUpdates(response.data.result);

        const message = response.data.result[0].channel_post.text;
        let horaValidade = "";
        let quantidadesTentativas = "Mão Fixa \nProteção de 2X a 3X.";

        if (message.includes("Confirmada Entrada")) {
          const regex = /⏰ (\d{2}:\d{2})/g;
          let horarios = [];
          let match;
          while ((match = regex.exec(message)) !== null) {
            horarios.push(match[1]);
          }
          const horariosString = horarios.join(", ");
          horaValidade = horariosString;

          setHourValidSignal(`Possível vela 10X nos horarios: ${horaValidade}`);
          setStrategySignal(quantidadesTentativas);
          setActiveSignal(true);
          setGreen(false);
          setRed(false);
        }

        if (message.includes("Sinal finalizado!")) {
          setActiveSignal(false);
          setHourValidSignal("Aguarde");
          setStrategySignal("Aguarde");
          setResultGreen("");
        }

        if (message.includes("PAGAAAA")) {
          const regex = /(\d+\.\d+)/;
          const match = regex.exec(message);
          const numero = match ? match[1] : null;
          setResultGreen(numero);
          setGreen(true);
          setRed(false);
        }
      } catch (error) {
        console.error("Não foi possível concluir a operação.");
      }
    };

    fetchUpdates();

    const intervalId = setInterval(fetchUpdates, 2000); // chamada a cada 2 segundos

    return () => {
      clearInterval(intervalId); // limpar o intervalo quando o componente for desmontado
    };
  }, []);

  return (
    <div className="content">
      {activeSignal ? (
        <Row>
          <Col xs="12">
            <h5
              className="ms-3"
              style={{ border: "2px solid #e30613", borderRadius: 8, padding: 8 }}
            >
              Horarios: <strong>{hourValidSignal}</strong>
            </h5>
          </Col>

          <Col xs="6">
            <h5 style={{ border: "2px solid #e30613", borderRadius: 8, padding: 8 }}>
              Estratégia: <strong>{strategySignal}</strong>
            </h5>
          </Col>
          <Col xs="6" className={resultGreen !== "" ? "" : "d-none"}>
            <h5 style={{ border: "2px solid #e30613", borderRadius: 8, padding: 8 }}>
              TA PAGO: <strong>{resultGreen}X ✅✅</strong>
            </h5>
          </Col>
        </Row>
      ) : (
        <Row>
          <Col xs={12} className="d-flex flex-column justify-content-center align-items-center">
            <p className="category">Buscando oportunidade...</p>

            <TailSpin
              visible={true}
              height="25"
              width="25"
              color="#4fa94d"
              ariaLabel="tail-spin-loading"
              radius="1"
              wrapperStyle={{}}
              wrapperClass=""
            />
          </Col>
        </Row>
      )}

    </div>
  );
};

export default Aviator10;
