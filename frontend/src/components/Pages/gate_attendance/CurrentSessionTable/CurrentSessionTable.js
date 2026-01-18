import React from "react";
import styles from "./CurrentSessionTable.module.css";
import ColumnHeader from "../../../atoms/columnHeader/ColumnHeader";

const CurrentSessionTable = () => {
  const sessionData = [
    {
      id: 1,
      name: "Jerry Marten Koupundfsfsfsdfsdf",
      grade: "11",
      section: "HS",
      checkIn: "08:00 AM",
      checkOut: "04:00 PM",
      entryStatus: "Present",
      exitStatus: "Checked-out",
    },
    {
      id: 2,
      name: "Jerry Marten Koupundfsfsfsdfsdf",
      grade: "12",
      section: "HS",
      checkIn: "08:00 AM",
      checkOut: "02:00 PM",
      entryStatus: "Present",
      exitStatus: "Early Leave",
    },
    {
      id: 3,
      name: "Jerry Marten Koupundfsfsfsdfsdf",
      grade: "12",
      section: "HS",
      checkIn: "08:00 AM",
      checkOut: "-",
      entryStatus: "Present",
      exitStatus: "Not checked-out",
    },
    {
      id: 4,
      name: "Given Pantaw Koupundfsfsfsdfsdf",
      grade: "12",
      section: "HS",
      checkIn: "08:10 AM",
      checkOut: "04:00 PM",
      entryStatus: "Late",
      exitStatus: "Checked-out",
    },
    {
      id: 5,
      name: "Given Pantaw Koupundfsfsfsdfsdf",
      grade: "12",
      section: "HS",
      checkIn: "09:00 AM",
      checkOut: "03:00 PM",
      entryStatus: "Late",
      exitStatus: "Early Leave",
    },
    {
      id: 6,
      name: "Given Pantaw Koupundfsfsfsdfsdf",
      grade: "12",
      section: "HS",
      checkIn: "09:00 AM",
      checkOut: "-",
      entryStatus: "Late",
      exitStatus: "Not checked-out",
    },
  ];

  const getEntryColor = (status) => {
    if (status === "Present") return styles.textGreen;
    if (status === "Late") return styles.textOrange;
    return styles.textRed;
  };

  const getExitColor = (status) => {
    if (status === "Checked-out") return styles.textGreen;
    if (status === "Early Leave") return styles.textOrange;
    return styles.textRed;
  };

  return (
    <div className={styles.tableContainer}>
      {/* --- TABLE HEADER --- */}
      <div className={styles.tableHeader}>
        <ColumnHeader
          title="Student Name"
          hasSort={true}
          hasFilter={true}
        />
        <ColumnHeader
          title="Grade"
          hasSort={true}
          hasFilter={true}
        />
        <ColumnHeader
          title="Section"
          hasSort={true}
          hasFilter={true}
        />
        <ColumnHeader
          title="Check-In"
          hasSort={true}
        />
        <ColumnHeader
          title="Check-Out"
          hasSort={true}
        />
        <ColumnHeader
          title="Entry"
          hasSort={true}
          hasFilter={true}
        />
        <ColumnHeader
          title="Exit"
          hasSort={true}
          hasFilter={true}
        />
      </div>

      <div className={styles.tableBody}>
        {sessionData.map((row) => (
          <div key={row.id} className={styles.tableRow}>
            <div className={styles.tableCell} title={row.name}>
              {row.name}
            </div>
            <div className={styles.tableCell}>{row.grade}</div>
            <div className={styles.tableCell}>{row.section}</div>
            <div className={styles.tableCell}>{row.checkIn}</div>
            <div className={styles.tableCell}>{row.checkOut}</div>
            <div className={`${styles.tableCell} ${getEntryColor(row.entryStatus)}`}>
              <strong>{row.entryStatus}</strong>
            </div>
            <div className={`${styles.tableCell} ${getExitColor(row.exitStatus)}`}>
              <strong>{row.exitStatus}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrentSessionTable;