import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Table,
  Row,
  Col
} from "reactstrap";
import useFetchTransactions from "../hooks/useFetchTransactions"; // Importa o hook de transações

function Tables() {
  const { data, error, loading } = useFetchTransactions(1, "CasinoTransaction"); // Busca as transações

  if (loading) return <p>Carregando informações...</p>;
  if (error) return <p>Erro ao carregar dados: {error}</p>;

  return (
    <>
      <div className="content">
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h4">Transações do Cassino</CardTitle>
              </CardHeader>
              <CardBody>
                <Table className="tablesorter" responsive>
                  <thead className="text-primary">
                    <tr>
                      <th>ID</th>
                      <th>Tipo</th>
                      <th>Valor (R$)</th>
                      <th>Status</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{transaction.id}</td>
                        <td>{transaction.source_type}</td>
                        <td>{(transaction.amount / 100).toFixed(2)}</td>
                        <td>
                          {transaction.source?.status_detail || "Indisponível"}
                        </td>
                        <td>
                          {new Date(transaction.created_at).toLocaleDateString(
                            "pt-BR"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Tables;
