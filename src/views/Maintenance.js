import { SUPPORT_URL } from "config/support";
import React, { useState } from "react";
import { Card, CardHeader, CardBody, CardTitle, CardFooter, Col, Form, FormGroup, Label, Input, Button, Alert } from "reactstrap";
import axios from "axios";
import logoAutomahack from "assets/brand/pagabandida-emblema-verde-512.webp";
import PhoneInput from "../components/PhoneInput/PhoneInput";

function Maintenance() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name || !phone) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      const SUPABASE_URL = "https://hvjwqlhrwgfjhtegyvjx.supabase.co/rest/v1/leads";
      const SUPABASE_KEY = "sb_publishable_lFmYrNB2fhsDgZcB37uCaQ_NP-KQKJu";

      await axios.post(
        SUPABASE_URL,
        {
          name: name,
          phone: phone,
        },
        {
          headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
        }
      );

      setSuccess(true);
      setName("");
      setPhone("");
    } catch (err) {
      console.error("Não foi possível concluir a operação.");
      setError("Erro ao salvar contato. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
      <Col className="col-md-6 col-lg-4">
        <Card className="card-user">
          <CardHeader>
            <CardTitle tag="h3" className="text-center">Manutenção</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="d-flex justify-content-center mb-3">
              <img src={logoAutomahack} alt="Logo" width={150} />
            </div>
            <div className="text-center mb-4">
              <p className="description">
                Estamos realizando uma manutenção programada. <br/>
                Deixe seu contato para ser avisado quando voltarmos!
              </p>
            </div>

            <Form onSubmit={handleSubmit}>
              <Alert isOpen={!!error} color="danger">
                {error}
              </Alert>
              <Alert isOpen={success} color="success">
                Contato salvo com sucesso! Avisaremos em breve.
              </Alert>

              <FormGroup>
                <Label>Nome</Label>
                <Input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </FormGroup>
              <FormGroup>
                <Label>WhatsApp</Label>
                <PhoneInput
                  className="form-control"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
              </FormGroup>

              <Button color="primary" type="submit" block disabled={loading}>
                {loading ? "Enviando..." : "Avise-me quando voltar"}
              </Button>
            </Form>
          </CardBody>
          <CardFooter className="d-none">
            <div className="text-center mt-2">
              <a
                className="text-muted"
                rel="noreferrer noopener"
                href={SUPPORT_URL}
                target="_blank"
                style={{ fontSize: '0.8rem' }}
              >
                Fale com o Suporte
              </a>
            </div>
          </CardFooter>
        </Card>
      </Col>
    </div>
  );
}

export default Maintenance;
