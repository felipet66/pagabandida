import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, CardTitle, Row, Col } from "reactstrap";


function HistoryOddsPinks({ records = [], loading: historyLoading }) {

  const [historyResultsAviator, setHistoryResultsAviator] = useState([]);
  const [numberVelas, setNumberVelas] = useState(10);
  const [filterVelas, setFilterVelas] = useState(10);

  const getBadgeClassName = value => {
    if (value < 2) {
      return "bg-info";
    } else if (value <= 9.99) {
      return "bg-purple";
    } else if (value >= 10) {
      return "bg-pink";
    }
  };

  useEffect(() => {
    setHistoryResultsAviator(records.filter(item => Number(item.odd) >= Number(filterVelas)).slice(0, numberVelas === "all" ? records.length : Number(numberVelas)));
  }, [records, numberVelas, filterVelas]);

  return (
    <div className="history-odd">
      {historyLoading ? (
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
            <Card className="card-chart">
              <CardHeader>
                <Row>
                  <Col className="text-left" sm="4">
                    <h5 className="card-category">
                      Histórico de velas Rosas <br></br>mude o campo ao lado
                      para atualizar
                    </h5>
                    <CardTitle tag="h3">Histórico de Velas Rosas.</CardTitle>
                  </Col>
                  <Col
                    sm="2"
                    className="d-flex justify-content-start align-items-center"
                  >
                    <div className="form-floating">
                      Qde de velas
                      <select
                        id="floatingSelect"
                        className="form-control"
                        onChange={event => setNumberVelas(event.target.value)}
                        value={numberVelas}
                      >
                        <option value="10">10</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="500">500</option>
                        <option value="all">Todos carregados</option>

                      </select>
                    </div>{" "}
                  </Col>
                  <Col
                    sm="2"
                    className="d-flex justify-content-start align-items-center"
                  >
                    <div className="form-floating">
                      Valor das velas
                      <select
                        id="floatingSelect"
                        className="form-control"
                        onChange={event => setFilterVelas(event.target.value)}
                        value={filterVelas}
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="500">500</option>
                      </select>
                    </div>{" "}
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                <div className="history-results row">
                  {historyResultsAviator?.map((item, i) => (
                    <div className="vela-results" key={item + i}>
                      <span
                        key={item.hour}
                        className={`badge text-wrap ${getBadgeClassName(
                          item.odd
                        )}`}
                        style={{
                          color: "white",
                        }}
                      >
                        {item.odd && item.odd}
                      </span>

                      <br />

                      <span style={{ fontSize: 11 }}>{item.hour}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}

export default HistoryOddsPinks;
