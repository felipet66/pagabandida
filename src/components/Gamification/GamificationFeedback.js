import React from "react";
import { Button, Modal, ModalBody, ModalFooter } from "reactstrap";
import AchievementIcon from "./AchievementIcon";
import "./Gamification.css";

export const weakDevice = () => (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory > 0 && navigator.deviceMemory <= 4);

export default function GamificationFeedback({ toast, celebration, onClose, enabled = true }) {
  return <>
    {enabled && toast && <div className="gamification-toast" role="status" aria-live="polite" aria-atomic="true">+{toast.xp} XP · {toast.reason}</div>}
    <Modal isOpen={Boolean(enabled && celebration)} toggle={onClose} centered fade={false} trapFocus returnFocusAfterClose
      labelledBy="gamification-celebration-title" className={`gamification-celebration${weakDevice() ? " gamification-static" : ""}`}>
      <ModalBody>
        <div className="gamification-celebration__seal" aria-hidden="true"><AchievementIcon name={celebration?.icon} size={48} /></div>
        <span className="gamification-eyebrow">Seu progresso</span>
        <h2 id="gamification-celebration-title">{celebration?.title}</h2>
        <p>{celebration?.text}</p>
      </ModalBody>
      <ModalFooter><Button color="primary" onClick={onClose}>Fechar</Button></ModalFooter>
    </Modal>
  </>;
}
