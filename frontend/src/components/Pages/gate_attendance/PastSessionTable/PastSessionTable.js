import React from "react";
import styles from "./PastSessionTable.module.css";
import ColumnHeader from "../../../atoms/columnHeader/ColumnHeader";

const PastSessionTable = () => {
  const pastSessionData = [
    {
      id: 1,
      date: "19 Sep 2025",
      checkedIn: "1432 Students",
      checkedOut: "1432 Students",
      status: "Ongoing",
    },
    {
      id: 2,
      date: "18 Sep 2025",
      checkedIn: "1432 Students",
      checkedOut: "1432 Students",
      status: "Ended",
    },
    {
      id: 3,
      date: "17 Sep 2025",
      checkedIn: "1432 Students",
      checkedOut: "1432 Students",
      status: "Ended",
    },
    {
      id: 4,
      date: "16 Sep 2025",
      checkedIn: "1432 Students",
      checkedOut: "1432 Students",
      status: "Ended",
    },
    {
      id: 5,
      date: "15 Sep 2025",
      checkedIn: "1432 Students",
      checkedOut: "1432 Students",
      status: "Ended",
    },
    {
      id: 6,
      date: "14 Sep 2025",
      checkedIn: "1432 Students",
      checkedOut: "1432 Students",
      status: "Ended",
    },
  ];

  const getStatusBadgeStyle = (status) => {
    if (status === "Ongoing") return styles.statusOngoing;
    return styles.statusEnded;
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <ColumnHeader
          title="Date"
          hasSort={true}
        />
        <ColumnHeader
          title="Checked-In"
          hasSort={true}
        />
        <ColumnHeader
          title="Checked-Out"
          hasSort={true}
        />
        <ColumnHeader
          title="Status"
          hasSort={true}
          hasFilter={true}
        />
      </div>

      <div className={styles.tableBody}>
        {pastSessionData.map((row) => (
          <div key={row.id} className={styles.tableRow}>
            <div className={styles.tableCell}>{row.date}</div>
            <div className={styles.tableCell}>{row.checkedIn}</div>
            <div className={styles.tableCell}>{row.checkedOut}</div>
            <div className={styles.tableCell}>
              <div className={`${styles.statusBadge} ${getStatusBadgeStyle(row.status)}`}>
                {row.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PastSessionTable;