import React from "react";
import "./RadioButton.css";

const RadioButton = ({ name, value, checked, onChange, readOnly = false }) => (
  <label className={`atom-radio-button ${readOnly ? 'read-only' : ''}`}>
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      disabled={readOnly}
    />
    <span className="custom-radio"></span>
  </label>
);

export default RadioButton;