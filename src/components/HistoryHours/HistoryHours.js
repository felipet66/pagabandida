import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col
} from "reactstrap";
import { recordsByHour } from "../../services/aviatorRecords";

function HistoryHours({ records = [], loading }) {
  const historyHourAviator = recordsByHour(records, 10);
  const historyHourAviator30 = recordsByHour(records, 30);
  const historyHourAviator100 = recordsByHour(records, 100);
  const loadingAviator = loading;
  const loadingAviator30 = loading;
  const loadingAviator100 = loading;

  return (
    <div className="history-hours">
      <Row>
        <Col md={4}>
          <Card className="card-chart">
            <CardHeader>
              <h5 className="card-category">Histórico de pague por horário</h5>
              <CardTitle tag="h4">Histórico de pague: 10X</CardTitle>
            </CardHeader>
            <CardBody className="body-hours p-3">
              {loadingAviator ? (
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
                historyHourAviator?.oddsByHour?.map((item, index) => (
                  <div className="d-flex justify-content-between" key={index}>
                    <CardTitle tag="h5" className="hour-item">
                      {item.hour}
                    </CardTitle>
                    <CardTitle tag="h5" className="hour-count">
                      {item.count}
                    </CardTitle>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="card-chart">
            <CardHeader>
              <h5 className="card-category">Histórico de pague por horário</h5>
              <CardTitle tag="h4">Histórico de pague: 30X</CardTitle>
            </CardHeader>
            <CardBody className="body-hours p-3">
              {loadingAviator30 ? (
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
                historyHourAviator30?.oddsByHour?.map((item, index) => (
                  <div className="d-flex justify-content-between" key={index}>
                    <CardTitle tag="h5" className="hour-item">
                      {item.hour}
                    </CardTitle>
                    <CardTitle tag="h5" className="hour-count">
                      {item.count}
                    </CardTitle>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="card-chart">
            <CardHeader>
              <h5 className="card-category">Histórico de pague por horário</h5>
              <CardTitle tag="h4">Histórico de pague: 100X</CardTitle>
            </CardHeader>
            <CardBody className="body-hours p-3">
              {loadingAviator100 ? (
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
                historyHourAviator100?.oddsByHour?.map((item, index) => (
                  <div className="d-flex justify-content-between" key={index}>
                    <CardTitle tag="h5" className="hour-item">
                      {item.hour}
                    </CardTitle>
                    <CardTitle tag="h5" className="hour-count">
                      {item.count}
                    </CardTitle>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default HistoryHours;
