import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardTitle, Row, Col, Button } from 'reactstrap';
import { fetchAviatorRecords } from "../../services/aviatorRecords";

function HistoryOddsPinks() {

  const [historyResultsAviator, setHistoryResultsAviator] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [numberVelas, setNumberVelas] = useState(10);
  const [updatedOdd, setUpdatedOdd] = useState(true);

  const getBadgeClassName = value => {
    if (value < 2) {
      return 'bg-info';
    } else if (value <= 9.99) {
      return 'bg-purple';
    } else if (value >= 10) {
      return 'bg-pink';
    }
  };

  const setResults = async () => {
    const res = await getHistoryResultsAviator();
    setHistoryResultsAviator(res);
  };

  useEffect(() => {
    if (updatedOdd) {
      setResults();
      setTimeout(() => {
        setUpdatedOdd(false);
      }, 10000);
    }
  }, [numberVelas, updatedOdd]);

  const getHistoryResultsAviator = async () => {
    try {
      const { records } = await fetchAviatorRecords(1, undefined, 1, numberVelas, 10);
      return records;
    } catch (error) {
      console.error("Não foi possível concluir a operação.");
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="history-odd pl-2 pr-2">
      {historyLoading? (
        <div className="d-flex justify-content-center align-items-center w-100">
          <div className="lds-spinner">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      ) : (
        <Row>
          <Col xs="12">
            <Row>
              <Col className="text-left" xs={8}>
                <h5 className="card-category">
                  Histórico de velas Rosas <br></br>clique em atualizar para as rosas
                </h5>
              </Col>
              <Col xs={4}>
                <Button size="sm" disabled={updatedOdd} onClick={() => setUpdatedOdd(true)}>Atualizar</Button>
              </Col>
            </Row>
            <Row>
              <div className="history-results row">
                {historyResultsAviator?.map((item, i) => (
                  <div className="vela-results" key={item + i}>
                    <span
                      key={item.hour}
                      className={`badge text-wrap ${getBadgeClassName(item.odd)}`}
                      style={{
                        color: "white",
                      }}
                    >
                      {item.odd && item.odd}
                    </span>

                    <br />

                    <span style={{ fontSize: 11 }}>
                      {item.hour}
                    </span>
                  </div>
                ))}
              </div>
            </Row>
          </Col>
        </Row>
      )}
    </div>
  );
}

export default HistoryOddsPinks;
