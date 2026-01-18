import React from "react";
import ReactDOM from "react-dom";
import styles from "./PopUpConfirmUpdate.module.css";
import Button from "../../../Atoms/Button/Button";

const ConfirmUpdatePopup = ({ isOpen, onClose, onConfirm, isUpdating }) => {
  if (!isOpen) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className={styles.popupOverlay}>
      <div className={styles.popupContent}>
        <div className={styles.title}>Confirm Student Update Information</div>
        <div className={styles.messageContainer}>
          <p>
            Please double-check that all the information you've entered is
            correct.
          </p>
          <p>Once submitted, changes may not be possible.</p>
        </div>
        <div className={styles.confirmationText}>
          Are you sure you want to continue?
        </div>
        <div className={styles.buttonGroup}>
          <Button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isUpdating}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={isUpdating}
            variant="solid"
          >
            {isUpdating ? "Saving..." : "Yes, I'm sure"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmUpdatePopup;
