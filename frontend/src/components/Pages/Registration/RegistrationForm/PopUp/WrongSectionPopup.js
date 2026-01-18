import React from "react";
import styles from "./WrongSectionPopup.module.css"; // Kita akan buat file CSS ini di langkah berikutnya
import Button from "../../../../Atoms/Button/Button";

const WrongSectionPopup = ({ onClose }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.iconWrapper}>
          {/* Icon can be an SVG or an emoji */}
          ⚠️
        </div>
        <h3 className={styles.title}>Incorrect Registration Status</h3>
        <p className={styles.message}>
          This student is being registered in a new section. Please use the
          'New' student status for this registration.
        </p>
        <Button
          className={styles.closeButton}
          onClick={onClose}
          variant="solid"
        >
          Understood
        </Button>
      </div>
    </div>
  );
};

export default WrongSectionPopup;
