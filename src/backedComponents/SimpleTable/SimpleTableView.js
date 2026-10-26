import React from "react";
import { Card, CardBody, Table } from "reactstrap";
import EmptyState from "components/EmptyState/EmptyState";

export function SimpleTableView({ data = [], dataHeaders = [], loading = false, emptyTitle = "Sem dados para analisar", emptyDescription = "Não há resultados suficientes para esta análise. Aumente a quantidade de velas ou ajuste a odd selecionada." }) {
  return (
    <Card>
      <CardBody className="card-table overflow-auto">
        {loading ? <p className="text-muted text-center p-4" role="status">Carregando análise...</p> : data.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <Table className="tablesorter">
            <thead className="text-primary"><tr>{dataHeaders.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead>
            <tbody>{data.map((item, index) => <tr key={item.id || index}>
              {dataHeaders.map(header => <td key={header}>{item[header] + (header === "porcentagem" ? "%" : "")}</td>)}
            </tr>)}</tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}
