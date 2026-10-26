import { SUPPORT_URL } from "config/support";
import React from "react";

// reactstrap components
import { Card, CardHeader, CardBody, CardTitle, Col } from "reactstrap";

function Presentation(props) {
  return (
    <div>
      <Col className="ml-auto mr-auto col-md-8 col-lg-8 col-sm-8">
        <Card>
          <div
            className="flex flex-column justify-content-space-between"
            style={{ height: 240 }}
          >
            <a
              href="https://ev.braip.com/checkout/pla29jvn/cherq4zv"
              target="_blank"
              className="flex flex-column align-items-center justify-content-center"
              rel="noreferrer"
            >
              <button
                className="btn btn-primary w-100 p-0"
                style={{ height: 38 }}
              >
                COMPRAR DASHBOARD
              </button>
            </a>

            <a
              href="https://apostaganha.me/FelipeTeles95"
              target="_blank"
              className="flex flex-column align-items-center justify-content-center"
              rel="noreferrer"
            >
              <button
                className="btn btn-danger w-100 p-0"
                style={{ height: 38 }}
              >
                GANHAR R$5,00 NO AVIATOR
              </button>
            </a>

            <a
              href={SUPPORT_URL}
              target="_blank"
              className="flex flex-column align-items-center justify-content-center"
              rel="noreferrer"
            >
              <button className="btn btn-info w-100 p-0" style={{ height: 38 }}>
                TELEGRAM GRATUITO + OPERACOES AO VIVO
              </button>
            </a>

            <a
              href="https://pay.kirvano.com/3b29387f-7d26-42fa-9f79-8bd6549d1da6"
              target="_blank"
              className="flex flex-column align-items-center justify-content-center"
              rel="noreferrer"
            >
              <button
                className="btn btn-primary w-100 p-0"
                style={{ height: 38 }}
              >
                ROBO DE SINAIS 10X - 24HS
              </button>
            </a>

            <a
              href="https://pay.kirvano.com/e9daea87-9975-48af-988a-055f164a2ceb"
              target="_blank"
              className="flex flex-column align-items-center justify-content-center"
              rel="noreferrer"
            >
              <button
                className="btn btn-danger w-100 p-0"
                style={{ height: 38 }}
              >
                ROBO DE SINAIS 5X - 24HS
              </button>
            </a>

            <a
              href="https://pay.kirvano.com/4b0ddd78-ace2-4599-8fad-e4455e1512a2"
              target="_blank"
              className="flex flex-column align-items-center justify-content-center"
              rel="noreferrer"
            >
              <button className="btn btn-info w-100 p-0" style={{ height: 38 }}>
                ROBO DE SINAIS 2X - 24HS
              </button>
            </a>

            <a
              href="https://pay.kirvano.com/374e4a24-f105-4d55-b087-6f63bc0125f2"
              target="_blank"
              className="flex flex-column align-items-center justify-content-center"
              rel="noreferrer"
            >
              <button
                className="btn btn-danger w-100 p-0"
                style={{ height: 38 }}
              >
                MENTORIA 100X + ACESSO AOS ROBOS
              </button>
            </a>
          </div>
        </Card>
      </Col>
      <a
        href={SUPPORT_URL}
        target="_blank"
        className="flex flex-column align-items-center justify-content-center px-3 py-3 whatsapp"
        rel="noreferrer"
      >
        <p className="whatsapp-call">Suporte</p>
      </a>
    </div>
  );
}

export default Presentation;
