// File: src/components/molecules/ConfirmBackPopup/ConfirmBackPopup.js

import React from "react";
import styles from "./PopUpBackConfirm.module.css";
import ReactDOM from "react-dom";
import Button from "../../../Atoms/Button/Button";

/**
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {function} props.onConfirm
 */
const ConfirmBackPopup = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Are you sure you want to go back?</h3>

        <p>
          You have unsaved progress. Leaving this page will discard all your
          progress. Are you sure you want to continue?
        </p>

        <div className={styles.modalActions}>
          <Button variant="solid" onClick={onConfirm}>
            Yes, I'm Sure
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmBackPopup;
