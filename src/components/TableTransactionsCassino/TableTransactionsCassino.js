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
import useFetchTransactions from "../../hooks/useFetchTransactions"; // Importa o hook de transações

function TableTransactionsCassino() {
  const { data, error, loading } = useFetchTransactions(
    1,
    "CasinoTransaction",
    15
  ); // Busca as transações

  if (loading) return <p>Carregando informações...</p>;
  if (error) return <p>Erro ao carregar dados: {error}</p>;

  return (
    <>
      <div className="content">
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h4">Ultimas Transações</CardTitle>
              </CardHeader>
              <CardBody>
                <Table className="tablesorter" responsive>
                  <thead className="text-primary">
                    <tr>
                      <th>Data</th>
                      <th>Jogo</th>
                      <th>Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data.map(transaction => (
                      <tr key={transaction.id}>
                        <td>
                          {new Date(transaction.created_at).toLocaleDateString(
                            "pt-BR"
                          )}
                        </td>
                        <td>
                          {transaction.source?.casino_game?.name || "N/A"}
                        </td>
                        <td>R$ {(transaction.amount / 100).toFixed(2)}</td>
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

export default TableTransactionsCassino;
