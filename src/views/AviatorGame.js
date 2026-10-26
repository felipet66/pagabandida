import { SUPPORT_URL } from "config/support";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

import { Row, Col, Button } from "reactstrap";

import aviatorPng from "assets/img/aviator.png";
import { FaWhatsapp } from "react-icons/fa";

function AviatorGame() {
  const [count, setCount] = useState(0.0);
  const [real, setReal] = useState(0.5);
  const results = [1.01, 10.01, 1.01, 1.99, 9.55];
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (play) {
      randomNumber();
      setTimeout(() => setPlay(false), 5000);
    }
  }, [play]);

  const randomNumber = () => {
    const min = 1.1;
    const max = 11.04;
    const duration = 5000;

    for (let i = min; i <= max; i += 0.01) {
      setTimeout(nr => setCount(nr), (i * duration) / max, i);
    }

    for (let i = 0.5; i <= 5; i += 0.01) {
      setTimeout(nr => setReal(nr), (i * duration) / 5, i);
    }
  };

  const handleApostaClick = () => {
    const apostaData = localStorage.getItem("aviatorApostaGratisUsada");

    if (apostaData) {
      const ultimaVez = parseInt(apostaData);
      const agora = Date.now();
      const quatroHoras = 4 * 60 * 60 * 1000;

      if (agora - ultimaVez < quatroHoras) {
        Swal.fire({
          icon: "info",
          title: "Aposta já utilizada",
          text:
            "Você já usou sua aposta grátis nas últimas 4 horas. Volte mais tarde!",
          confirmButtonText: "OK"
        });
        return;
      }
    }

    // Salva o timestamp atual como registro da aposta
    localStorage.setItem("aviatorApostaGratisUsada", Date.now().toString());

    // Inicia o jogo
    setPlay(true);
  };
  useEffect(() => {
    if (real >= 4.99) {
      Swal.fire({
        icon: "success",
        title: "GREEEEEEEN",
        text:
          "Parabéns! Você ganhou R$5,00! Para resgatar o R$5,00 basta clicar no botão abaixo e falar comigo no whatsapp!!!",
        showConfirmButton: true,
        confirmButtonText: "REALIZAR SAQUE"
      }).then(result => {
        if (window.fbq) {
          window.fbq("trackCustom", "GanhouAposta");
        }

        if (result.isConfirmed) {
          if (window.gtag) {
            window.gtag("event", "ganhou_aposta", {
              event_category: "AviatorGame",
              event_label: "Click no botão REALIZAR SAQUE",
              value: count.toFixed(2)
            });
          }
          // Redireciona para o WhatsApp
          window.open(
            SUPPORT_URL,
            "_blank"
          );

          // Após 10 segundos, redireciona para a tela de cadastro
          setTimeout(() => {
            window.location.href = "/auth/register/ROLE_APP2";
            if (window.gtag) {
              window.gtag("event", "acesso_cadastro", {
                event_category: "Funil Aviator",
                event_label: "Usuário acessou tela de cadastro"
              });
            }
          }, 5000);
        }
      });
    }
  }, [real]);

  const getColor = value => {
    if (value < 2) return "#1d8cf8";
    if (value < 10) return "#7a0710d9";
    return "#e30613";
  };

  return (
    <div className="container aviator-game d-flex flex-column align-items-center justify-content-center py-4">
      <Row
        className="d-flex justify-content-center align-items-center mt-2"
        style={{ width: 320 }}
      >
        <Col>
          <h4 className="text-center pb-4">
            Você ganhou uma aposta grátis! Se bater acima de 5X você ganha!
          </h4>
          <ul
            className="d-flex justify-content-between w-100 px-0 mb-4"
            style={{ listStyle: "none" }}
          >
            {results.map(x => (
              <li
                key={x}
                className="text-center fw-bold"
                style={{
                  backgroundColor: "black",
                  borderRadius: 12,
                  padding: "4px 8px",
                  color: getColor(x),
                  fontSize: 16,
                  minWidth: 50
                }}
              >
                {x}
              </li>
            ))}
          </ul>

          <div className="text-center content-aviator mb-3">
            <div className={`aviator ${play ? "animation-start" : ""}`}></div>
            <h1 className="counter">{count.toFixed(2)}X</h1>
          </div>

          <div className="d-flex align-items-center justify-content-center">
            <button
              className="button-aviator px-4 py-2 fw-bold "
              onClick={handleApostaClick}
            >
              APOSTA R${real.toFixed(2)}
            </button>
          </div>
        </Col>
      </Row>
      {/* Botão flutuante do WhatsApp */}
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
      >
        <FaWhatsapp size={28} color="#fff" />
      </a>
    </div>
  );
}

export default AviatorGame;
