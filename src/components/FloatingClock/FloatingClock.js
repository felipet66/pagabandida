import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./FloatingClock.css";

const clamp = (position, element) => ({
  x: Math.max(8, Math.min(position.x, (document.documentElement.clientWidth || window.innerWidth) - (element?.offsetWidth || 130) - 8)),
  y: Math.max(8, Math.min(position.y, window.innerHeight - (element?.offsetHeight || 60) - 88)),
});
export default function FloatingClock({ designSystem = false }) {
  const [now, setNow] = useState(() => new Date());
  const [position, setPosition] = useState(() => clamp({ x: window.innerWidth - 146, y: window.innerHeight - 160 }));
  const element = useRef(null);
  const drag = useRef(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    const resize = () => setPosition(previous => clamp(previous, element.current));
    resize();
    window.addEventListener("resize", resize);
    return () => { clearInterval(timer); window.removeEventListener("resize", resize); };
  }, []);
  return createPortal(
    <button type="button" className={`floating-clock${designSystem ? " floating-clock--catalog" : ""}`} ref={element} style={{ left: position.x, top: position.y }}
      aria-label="Relógio de Brasília. Arraste para mover ou use as setas do teclado." onPointerDown={event => {
        if (event.button !== 0) return;
        drag.current = { x: event.clientX - position.x, y: event.clientY - position.y, id: event.pointerId };
        event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerMove={event => {
        if (drag.current?.id !== event.pointerId) return;
        setPosition(clamp({ x: event.clientX - drag.current.x, y: event.clientY - drag.current.y }, element.current));
      }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
      onKeyDown={event => {
        const steps = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };
        if (!steps[event.key]) return;
        event.preventDefault();
        const [x, y] = steps[event.key]; setPosition(previous => clamp({ x: previous.x + x, y: previous.y + y }, element.current));
      }}>
      <span><i className="far fa-clock" aria-hidden="true" /> Brasília <i className="fas fa-grip-vertical" aria-hidden="true" /></span>
      <time>{now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hourCycle: "h23" })}</time>
    </button>, document.body);
}
