import React from "react";
import "../../Styles/Controls.css";
import dragIcon from "../../../assets/DragHandle.svg";

// Terima 'listeners' dari dnd-kit
const DragHandle = ({ listeners }) => (
  // Sebarkan 'listeners' ke button
  <button
    type="button"
    className="control-btn"
    aria-label="Drag to reorder column"
    {...listeners}
  >
    <img src={dragIcon} alt="Drag Handle" width="12" height="18" />
  </button>
);

export default DragHandle;

