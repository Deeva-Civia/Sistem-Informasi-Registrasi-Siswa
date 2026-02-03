import React, { useState, useEffect } from "react";
import styles from "./OtherDetailSection.module.css";

const OtherDetailSection = ({ onDataChange, prefill = {} }) => {
  const [studentRequirementStatus, setStudentRequirementStatus] = useState(
    prefill.student_requirement_status || "complete"
  );
  const [incompleteDocuments, setIncompleteDocuments] = useState(
    prefill.incomplete_documents || ""
  );

  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        student_requirement_status: studentRequirementStatus,
        incomplete_documents: incompleteDocuments,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    setStudentRequirementStatus(prefill.student_requirement_status || "complete");
    setIncompleteDocuments(prefill.incomplete_documents || "");
  }, [prefill]);

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStudentRequirementStatus(newStatus); 

    let currentDocs = incompleteDocuments;

    if (newStatus === "complete") {
      setIncompleteDocuments(""); 
      currentDocs = "";
    }

    if (onDataChange) {
      onDataChange({
        student_requirement_status: newStatus,
        incomplete_documents: currentDocs,
      });
    }
  };

  const handleDocsChange = (e) => {
    const newDocs = e.target.value;
    setIncompleteDocuments(newDocs); 

    if (onDataChange) {
      onDataChange({
        student_requirement_status: studentRequirementStatus,
        incomplete_documents: newDocs,
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.officeUseNote}>
        <div className={styles.sectionHeader}>
          <span className={styles.headerText}>DATA FOR OFFICE USE ONLY</span>
        </div>
        <div className={styles.contentWrapper}>
          <div className={styles.statusSection}>
            <div className={styles.statusLabel}>
              Student Requirement Status:
            </div>
            <div className={styles.statusOptions}>
              <div className={styles.optionItem}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="studentRequirementStatus"
                    value="complete"
                    checked={studentRequirementStatus === "complete"}
                    onChange={handleStatusChange}
                    className={styles.hiddenRadio}
                  />
                  <div className={styles.radioButton}>
                    <div className={styles.radioButtonCircle} />
                    {studentRequirementStatus === "complete" && (
                      <div className={styles.radioButtonSelected} />
                    )}
                  </div>
                  <div className={styles.label}>Complete</div>
                </label>
              </div>
              <div className={styles.optionItem}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="studentRequirementStatus"
                    value="incomplete"
                    checked={studentRequirementStatus === "incomplete"}
                    onChange={handleStatusChange}
                    className={styles.hiddenRadio}
                  />
                  <div className={styles.radioButton}>
                    <div className={styles.radioButtonCircle} />
                    {studentRequirementStatus === "incomplete" && (
                      <div className={styles.radioButtonSelected} />
                    )}
                  </div>
                  <div className={styles.label}>Incomplete</div>
                </label>
              </div>
            </div>
          </div>

          {studentRequirementStatus === "incomplete" && (
            <div className={styles.documentsSection}>
              <div className={styles.documentsLabel}>Incomplete documents:</div>
              <div className={styles.documentsInput}>
                <textarea
                  className={styles.textareaField}
                  placeholder="Enter incomplete documents"
                  value={incompleteDocuments}
                  onChange={handleDocsChange}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtherDetailSection;