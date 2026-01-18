import React from "react";
import styles from "./DuplicateStudentPopup.module.css";
import Button from "../../../../Atoms/Button/Button";

const DuplicateStudentPopup = ({ onClose }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.iconWrapper}>
       
          ⚠️
        </div>
        <h3 className={styles.title}>Student Already Exists</h3>
        <p className={styles.message}>
          Please select "Old" status and input the student's name.
        </p>
        <Button  onClick={onClose} variant="solid" type="button">
          Understood
        </Button>
      </div>
    </div>
  );
};

export default DuplicateStudentPopup;
