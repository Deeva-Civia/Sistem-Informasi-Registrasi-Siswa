import React from "react";
import "./Checkbox.css";

const Checkbox = ({ checked, onChange, name, readOnly = false }) => (
  <label className={`atom-checkbox ${readOnly ? 'read-only' : ''}`}>
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={onChange} 
      name={name}
      disabled={readOnly}
    />
    <span className="custom-checkbox"></span>
  </label>
);

export default Checkbox;