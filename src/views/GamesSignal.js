import React, { useEffect, useState } from "react";
import { Row, Col, Button, Progress } from "reactstrap";
import { TailSpin } from "react-loader-spinner";
import { Link } from "react-router-dom";
import AviatorFrame from "components/AviatorFrame/AviatorFrame";

import { Enviroments } from "../enviroments/enviroments";

const GamesSignal = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [iframeLink, setIframeLink] = useState(null);
  const [iframeTitle, setIframeTitle] = useState("");
  const [htmlContent, setHtmlContent] = useState(null);
  const isMobile = window.innerWidth <= 768;
  const apiToken = localStorage.getItem("apiToken");
  const [error, setError] = useState("");
  const [categorySelected, setCategorySelected] = useState("");
  const [signalMessage, setSignalMessage] = useState("");
  const [isGeneratingSignal, setIsGeneratingSignal] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showLoader, setShowLoader] = useState(false);
  const [signalRoleta, setSignalRoleta] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${Enviroments.API_URL_BR4BET}v2/casino-games/category`,
          {
            headers: {
              Authorization: `Bearer ${apiToken}`
            }
          }
        );
        const data = await response.json();
        // Primeiro, encontramos os itens específicos
        const secondItem = data.find(item => item.position === 12);

        // Filtramos os itens que não foram movidos
        const remainingItems = data.filter(item => item.position !== 12);

        // Mantemos a ordem dos restantes
        const sortedData = [secondItem, ...remainingItems];
        setCategories(sortedData);
      } catch (error) {
        setError("erro");
        console.error("Não foi possível concluir a operação.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [apiToken]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const getRandomEntries = () => {
    const normalEntries = Math.floor(Math.random() * (18 - 5 + 1)) + 5;
    const turboEntries = Math.floor(Math.random() * (18 - 5 + 1)) + 5;
    return { normalEntries, turboEntries };
  };

  const generateSignal = () => {
    setShowLoader(true);
    setTimeout(() => {
      const { normalEntries, turboEntries } = getRandomEntries();
      setShowLoader(false);
      setSignalMessage(
        `Fazer ${normalEntries} entradas normal e ${turboEntries} entradas no turbo`
      );
      setIsGeneratingSignal(true);
      setCountdown(60);
      setTimeout(() => {
        setIsGeneratingSignal(false);
        setSignalMessage("");
      }, 60000);
    }, 3000);
  };

  const handleGameClick = async (gameId, gameName, categoryName) => {
    try {
      const response = await fetch(
        `${Enviroments.API_URL_BR4BET}api/casino-games/${gameId}/start?demo=0&isMobileDevice=0`,
        {
          headers: {
            Authorization: `Bearer ${apiToken}`
          }
        }
      );
      const data = await response.json();
      setCategorySelected(categoryName);

      if (
        data.link.startsWith("<!DOCTYPE html>") ||
        data.link.startsWith("<!doctype html>")
      ) {
        setHtmlContent(data.link);
      } else {
        setIframeLink(data.link);
        setIframeTitle(gameName);
      }
    } catch (error) {
      console.error("Não foi possível concluir a operação.");
    }
  };

  const handleBack = () => {
    setIframeLink(null);
    setIframeTitle("");
    setHtmlContent(null);
    setSignalMessage("");
    setCountdown(0);
    setIsGeneratingSignal(false);
    setSignalRoleta(null);
  };

  const generateSignalRoleta = () => {
    const numbers = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 36)
    ); // Gera 5 números aleatórios
    const sections = [
      "Vermelho",
      "Preto",
      "Orphelins",
      "Tiers du Cylindre",
      "Voisins du Zéro"
    ];
    const columns = ["1ª Coluna", "2ª Coluna", "3ª Coluna"];

    return {
      mainNumber: numbers[0],
      coverage: numbers.slice(1), // Os 4 números restantes como cobertura
      section: sections[Math.floor(Math.random() * sections.length)],
      columnCoverage: [
        columns[Math.floor(Math.random() * columns.length)],
        columns[Math.floor(Math.random() * columns.length)]
      ]
    };
  };

  const handleRequestSignalRoleta = () => {
    setShowLoader(true);
    setTimeout(() => {
      const newSignal = generateSignalRoleta();
      setSignalRoleta(newSignal);
      setCountdown(120); // countdown de 2 minutos
      setShowLoader(false);
    }, 3000);
  };

  const SLOT_SIGNALS = () => {
    return (
      <>
        <Row className="d-flex justify-content-center align-items-center">
          <Col xs="12" md="8" className="text-center">
            <p className="text-muted">
              Clique em "Solicitar Sinal" para receber uma recomendação de
              aposta para race e colunas.
            </p>
          </Col>
        </Row>
        <Row className="d-flex justify-content-center mt-3">
          <Col xs="12" md="8" className="text-center">
            <Button
              color="primary"
              onClick={generateSignal}
              disabled={isGeneratingSignal || countdown > 0}
              className="d-block"
            >
              {isGeneratingSignal || countdown > 0
                ? `Aguarde para solicitar novamente `
                : "Gerar Sinal"}
            </Button>
            {showLoader && (
              <div className="mt-2">
                <TailSpin size="sm" />
              </div>
            )}
            {signalMessage && (
              <p className="mt-2 alert alert-success">{signalMessage}</p>
            )}
          </Col>
        </Row>
        {countdown > 0 && (
          <Row className="d-flex justify-content-center mt-3">
            <Col xs="12" md="6" className="text-center">
              <p className="text-danger">
                Tempo para próximo sinal: {Math.floor(countdown / 60)}:
                {(countdown % 60).toString().padStart(2, "0")}
              </p>
              <Progress value={((120 - countdown) / 120) * 100} />
            </Col>
          </Row>
        )}
      </>
    );
  };

  const ROLETA_SIGNALS = () => {
    return (
      <>
        <Row className="d-flex justify-content-center">
          <Col xs="12" md="8" className="text-center">
            <p className="text-muted">
              Clique em "Solicitar Sinal" para receber uma recomendação de
              aposta para race e colunas.
            </p>
          </Col>
        </Row>
        <Row className="d-flex justify-content-center mt-3">
          <Col xs="12" md="6" className="text-center">
            <Button
              className="mb-4"
              color="primary"
              onClick={handleRequestSignalRoleta}
              disabled={countdown > 0 || showLoader}
            >
              {loading ? "Buscando sinal..." : "Solicitar Sinal"}
            </Button>
          </Col>
        </Row>
        {signalRoleta && (
          <Row className="d-flex justify-content-center mt-4">
            <Col xs="12" md="6" className="text-center">
              <h4 className="text-success">SINAL CONFIRMADO</h4>
              <p>
                🎯 Apostar no número{" "}
                <strong style={{ fontSize: 20 }}>
                  {signalRoleta.mainNumber}
                </strong>
              </p>
              <p>
                Race: <strong>6 ou 7</strong>
              </p>
              <p>
                Colunas sugeridas:{" "}
                <strong>{signalRoleta.columnCoverage.join(" e ")}</strong>
              </p>
              <p>
                Proteção no número: <strong>0</strong>
              </p>
              <p>Fazer até 3 entradas. (Gale Opcional)</p>
            </Col>
          </Row>
        )}

        {countdown > 0 && (
          <Row className="d-flex justify-content-center mt-3">
            <Col xs="12" md="6" className="text-center">
              <p className="text-danger">
                Tempo para próximo sinal: {Math.floor(countdown / 60)}:
                {(countdown % 60).toString().padStart(2, "0")}
              </p>
              <Progress value={((120 - countdown) / 120) * 100} />
            </Col>
          </Row>
        )}
      </>
    );
  };

  if (loading) {
    return <div className="content">Carregando...</div>;
  }

  if (htmlContent) {
    return (
      <div className="content">
        <a
          color="primary"
          onClick={handleBack}
          style={{ cursor: "pointer" }}
          className="text-primary mb-3"
        >
          <i className="fa fa-chevron-left mr-1"></i>
          Voltar
        </a>
        <h4 className="mb-3">{iframeTitle}</h4>
        {(categorySelected === "Jogos da PG" ||
          categorySelected === "Melhores TaDa Gaming" ||
          categorySelected === "Melhores Slots" ||
          categorySelected === "Melhores Megaways") &&
          SLOT_SIGNALS()}
        <iframe
          className="img-fluid"
          frameBorder="0"
          srcDoc={htmlContent}
          title={iframeTitle}
          style={{ width: "100%", height: "80vh", border: "none" }}
        ></iframe>
      </div>
    );
  }

  if (iframeLink) {
    return (
      <div className="content">
        <a
          color="text-primary"
          style={{ cursor: "pointer" }}
          onClick={handleBack}
          className="mb-3"
        >
          <i className="fa fa-chevron-left mr-1"></i>
          Voltar
        </a>
        <h4 className="mb-3">{iframeTitle}</h4>

        {categorySelected === "Jogos de Roleta" && ROLETA_SIGNALS()}
        <AviatorFrame title={iframeTitle} src={iframeLink} />
      </div>
    );
  }

  return (
    <div className="content">
      <Row>
        <Col xs={3}>
          <Link to="dashboard">
            <div className="d-flex justify-content-center align-items-center">
              <i aria-hidden="true" className="fas fa-arrow-left fs-xxl"></i>
              <span className="ml-2">voltar</span>
            </div>
          </Link>
        </Col>
      </Row>
      {error !== "" && (
        <h6>Estamos com problemas para carregar todos os jogos</h6>
      )}
      {categories.map(category => (
        <div key={category.id} className="mt-2 mb-4">
          <h4 className="mb-3 text-primary">{category.name}</h4>
          <Row>
            {category.games.map(game => (
              <Col xs="4" key={game.id} className="mb-3">
                <div
                  style={{
                    border: "2px solid #e30613",
                    borderRadius: 8,
                    padding: 0
                  }}
                  onClick={() =>
                    handleGameClick(game.id, game.name, category.name)
                  }
                >
                  <div
                    className="simple-text logo-mini"
                    style={{
                      display: "block",
                      backgroundImage: `url(
                        https://images.cometagaming.com/${game.image}/${
                        isMobile ? "mobile" : "desktop"
                      }
                      )`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      height: "100px",
                      borderRadius: "8px",
                      cursor: "pointer"
                    }}
                    title={game.name}
                  >
                    &nbsp;
                  </div>
                  <p
                    className="mt-2 text-center text-primary"
                    style={{ fontSize: "14px", color: "#e30613" }}
                  >
                    {game.name}
                  </p>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </div>
  );
};

export default GamesSignal;
