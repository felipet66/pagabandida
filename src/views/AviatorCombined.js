import { BET_HOUSE } from "config/betHouse";
import React, { useEffect } from "react";
import Aviator1 from "./Aviator2";
import Aviator10 from "./Aviator10";
import AviatorFrame from "components/AviatorFrame/AviatorFrame";
import { Col, Row } from "reactstrap";
import { Link } from "react-router-dom";
import HistoryOddsPinksMin from "components/HistoryOddsPinksMin/HistoryOddsPinksMin";
import AnimatedMessage from "components/AnimatedMessage/AnimatedMessage";
import OnlineUsers from "components/OnlineUsers/OnlineUsers";
import useStartGame from "hooks/useStartGame";

const AviatorMain = () => {
  const { gameUrl, startGame } = useStartGame();

  useEffect(() => {
    startGame({ slug: "spribe/aviator" });
  }, []);

  const handleIframeUrl = () => {
    return gameUrl || BET_HOUSE.siteUrl;
  };

  return (
    <div className="content">
      <Row className="d-flex justify-content-center align-items-center mx-auto">
        <Col xs={3}>
          <Link to="dashboard">
            <div className="d-flex justify-content-center align-items-center">
              <i aria-hidden="true" className="fas fa-arrow-left fs-xxl"></i>
              <span className="ml-2">voltar</span>
            </div>
          </Link>
        </Col>
        <Col xs={9}>
          <h3 className="title m-0 text-right">I.A. 2X A 10X</h3>
        </Col>
      </Row>

      <Row className="d-flex justify-content-center align-items-center mt-2">
        <Col xs="auto" className="text-center">
          <AnimatedMessage />
        </Col>
      </Row>

      <Row className="d-flex justify-content-center align-items-center mt-2">
        <Col xs="auto" className="text-center">
          <OnlineUsers />
        </Col>
      </Row>

      <Row className="mt-2">
        <Col>
          <p className="category">
            Sinais:
            <strong style={{ color: "#e30613", fontSize: 14 }}> 1.50X</strong> a{" "}
            <strong style={{ color: "#e30613", fontSize: 14 }}>2.00X</strong>
          </p>
          <Aviator1 />
        </Col>
      </Row>

      <Row>
        <Col>
          <p className="category">
            Sinais:{" "}
            <strong style={{ color: "#e30613", fontSize: 14 }}>10X</strong>
          </p>
          <Aviator10 />
        </Col>
      </Row>

      <Row>
        <Col>
          <HistoryOddsPinksMin />
        </Col>
      </Row>

      <Row className="mt-2">
        <Col>
          <AviatorFrame title="Aviator" src={handleIframeUrl()} />
        </Col>
      </Row>
    </div>
  );
};

export default AviatorMain;
