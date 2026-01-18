import React from 'react';
import styles from './SignatureContent.module.css';

function SignatureContent({ data }) {
  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };

    return new Intl.DateTimeFormat('en-GB', options).format(date);
  };

  return (
    <div className={styles.signature}>
      <div className={styles.studentNameAndSignature}>
        <div className={styles.txtDate}>
          <div className={styles.date}>Date:</div>
          <b className={styles.contentDate}>
            {formatDate(data.registration_date)}
          </b>
        </div>
        <div className={styles.txtStudentNameAndSignature}>
          <div className={styles.studentName}>{`Student name & signature`}</div>
        </div>
      </div>
      <div className={styles.parentGuardianSignature}>
        <div className={styles.txtAcknowledgeBy}>
          <div className={styles.studentName}>Acknowledge by:</div>
        </div>
        <div className={styles.txtStudentNameAndSignature}>
          <div
            className={styles.studentName}
          >{`Parent / Guardian's name & signature`}</div>
        </div>
      </div>
    </div>
  );
}

export default SignatureContent;

