import { SUPPORT_URL } from "config/support";
import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Button
} from "reactstrap";
import useFetchUserMe from "../hooks/useFetchUserMe";
import useFetchTransactions from "../hooks/useFetchTransactions";
import ModalLegitimuz from "../components/ModalLegitimuz/ModalLegitimuz.js";
import SliderBanner from "../components/SliderBanner/SliderBanner.js";
import { FaWhatsapp, FaHistory, FaClock, FaBolt, FaDice } from "react-icons/fa";
import axios from "axios";
import TableTransactionsCassino from "../components/TableTransactionsCassino/TableTransactionsCassino";
import { Enviroments } from "../enviroments/enviroments";
import logoKyc from "assets/img/aviso-kyc.png";
import { Link } from "react-router-dom";
import { useMaintenanceNotice } from "contexts/MaintenanceNoticeContext";

const Dashboard = () => {
  const { maintenanceAcknowledged } = useMaintenanceNotice();
  const [legitimuzStatus, setLegitimuzStatus] = useState(null);
  const [isOpenModal, setOpenModal] = useState(false);
  const [frameId, setFrameId] = useState("");

  const apiToken = localStorage.getItem("apiToken");
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${apiToken}`
    }
  };

  const handleLegitimuz = async () => {
    try {
      const data = await axios.get(
        `${Enviroments.API_URL_BR4BET}api/legitimuzStatus`,
        axiosConfig
      );

      setLegitimuzStatus(data.data.isApproved);
      setOpenModal(true);
    } catch (err) {

      setOpenModal(false);
    }
  };

  useEffect(() => {
    handleLegitimuz();
  }, [legitimuzStatus]);

  const {
    data: userMe,
    error: userError,
    loading: userLoading
  } = useFetchUserMe();

  const {
    data: withdrawsData,
    error: withdrawsError,
    loading: withdrawsLoading
  } = useFetchTransactions(1, "Withdraw");

  const totalWithdraws = withdrawsData?.data
    ? withdrawsData.data.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      )
    : 0;

  const withdrawsByDate = withdrawsData?.data
    ? withdrawsData.data.reduce((acc, transaction) => {
        const date = transaction.created_at.split("T")[0];
        acc[date] = (acc[date] || 0) + transaction.amount;
        return acc;
      }, {})
    : {};

  const withdrawLabels = Object.keys(withdrawsByDate);
  const withdrawAmounts = Object.values(withdrawsByDate).map(
    amount => amount / 100
  );

  const withdrawChartData = {
    labels: withdrawLabels,
    datasets: [
      {
        label: "Saques por Data",
        data: withdrawAmounts,
        backgroundColor: "rgba(0, 255, 0, 0.5)",
        borderColor: "rgba(0, 255, 0, 0.5)",
        borderWidth: 2
      }
    ]
  };

  const withdrawChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top"
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Data"
        }
      },
      y: {
        title: {
          display: true,
          text: "Valor (R$)"
        },
        ticks: {
          beginAtZero: true
        }
      }
    }
  };

  const toggleModal = () => setOpenModal(!isOpenModal);

  if (userLoading || withdrawsLoading) {
    return <p className="content">Carregando informações...</p>;
  }

  if (userError || withdrawsError) {
    return <>Ocorreu algum problema...</>;
  }

  return (
    <div className="content dashboard">
      <Row>
        <ModalLegitimuz
          isOpen={
            maintenanceAcknowledged &&
            !legitimuzStatus &&
            frameId !== "" &&
            isOpenModal
          }
          iframeId={frameId}
          toggle={toggleModal}
        />
      </Row>

      <Row
        className={`${
          !legitimuzStatus ? "d-flex" : "d-none"
        } justify-content-center align-items-center mb-4`}
      >
        <img src={logoKyc} height={200} />
      </Row>

      <Row
        className={`${
          !legitimuzStatus ? "d-flex" : "d-none"
        } justify-content-center align-items-center mb-4`}
      >
        <p>
          Está pendente você enviar seus documentos, para sacar e depositar você
          precisa fazer a verificação abaixo!
        </p>
        <Button color="primary" onClick={toggleModal}>
          Verificação KYC
        </Button>
        <a
          href={SUPPORT_URL}
          target="_blank"
          className="btn"
        >
          Suporte
        </a>
      </Row>

      <Row className="justify-content-center text-center mb-4">
        <Col xs="3" sm="3">
          <Link to="/admin/history-aviator" className="shortcut-feature">
            <FaHistory size={60} className="icon-circle" />
            <p>Histórico Aviator</p>
          </Link>
        </Col>
        <Col xs="3" sm="3">
          <Link to="/admin/horarios" className="shortcut-feature">
            <FaClock size={60} className="icon-circle" />
            <p>Sinais por Horário</p>
          </Link>
        </Col>
        <Col xs="3" sm="3">
          <Link to="/admin/aviator-hack" className="shortcut-feature">
            <FaBolt size={60} className="icon-circle" />
            <p>Sinais Tempo Real</p>
          </Link>
        </Col>
        <Col xs="3" sm="3">
          <Link to="/admin/roletas" className="shortcut-feature">
            <FaDice size={60} className="icon-circle" />
            <p>Sinais Roletas</p>
          </Link>
        </Col>
      </Row>

      <Row>
        <Col lg="6" sm="6" xs="6">
          <Card className="card-chart">
            <CardHeader>
              <h5 className="card-category">Saldo Atual</h5>
              <CardTitle tag="h3">
                <i className="tim-icons icon-bell-55 text-primary" /> R${" "}
                {userMe?.balance ? userMe.balance.toFixed(2) / 100 : "0.00"}
              </CardTitle>
            </CardHeader>
          </Card>
        </Col>
        <Col lg="6" sm="6" xs="6">
          <Card className="card-chart">
            <CardHeader>
              <h5 className="card-category">Total de Saques</h5>
              <CardTitle tag="h3">
                <i
                  className="tim-icons icon-send"
                  style={{ color: "#00ff00" }}
                />{" "}
                R${" "}
                {(
                  Object.values(withdrawsByDate).reduce(
                    (sum, amount) => sum + amount,
                    0
                  ) / 100
                ).toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="card-chart">
            <CardHeader>
              <h5 className="card-category">Total de Saques</h5>
              <CardTitle tag="h3">
                <i
                  className="tim-icons icon-send"
                  style={{ color: "#00ff00" }}
                />{" "}
                R${" "}
                {(
                  Object.values(withdrawsByDate).reduce(
                    (sum, amount) => sum + amount,
                    0
                  ) / 100
                ).toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div className="chart-area">
                <Bar data={withdrawChartData} options={withdrawChartOptions} />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <TableTransactionsCassino />
        </Col>
      </Row>

      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
      >
        <FaWhatsapp size={28} color="#fff" />
      </a>
    </div>
  );
};

export default Dashboard;
