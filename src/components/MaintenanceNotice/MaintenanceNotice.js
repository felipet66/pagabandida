import { SUPPORT_URL } from "config/support";
import React from "react";
import { FaTools } from "react-icons/fa";
import { Button, Modal, ModalBody, ModalFooter } from "reactstrap";

import logo from "assets/brand/pagabandida-emblema-verde-512.webp";
import { MaintenanceNoticeContext } from "contexts/MaintenanceNoticeContext";
import { Enviroments } from "enviroments/enviroments";

const MAINTENANCE_MESSAGE =
  "O Paga Bandida ficará temporariamente indisponível. Se precisar de ajuda, acesse o suporte do Paga Bandida.";

function MaintenanceNotice({ children }) {
  const maintenanceEnabled = Enviroments.MAINTENANCE_MODAL_ENABLED;

  const handleModalRef = modalElement => {
    if (modalElement) {
      modalElement.setAttribute(
        "aria-describedby",
        "maintenance-notice-description"
      );
    }
  };

  return (
    <MaintenanceNoticeContext.Provider
      value={{ maintenanceAcknowledged: !maintenanceEnabled }}
    >
      {children}
      <Modal
        isOpen={maintenanceEnabled}
        centered
        backdrop="static"
        keyboard={false}
        labelledBy="maintenance-notice-title"
        trapFocus
        innerRef={handleModalRef}
        className="maintenance-notice"
        contentClassName="maintenance-notice__content"
      >
        <ModalBody className="maintenance-notice__body">
          <img
            className="maintenance-notice__logo"
            src={logo}
            alt="Paga Bandida"
          />
          <span className="maintenance-notice__icon" aria-hidden="true">
            <FaTools />
          </span>
          <h2 id="maintenance-notice-title" className="maintenance-notice__title">
            Aplicativo temporariamente indisponível
          </h2>
          <p id="maintenance-notice-description" className="maintenance-notice__message">
            {MAINTENANCE_MESSAGE}
          </p>
        </ModalBody>
        <ModalFooter className="maintenance-notice__footer">
          <Button
            tag="a"
            color="primary"
            className="maintenance-notice__button"
            href={SUPPORT_URL}
            target="_blank"
            rel="noreferrer noopener"
          >
            Acessar suporte
          </Button>
        </ModalFooter>
      </Modal>
    </MaintenanceNoticeContext.Provider>
  );
}

export default MaintenanceNotice;
