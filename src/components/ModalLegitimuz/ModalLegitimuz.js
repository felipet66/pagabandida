import { SUPPORT_URL } from "config/support";
import React from "react";
import { Modal, ModalBody, Button } from "reactstrap";

const LegitimuzModal = ({ isOpen, toggle, iframeId }) => {
  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      centered
      className="modal-deposit h-100"
      backdrop="static"
      fade
    >
      <div className="modal-content position-relative h-100 modal-deposit">
        <Button
          type="button"
          className="btn-sm btn-close position-absolute top-0 end-0 m-1 p-2"
          onClick={toggle}
          aria-label="Close"
        >
          X
        </Button>
        <div className="p-2 d-flex flex-column justify-content-center align-itens-center">
          <p className="text-default text-center">
            <strong>
              É necessário fazer a verificação da sua conta para utilizar o
              aplicativo. Por favor, escaneie o documento abaixo!
            </strong>
          </p>{" "}
          <p className="text-default text-center">
            <strong>Em caso de dúvidas, clique em "SUPORTE".</strong>
          </p>
          <a
            href={SUPPORT_URL}
            size="sm"
            target="_blank"
            className="btn btn-sm"
          >
            Suporte
          </a>
        </div>
        <ModalBody className="position-relative h-100 px-0 py-4 m-0 modal-deposit">
          <iframe
            id="legitimuz-iframe"
            width="100%"
            height="100%"
            frameBorder="0"
            allow="camera;microphone;clipboard-write"
            src={`https://widget.legitimuz.com/${iframeId}?lang=pt`}
            data-legitimuz-feature="ocr"
            data-open="true"
            style={{ height: "100vh", border: "none" }}
          ></iframe>
        </ModalBody>
      </div>
    </Modal>
  );
};

export default LegitimuzModal;
