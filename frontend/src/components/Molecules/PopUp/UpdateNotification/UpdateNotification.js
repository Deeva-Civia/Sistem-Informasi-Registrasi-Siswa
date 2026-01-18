import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import styles from "./UpdateNotification.module.css";

const UpdatedNotification = ({ isOpen, onClose, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className={styles.popupOverlay}>
      <div className={styles.notificationContent}>
        <svg className={styles.checkmarkIcon} viewBox="0 0 52 52">
          <circle
            className={styles.checkmarkCircle}
            cx="26"
            cy="26"
            r="25"
            fill="none"
          />
          <path
            className={styles.checkmarkCheck}
            fill="none"
            d="M14.1 27.2l7.1 7.2 16.7-16.8"
          />
        </svg>
        <div className={styles.message}>{message || "Update Successfully"}</div>
      </div>
    </div>,
    document.body
  );
};

export default UpdatedNotification;
