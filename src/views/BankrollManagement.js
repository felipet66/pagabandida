import React from "react";
import { Card, CardBody, Col, Row } from "reactstrap";
import { Link } from "react-router-dom";
import InvestmentTable from "../components/InvestmentTable/InvestmentTable";
import { ArrowLeft } from "lucide-react";
import Icon from "components/DesignSystem/Icon";

const BankrollManagement = () => (
  <div className="content bankroll-page">
    <Row>
      <Col xs="12">
        <Link to="/admin/dashboard" className="bankroll-back-link">
          <Icon as={ArrowLeft} size={16} />
          <span>Voltar para histórico</span>
        </Link>
      </Col>
    </Row>

    <Row>
      <Col lg="12">
        <Card className="bankroll-card glass edge mt-3">
          <CardBody>
            <InvestmentTable />
          </CardBody>
        </Card>
      </Col>
    </Row>
  </div>
);

export default BankrollManagement;
