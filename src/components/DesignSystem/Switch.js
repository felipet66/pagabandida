import React from "react";

export default function Switch({ checked, onChange, label, disabled = false, className = "", ...props }) {
  return <button {...props} type="button" role="switch" aria-checked={Boolean(checked)} disabled={disabled}
    className={`ds-switch ${className}`.trim()} onClick={() => onChange?.(!checked)}>
    <span className="ds-switch__track" aria-hidden="true"><span className="ds-switch__thumb" /></span>
    <span className="ds-switch__label">{label}</span>
  </button>;
}
