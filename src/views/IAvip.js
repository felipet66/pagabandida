import { BET_HOUSE } from "config/betHouse";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Button,
  Alert
} from "reactstrap";
import { Enviroments } from "../enviroments/enviroments";
import HistoryHours from "../components/HistoryHours/HistoryHours";
import PredictNext from "../components/PredictNext/PredictNext";
import MaximosMultiplicadores from "../components/MaximosMultiplicadores/MaximosMultiplicadores";

import moment from "moment";
import { Link } from "react-router-dom";

const IAVip = () => {
  const [betHouse, setBetHouse] = useState("MINES_BET");
  const [numberVelas, setNumberVelas] = useState(15);
  const [urlAviator, setUrlAviator] = useState("");
  const dateNow = moment(new Date()).format("YYYY-MM-DD");

  useEffect(() => {
  }, []);

  const startCasinoGame = async () => {
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent
    )
      ? 1
      : 0;

    const bet = betHouse === "MINES_BET" ? "3230" : "8197";
    const url = `${Enviroments.API_URL_BR4BET}api/casino-games/${bet}/start?demo=0&isMobileDevice=${isMobileDevice}`;

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
      alert("Realize a verificação dos documentos no site ganhebetBR");
    }
  };

  useEffect(() => {
    startCasinoGame();
  }, [betHouse]);

  const handleIframeUrl = () => {
    return urlAviator === "" ? BET_HOUSE.siteUrl : urlAviator;
  };

  return (
    <div className="content">
      <Row>
        <Col xs="3">
          <Link to="dashboard">
            <div className="d-flex justify-content-center align-items-center">
              <i aria-hidden="true" className="fas fa-arrow-left fs-xxl"></i>
              <span className="ml-2">voltar</span>
            </div>
          </Link>
        </Col>
      </Row>
      <Row>
        <Col xs="12" sm="8" md="6" lg="6">
          <Card>
            <CardHeader>
              <p>
                <h5 className="title p-0 m-0" style={{ display: "inline" }}>
                  Selecione o Gráfico abaixo
                </h5>{" "}
              </p>
            </CardHeader>
            <CardBody className="all-icons">
              <div className="d-flex">
                <Button
                  color={betHouse === "MINES_BET" ? "primary" : "default"}
                  className="btn-round"
                  size="sm"
                  onClick={() => setBetHouse("MINES_BET")}
                >
                  Gráfico 1 - Aviator
                </Button>
                <Button
                  color={betHouse === "BRAZUKA" ? "primary" : "default"}
                  className="btn-round"
                  size="sm"
                  onClick={() => setBetHouse("BRAZUKA")}
                >
                  Gráfico 2 - Aviator
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <Alert color="info" className="mb-4">
        ⚠️ Esta funcionalidade está em BETA e, em breve, será exclusiva para
        usuários VIPs ou assinantes da plataforma AutomaHack.
        <Link to="/admin/promos">
          <Button
            color=""
            className="d-flex align-items-center btn-round"
            size="sm"
          >
            Alterar Plano
          </Button>
        </Link>
      </Alert>
      <Row>
        <Col md="12">
          <Card>
            <MaximosMultiplicadores betHouse={betHouse} date={dateNow} />
          </Card>
        </Col>
      </Row>
      <Row>
        <Col xs="12">
          <Card>
            <PredictNext
              betHouse={betHouse}
              numberVelas={numberVelas}
              date={dateNow}
            />
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <h5 className="title">AutomaHack</h5>
              <p className="category">
                Pode operar diretamente pelo nosso IAVip!
              </p>
            </CardHeader>
            <CardBody className="all-icons">
              <iframe
                height="700"
                title="Hacking Aviator"
                style={{ border: "none" }}
                width={window.screen.width}
                name="aviator"
                className="col-md-12"
                src={handleIframeUrl()}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default IAVip;
