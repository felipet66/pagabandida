import React, { useEffect, useId, useRef, useState } from "react";
import "./SelectField.css";
import { Check, ChevronDown } from "lucide-react";
import Icon from "components/DesignSystem/Icon";

export default function SelectField({ id, label, value, options, onChange, disabled = false, describedBy, designSystem = false }) {
  const uid = useId();
  const listId = `${uid}-options`;
  const trigger = useRef(null);
  const container = useRef(null);
  const optionRefs = useRef([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value));
  const show = () => { setActive(selectedIndex); setOpen(true); };
  const close = () => { setOpen(false); trigger.current?.focus(); };
  const choose = option => { onChange(option.value); close(); };
  useEffect(() => { if (open) optionRefs.current[active]?.focus(); }, [open, active]);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!container.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  const navigate = event => {
    if (event.key === "Escape") { event.preventDefault(); close(); }
    else if (event.key === "Tab") setOpen(false);
    else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      setActive(index => event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 :
        (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    }
  };
  return (
    <div className="app-select" ref={container} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <button id={id} ref={trigger} type="button" className="app-select__trigger" role="combobox" aria-label={label}
        aria-expanded={open} aria-controls={listId} aria-haspopup="listbox" aria-describedby={describedBy} disabled={disabled}
        onClick={() => open ? close() : show()} onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(); }
        }}>
        <span>{options[selectedIndex]?.label}</span>{designSystem ? <Icon as={ChevronDown} size={16} /> : <i className="fas fa-chevron-down" aria-hidden="true" />}
      </button>
      {open && <div id={listId} className="app-select__options" role="listbox" aria-label={label} onKeyDown={navigate}>
        {options.map((option, index) => <button type="button" role="option" aria-selected={value === option.value}
          tabIndex={index === active ? 0 : -1} ref={element => { optionRefs.current[index] = element; }} key={String(option.value)}
          onClick={() => choose(option)} className={value === option.value ? "is-selected" : undefined}>
          <span>{option.label}</span>{value === option.value && (designSystem ? <Icon as={Check} size={16} /> : <i className="fas fa-check" aria-hidden="true" />)}
        </button>)}
      </div>}
    </div>
  );
}
