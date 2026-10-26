import { useState, useCallback } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  FormGroup,
  Label
} from "reactstrap";

import axios from "axios";

const useUpdateBalance = (userId, callback) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [balance, setBalance] = useState("");
  const [error, setError] = useState("");

  const toggleModal = useCallback(() => {
    setModalOpen(!modalOpen);
    setBalance("");
    setError(""); // Limpa os campos ao abrir/fechar o modal
  }, [modalOpen]);

  const handleInputChange = useCallback(event => {
    setBalance(event.target.value);
    setError(""); // Limpa o erro ao alterar o valor
  }, []);

  const handleUpdateBalance = useCallback(async () => {
    if (!balance || isNaN(balance) || parseFloat(balance) <= 0) {
      setError("Por favor, insira um saldo válido.");
      return;
    }

    try {
      await axios.put(`users/${userId}`, {
        firstBalance: parseFloat(balance)
      });
      toggleModal();
      callback(balance);
    } catch (error) {
      console.error("Não foi possível concluir a operação.");
      setError("Ocorreu um erro ao atualizar o saldo.");
    }
  }, [balance, userId, callback, toggleModal]);

  const openUpdateBalanceModal = useCallback(() => {
    toggleModal();
  }, [toggleModal]);

  const ModalComponent = () => (
    <Modal isOpen={modalOpen} toggle={toggleModal} centered backdrop="static">
      <ModalHeader toggle={toggleModal} className="text-center">
        <span className="fw-bold text-success">Depósito Seguro!</span>
      </ModalHeader>
      <ModalBody>
        <FormGroup>
          <Label for="balanceInput" className="text-center fw-bold">
            Informe o valor abaixo do depósito:
          </Label>
          <Input
            type="number"
            id="balanceInput"
            placeholder="R$ 0,00"
            value={balance}
            onChange={handleInputChange}
            className="text-center mt-2"
          />
          {error && <p className="text-danger mt-2">{error}</p>}
        </FormGroup>
        <div className="d-flex justify-content-around mt-4">
          {[30, 50, 100, 200].map(amount => (
            <Button
              key={amount}
              color="success"
              outline
              onClick={() => setBalance(amount.toString())}
              className="px-3"
            >
              R$ {amount},00
            </Button>
          ))}
        </div>
        <div className="text-center mt-4">
          <Button color="success" onClick={handleUpdateBalance}>
            Gerar Pix
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );

  return { openUpdateBalanceModal, ModalComponent };
};

export default useUpdateBalance;
