import React from "react";
import styles from "./OtherDetailContent.module.css";
import RadioButton from "../../../Atoms/Radiobutton/RadioButton";

function OtherDetail_Content({ data }) {
  const status = data?.student_requirement_status || "";

  return (
    <div className={styles.otherDetail}>
      <div className={styles.officeUseNote}>
        <div className={styles.header}>
          <b className={styles.heading}>DATA FOR OFFICE USE ONLY</b>
        </div>
        <div className={styles.content}>
          <div className={styles.txtSrs}>
            <div className={styles.studentRequirementStatus}>
              Student Requirement Status:
            </div>
          </div>
          {/* [MODIFIED] Mengganti div statis dengan komponen RadioButton */}
          <div className={styles.status}>
            <div className={styles.choice}>
              <RadioButton
                name="requirement_status_print"
                value="complete"
                checked={status === "complete"}
                onChange={() => {}} // Handler kosong karena read-only
                readOnly={true}
              />
              <div className={styles.complete1}>Complete</div>
            </div>
            <div className={styles.choice}>
              <RadioButton
                name="requirement_status_print"
                value="incomplete"
                checked={status === "incomplete"}
                onChange={() => {}} // Handler kosong karena read-only
                readOnly={true}
              />
              <div className={styles.complete1}>Incomplete</div>
            </div>
          </div>
          <div className={styles.note}>
            <div className={styles.txtIcDocs}>
              <div className={styles.incompleteDocuments}>
                Incomplete documents:
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.approvedBy}>
        <div className={styles.txtApprovedBy}>
          <div className={styles.approvedBy1}>Approved by:</div>
        </div>
        <div className={styles.principal}>
          <div className={styles.approvedBy1}>Principal:</div>
        </div>
        <div className={styles.principal}>
          <div className={styles.approvedBy1}>Business Manager:</div>
        </div>
        <div className={styles.principal}>
          <div className={styles.approvedBy1}>Register:</div>
        </div>
      </div>
    </div>
  );
}

export default OtherDetail_Content;
