import React from "react";
import styles from "./IdCardBack.module.css";
import Logo from "../../Atoms/Logo/Logo";

const IdCardBack = ({ data, variant = "ecp" }) => {
  const { nisn, place_of_birth, date_of_birth, school_year, valid_until } =
    data || {};
  let variantClass = styles.bgEcp;
  let logoVariant = "white";

  if (variant === "ms") {
    variantClass = styles.bgMs;
    logoVariant = "white";
  } else if (variant === "hs") {
    variantClass = styles.bgHs;
    logoVariant = "blue";
  }

  const dobFormatted = date_of_birth
    ? new Date(date_of_birth).toLocaleDateString("en-GB")
    : "-";

  let validUntilStr = "-";
  if (valid_until) {
    validUntilStr = valid_until;
  } else if (school_year && school_year.includes("/")) {
    const years = school_year.split("/");
    if (years.length > 1) {
      validUntilStr = `June ${years[1]}`;
    }
  }

  return (
    <div className={`${styles.idCardBackBase} ${variantClass}`}>
      <div className={styles.contentWrapper}>
        <div className={styles.headerInfo}>
          <Logo
            variant={logoVariant}
            isCard={true}
            className={styles.logoSmall}
          />
          <div className={styles.addressText}>
            Jl. Walanda Maramis, Kolongan, North Minahasa 95371, North Sulawesi,
            Indonesia.
            <br />
            Telp: +62 (431) 892-252, 893-300; Fax +62 (431) 892-678
            <br />
            Email: Info@mis-mdo.sch.id
          </div>
        </div>

        {/* Data Siswa */}
        <div className={styles.studentDataGroup}>
          <div className={styles.dataRow}>
            <span className={styles.nisnLabel}>NISN:</span>
            <span className={styles.value}>{nisn || "-"}</span>
          </div>
          <div className={styles.dataRow}>
            <span className={styles.label}>Place, DOB:</span>
            <span className={styles.value}>
              {place_of_birth ? place_of_birth.toUpperCase() : "MANADO"},{" "}
              {dobFormatted}
            </span>
          </div>
        </div>

        <div className={styles.datesGroup}>
          <div>
            <span className={styles.label}>
              School Year Entry:
              <br />
            </span>
            <span className={styles.value}>{school_year || "-"}</span>
          </div>
          <div>
            <span className={styles.label}>
              Valid Until:
              <br />
            </span>
            <span className={styles.value}>{validUntilStr}</span>
          </div>
        </div>

        {/* Rules */}
        <div className={styles.rulesGroup}>
          <div className={styles.rulesTitle}>Usage of this ID card:</div>
          <ol className={styles.rulesList}>
            <li>
              Non-transferable. Possesion of this card by other than rightful
              owner is prohibited.
            </li>
            <li>Do not use this ID Card as means of Payment.</li>
            <li>Use this card to enter/leave the campus.</li>
            <li>
              Report loss or finding of this ID Card immediately to the
              register’s office.
            </li>
          </ol>
        </div>

        <div className={styles.disclaimer}>
          This ID Card is valid while the above printed name is still registered
          as bonafide student of Manado Independent School (MIS)
        </div>
      </div>
    </div>
  );
};

export default IdCardBack;
