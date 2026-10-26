import { BET_HOUSE } from "config/betHouse";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Button,
  Label
} from "reactstrap";
import { Enviroments } from "../enviroments/enviroments";

const ValidateAccount = () => {
  return (
    <div className="content">
      <Row>
        <Col xs="12">
          <Card>
            <CardHeader>
              <h4>Atenção!</h4>
              <p>
                Para sua segurança, é necessário fazer uma verificação para
                comprovar que vocë é uma pessoa real.
              </p>
              <p>
                Não se preocupe, você só precisará fazer esse procedimento desta
                vez.
              </p>
            </CardHeader>
            <CardBody className="all-icons">
              <div className="d-flex"></div>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <h5 className="title">Bem vindo!</h5>
              <p className="category">
                Faça Login abaixo, e faça sua verificação facial e do documento.
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
                src={BET_HOUSE.siteUrl}
                frameborder="0"
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

export default ValidateAccount;
