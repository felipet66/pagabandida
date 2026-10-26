import React, { useState, useEffect } from "react";
import axios from "axios";
import { Row, Col } from "reactstrap";
import Swal from "sweetalert2";
import { TailSpin } from 'react-loader-spinner';


const Aviator1 = () => {
  const [updates, setUpdates] = useState([]);
  const [hourValidSignal, setHourValidSignal] = useState();
  const [strategySignal, setStrategySignal] = useState();
  const [resultGreen, setResultGreen] = useState();
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
        let quantidadesTentativas = "2 gales";

        if (message.includes("Entrada Confirmada")) {
          const partesMensagem = message.split("\n");
          for (const parte of partesMensagem) {
            if (parte.includes("Entrar após:")) {
              horaValidade = parte;
            }
          }

          setHourValidSignal(`${horaValidade} Busque de 1.50X a 2.00X`);
          setStrategySignal(quantidadesTentativas);
          setActiveSignal(true);
          setGreen(false);
          setRed(false);
        } else {
          setActiveSignal(false);
          setHourValidSignal("Aguarde");
          setStrategySignal("Aguarde");
        }

        if (message.includes("Red!")) {
          setRed(true);
          setGreen(false);
        }

        if (message.includes("GREEN")) {
          const value = message.split("(")[1].split(")")[0];
          setResultGreen(value);
          setGreen(true);
          setRed(false);
        }

        if (message.includes("Estamos")) {
          setHourValidSignal("Estamos no Gale!");
          setStrategySignal("Dobre ou triplique a entrada!");
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
      <Row>
      { hourValidSignal === "Aguarde" ? (
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
      ) : (
        <>
          <Col xs="6">
            <h5
              className="ms-3"
              style={{ border: "2px solid #e30613", borderRadius: 8, padding: 8 }}
            >
              Sinal: <strong>{hourValidSignal}</strong>
            </h5>
          </Col>

          <Col xs="6">
            <h5 style={{ border: "2px solid #e30613", borderRadius: 8, padding: 8 }}>
              Gale: <strong>{strategySignal}</strong>
            </h5>
          </Col>
        </>
      )}
      </Row>
    </div>
  );
};

export default Aviator1;
