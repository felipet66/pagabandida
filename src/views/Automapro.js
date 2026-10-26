import { BET_HOUSE } from "config/betHouse";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Card, CardHeader, CardBody, Row, Col } from "reactstrap";

import { Enviroments } from "../enviroments/enviroments";

const Automahack = () => {
  const [urlAviator, setUrlAviator] = useState("");
  const [historyOdds, setHistoryOdds] = useState([]);
  const lastTextRef = useRef("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")) || undefined;
  }, []);

  const openNewTabAndExecuteScript = () => {
    const newWindow = window.open(urlAviator, "_blank");

    if (newWindow) {
      newWindow.onload = () => {


        // Injetar script na nova aba
        const script = newWindow.document.createElement("script");
        script.innerHTML = `
          (function() {
            const element = document.querySelector("app-stats-widget");
            if (element) {
              const text = element.textContent;
              const newText = text.split("Histórico da rodada")[0];
              const toArray = newText
                .split("\\n")
                .map((item) => item.trim().replace("x", ""))
                .filter((item) => item !== "");

            } else {
              console.error("Não foi possível concluir a operação.");
            }
          })();
        `;
        newWindow.document.body.appendChild(script);
      };
    } else {
      console.error("Não foi possível concluir a operação.");
    }
  };

  const startCasinoGame = async () => {
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent
    )
      ? 1
      : 0;

    const url = `${Enviroments.API_URL_BR4BET}api/casino-games/3230/start?demo=0&isMobileDevice=${isMobileDevice}`;

    try {
      const apiToken = localStorage.getItem("apiToken");

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        }
      });

      setUrlAviator(response.data.link);
    } catch (error) {
      console.error("Não foi possível concluir a operação.");
      throw new Error("Não foi possível iniciar o jogo. Tente novamente.");
    }
  };

  useEffect(() => {
    startCasinoGame();
  }, []);

  const handleIframeUrl = () => {
    return urlAviator === "" ? BET_HOUSE.siteUrl : urlAviator;
  };

  useEffect(() => {
    const handleMessage = event => {
      if (event.source !== window || event.data.type !== "FROM_PAGE") return;
      setHistoryOdds(event.data.text);

    };

    const handleMutation = () => {
      const element = document.querySelector("app-stats-widget");
      if (!element) return;
      const text = element.textContent;
      if (text === lastTextRef.current) return;
      lastTextRef.current = text;
      const newText = text.split("Histórico da rodada")[0];
      const toArray = newText
        .split("\n")
        .map(item => item.trim().replace("x", ""))
        .filter(item => item !== "");

      window.postMessage({ type: "FROM_PAGE", text: toArray }, "*");
    };

    window.addEventListener("message", handleMessage);

    const observer = new MutationObserver(handleMutation);
    const targetNode = document.querySelector("body");
    if (targetNode) {
      observer.observe(targetNode, { childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener("message", handleMessage);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="content">
      <Row>
        <Col xs="12" sm="8" md="4" lg="4">
          <Card>
            <CardHeader>
              <p>
                <h5 className="title" style={{ display: "inline" }}>
                  Automatizador de Entradas
                </h5>{" "}
              </p>
            </CardHeader>
            <CardBody className="all-icons">
              <div className="d-flex">Automahack</div>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <h5 className="title">Ainda não disponível</h5>
              <p className="category">
                Pode operar diretamente pelo nosso Automahack!
              </p>
            </CardHeader>
            <CardBody className="all-icons">
              <button
                className="btn btn-primary"
                onClick={openNewTabAndExecuteScript}
              >
                Carregar Automação
              </button>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Automahack;
