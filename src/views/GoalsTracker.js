import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  Button,
  Row,
  Col
} from "reactstrap";
import Swal from "sweetalert2";
import { Enviroments } from "../enviroments/enviroments";
import useUpdateBalance from "../hooks/useUpdateBalance";
import moment from "moment";

const GoalsTracker = () => {
  const [records, setRecords] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [error, setError] = useState(null);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [balance, setBalance] = useState(0);
  const userId = localStorage.getItem("userId");
  const CONSERVADOR = "CONSERVADOR";
  const MODERADO = "MODERADO";
  const AGRESSIVO = "AGRESSIVO";
  const [profile, setProfile] = useState(CONSERVADOR);

  useEffect(() => {
    if (userId) {
      fetchRecords();
    } else {
      console.error("Não foi possível concluir a operação.");
    }
  }, [userId]);

  const fetchRecords = async (startDate, endDate) => {
    try {
      setError(null); // Reset error state before fetching records

      const response = await axios.get(
        `${Enviroments.API_URL_IA}users/${userId}/records`,
        {
          params: {
            startDate,
            endDate
          }
        }
      );

      setRecords(response.data.records);
      setTotalAmount(response.data.total);
      setFilterStartDate(startDate || "");
      setFilterEndDate(endDate || "");
    } catch (error) {
      console.error("Não foi possível concluir a operação.");
      setError(
        error.response
          ? error.response.data.message
          : "Erro ao buscar registros"
      );
    }
  };

  const handleAddRecord = async (date, amount) => {
    try {
      const response = await axios.post(
        `${Enviroments.API_URL_IA}users/${userId}/records`,
        { date, amount: parseFloat(amount) }
      );
      setRecords(prevRecords => [...prevRecords, response.data]);
      setTotalAmount(prevTotal => prevTotal + parseFloat(amount));
      Swal.fire("Adicionado!", "Seu registro foi adicionado.", "success");
    } catch (error) {
      console.error("Não foi possível concluir a operação.");
      Swal.fire("Erro", "Ocorreu um erro ao adicionar o registro.", "error");
    }
  };

  const handleDeleteRecord = async (recordId, amount) => {
    try {
      await axios.delete(
        `${Enviroments.API_URL_IA}users/${userId}/records/${recordId}`
      );
      setRecords(prevRecords =>
        prevRecords.filter(record => record.id !== recordId)
      );
      setTotalAmount(prevTotal => prevTotal - parseFloat(amount));
      Swal.fire("Deletado!", "Seu registro foi deletado.", "success");
    } catch (error) {
      console.error("Não foi possível concluir a operação.");
      Swal.fire("Erro", "Ocorreu um erro ao deletar o registro.", "error");
    }
  };

  const openAddRecordModal = () => {
    Swal.fire({
      title: "Adicionar Ganho/Perda",
      html: `
        <form id="add-record-form">
          <div class="form-group">
            <label for="date">Data:</label>
            <input type="date" id="date" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="amount">Valor (R$):</label>
            <input type="number" id="amount" class="form-control" required>
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: "Adicionar",
      customClass: {
        popup: "swal2-dark",
        confirmButton: "swal2-dark",
        cancelButton: "swal2-dark"
      },
      preConfirm: () => {
        const date = Swal.getPopup().querySelector("#date").value;
        const amount = Swal.getPopup().querySelector("#amount").value;
        if (!date || !amount) {
          Swal.showValidationMessage(`Por favor, insira a data e o valor`);
        }
        return { date, amount };
      }
    }).then(result => {
      if (result.isConfirmed) {
        handleAddRecord(result.value.date, result.value.amount);
      }
    });
  };

  const openFilterModal = () => {
    Swal.fire({
      title: "Filtrar Registros",
      html: `
        <form id="filter-record-form">
          <div class="form-group">
            <label for="start-date">Data Inicial:</label>
            <input type="date" id="start-date" class="form-control" required>
          </div>
          <div class="form-group">
            <label for="end-date">Data Final:</label>
            <input type="date" id="end-date" class="form-control" required>
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: "Filtrar",
      customClass: {
        popup: "swal2-dark",
        confirmButton: "swal2-dark",
        cancelButton: "swal2-dark"
      },
      preConfirm: () => {
        const startDate = Swal.getPopup().querySelector("#start-date").value;
        const endDate = Swal.getPopup().querySelector("#end-date").value;
        if (!startDate || !endDate) {
          Swal.showValidationMessage(
            `Por favor, insira as datas de início e fim`
          );
        }
        return { startDate, endDate };
      }
    }).then(result => {
      if (result.isConfirmed) {
        fetchRecords(result.value.startDate, result.value.endDate);
      }
    });
  };

  const clearFilters = () => {
    setFilterStartDate("");
    setFilterEndDate("");
    fetchRecords();
  };

  const getUserBalanceByEmail = async () => {
    try {
      const email = localStorage.getItem("email");
      const response = await axios.get(
        `${Enviroments.API_URL_IA}users/email/${email}`
      );
      setBalance(response.data.firstBalance);
    } catch (error) {
      if (error.response) {
        // Erro na resposta do servidor (ex.: usuário não encontrado)

      } else {
        // Outro tipo de erro (ex.: falha na conexão)

      }
    }
  };

  const handleCalcOperation = value => {
    switch (profile) {
      case CONSERVADOR:
        return (value * 5) / 100;
      case MODERADO:
        return (value * 10) / 100;
      case AGRESSIVO:
        return (value * 20) / 100;
    }
  };

  useEffect(() => {
    getUserBalanceByEmail();
  }, []);

  return (
    <div className="content goals-tracker">
      <Row>
        <h3 className="pl-3 mb-3">Gestão de Ganhos/Perdas Diários</h3>
        <Col xs="12">
          <Card>
            <CardHeader className="d-flex flex-column justify-content-start align-items-start ">
              Selecione seu perfil de operações:
            </CardHeader>
            <CardBody className="all-icons">
              <Button
                color={profile === CONSERVADOR ? "success" : "default"}
                size="sm"
                onClick={() => setProfile(CONSERVADOR)}
              >
                Conservador
              </Button>
              <Button
                color={profile === MODERADO ? "success" : "default"}
                onClick={() => setProfile(MODERADO)}
                size="sm"
              >
                Moderado
              </Button>
              <Button
                color={profile === AGRESSIVO ? "success" : "default"}
                onClick={() => setProfile(AGRESSIVO)}
                size="sm"
              >
                Agressivo
              </Button>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col xs="12">
          <Card>
            <CardHeader>
              <div className="d-flex align-items-center justify-content-between">
                <h4>Registros Diários</h4>
                <div className="d-flex">
                  <Button color="success" onClick={openAddRecordModal}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-plus-circle-fill"
                      viewBox="0 0 16 16"
                    >
                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z" />
                    </svg>
                  </Button>
                  <Button
                    color="secondary"
                    onClick={openFilterModal}
                    style={{ marginLeft: "10px" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-filter-circle-fill"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16M3.5 5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1 0-1M5 8.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m2 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5" />
                    </svg>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody className="all-icons">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error} - Se os dados nao forem carregados, atualize a pagina
                  ou logue novamente.
                </div>
              )}
              {(filterStartDate || filterEndDate) && (
                <div
                  className="alert alert-info d-flex align-items-center"
                  role="alert"
                >
                  <div className="flex-grow-1">
                    Filtros ativos: {filterStartDate} a {filterEndDate}
                  </div>
                  <Button close aria-label="Cancel" onClick={clearFilters}>
                    <span aria-hidden>&times;</span>
                  </Button>
                </div>
              )}
              <Table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Banca Atual</th>
                    <th>Meta</th>
                    <th>Operação (R$)</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => (
                    <tr key={record.id}>
                      <td>{moment(record.date).format("DD/MM/yyyy")}</td>
                      <td>R$ {balance.toFixed(2)}</td>
                      <td>
                        R$
                        {handleCalcOperation(balance).toFixed(2)}
                      </td>
                      <td>
                        R$
                        {parseFloat(record.amount).toFixed(2)}{" "}
                        <span
                          style={{
                            fontSize: 10,
                            color:
                              (parseFloat(record.amount) / balance) * 100 > 0
                                ? "green"
                                : "red"
                          }}
                        >
                          {(parseFloat(record.amount) / balance) * 100}%
                        </span>
                      </td>
                      <td>
                        <Button
                          color="danger"
                          onClick={() =>
                            handleDeleteRecord(record.id, record.amount)
                          }
                          style={{ padding: "4px 8px", marginLeft: 8 }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-trash-fill"
                            viewBox="0 0 16 16"
                          >
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0" />
                          </svg>
                        </Button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <strong>Lucro:</strong>
                    </td>
                    <td>
                      <strong
                        style={{ color: totalAmount > 0 ? "green" : "red" }}
                      >
                        R$ {totalAmount.toFixed(2)}
                      </strong>
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GoalsTracker;
