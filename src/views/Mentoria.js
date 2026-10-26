import { SUPPORT_URL } from "config/support";
import React from "react";

// reactstrap components
import { Card, CardHeader, CardBody, CardTitle, Col } from "reactstrap";

function Mentoria(props) {
  return (
    <div>
      <Col className="ml-auto mr-auto col-md-8 col-lg-8 col-sm-8">
        <Card>
          <CardHeader>
            <CardTitle tag="h3">Apresentação da Mentoria</CardTitle>
            <CardTitle tag="p">
              Seja bem vindo a mentoria 100x do Paga Bandida. Assita o video abaixo e
              entenda como funciona a mentoria. Espero voce nessa turma! Voce
              ira receber acesso por email, qualquer dúvida Fale comigo pelo
              WhatsApp
            </CardTitle>
          </CardHeader>
          <CardBody>
            <div>
              <iframe
                src="https://player.vimeo.com/video/868326597?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
                frameborder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                title="Mentoria 100X do Paga Bandida"
                style={{ width: "100%", height: 500 }}
              ></iframe>
            </div>
            <script src="https://player.vimeo.com/api/player.js"></script>
          </CardBody>
          <div className="flex justify-content-space-between">
            <a
              href="https://ev.braip.com/checkout/plaqje1l/cheq7d4e"
              target="_blank"
              className="flex flex-column align-items-center justify-content-center px-3 py-3"
              rel="noreferrer"
            >
              <h5 className="text-center">
                Deseja comprar o acesso para Mentoria ?
              </h5>
              <button
                className="btn btn-primary w-100 p-0"
                style={{ height: 30 }}
              >
                MENTORIA POR R$297,00
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

export default Mentoria;
