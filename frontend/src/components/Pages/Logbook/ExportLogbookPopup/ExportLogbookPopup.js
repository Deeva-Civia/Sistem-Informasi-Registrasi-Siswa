import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import styles from "./ExportLogbookPopup.module.css";
import placeholder from "../../../../assets/user.svg";

const loadImage = (url) =>
  new Promise((resolve) => {
    if (!url || url === placeholder) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      try {
        // PERBAIKAN 1: Ganti jpeg ke png agar transparansi tetap terjaga (background putih/kertas)
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      } catch (e) {
        console.error(
          "Gagal konversi canvas ke DataURL (mungkin Tainted Canvas / CORS):",
          url,
          e
        );
        resolve(null);
      }
    };
    img.onerror = (err) => {
      console.error("Gagal me-load gambar dari URL:", url, err);
      resolve(null);
    };
    try {
      img.src = url;
    } catch (e) {
      console.error("Error saat set img.src (URL tidak valid?):", url, e);
      resolve(null);
    }
  });

const HEADER_KEY_MAP = {
  Photo: "photo_url",
  "Student ID": "student_id",
  "Full Name": "full_name",
  Grade: "grade",
  Section: "section",
  "School Year": "school_year",
  Gender: "gender",
  "Registration Date": "registration_date",
  Transportation: "transportation",
  NISN: "nisn",
  "Family Rank": "family_rank",
  "Place DOB": "place_dob",
  Age: "age",
  Religion: "religion",
  Country: "country",
  Address: "address",
  Phone: "phone",
  "Father Name": "father_name",
  "Father Occupation": "father_occupation",
  "Father Phone": "father_phone",
  "Mother Name": "mother_name",
  "Mother Occupation": "mother_occupation",
  "Mother Phone": "mother_phone",
  NIK: "nik",
  KITAS: "kitas",
};
// ---------------------------------------------

const ExportLogbookPopup = ({
  isOpen,
  onClose,
  columns,
  selectedColumns,
  // BARU: Terima fungsi fetch dan status loading dari parent
  fetchFullData,
  isExportLoading,
  currentFilters,
}) => {
  // --- STATE (HOOK) ---
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewData, setPreviewData] = useState([]); // Data lengkap untuk export
  const [dataLoaded, setDataLoaded] = useState(false);

  // --- LOGIKA UTAMA: Muat data export saat popup dibuka ---
  useEffect(() => {
    // Hanya memuat jika popup terbuka, data belum dimuat, dan tidak sedang loading dari parent
    if (isOpen && !dataLoaded && !isExportLoading) {
      fetchFullData()
        .then((data) => {
          setPreviewData(data);
          setDataLoaded(true);
        })
        .catch((err) => {
          // Tampilkan pesan error jika fetch gagal
          console.error("Gagal memuat data export di popup:", err);
          setPreviewData([]);
          setDataLoaded(true);
        });
    }

    if (!isOpen) {
      // Reset state saat popup ditutup
      setPreviewData([]);
      setDataLoaded(false);
    }
  }, [isOpen, dataLoaded, isExportLoading, fetchFullData]);

  // --- Kalkulasi ---
  const selectedColumnsForPreview = columns.filter((column) =>
    selectedColumns.has(column)
  );
  const hasSelectedColumns = selectedColumnsForPreview.length > 0;

  // Gunakan previewData sebagai sumber data utama untuk PDF
  const logbookData = previewData;

  // Tentukan status loading (Deklarasi ini harus hanya satu kali)
  const currentLoading = isExportLoading || (isOpen && !dataLoaded);

  // --- FUNGSI DOWNLOAD (HOOK) ---
  const handleDownloadPDF = useCallback(async () => {
    if (
      !hasSelectedColumns ||
      isDownloading ||
      !dataLoaded ||
      logbookData.length === 0
    )
      return;

    setIsDownloading(true);

    try {
      // 1. Definisikan Warna
      const globalColors = {
        mainText: [0, 0, 0],
        mainGrey: [0, 0, 0],
        secondaryBg: [255, 255, 255],
      };

      // 2. Siapkan Kolom & Header
      // Kita filter kolom yang dipilih (kecuali School Year karena sudah ada di judul)
      const columnsForPDFTable = columns.filter(
        (column) => selectedColumns.has(column) && column !== "School Year"
      );
      const tableHeaders = ["No.", ...columnsForPDFTable];
      const photoColIndex = tableHeaders.indexOf("Photo");

      // 3. Load semua gambar
      const loadedImages = await Promise.all(
        logbookData.map((student) =>
          loadImage(student[HEADER_KEY_MAP["Photo"]])
        )
      );

      // 4. Siapkan Data Tabel
      const tableData = logbookData.map((student, index) => {
        const row = [index + 1];
        columnsForPDFTable.forEach((column) => {
          if (column === "Photo") {
            row.push(null);
          } else {
            const dataKey = HEADER_KEY_MAP[column];
            const cellData =
              student[dataKey] === null || student[dataKey] === undefined
                ? "-"
                : String(student[dataKey]);
            row.push(cellData);
          }
        });
        return row;
      });

      // 5. Inisialisasi Dokumen PDF
      const doc = new jsPDF("landscape", "mm", [210, 330]);
      const margin = 7;
      const firstStudent = logbookData.length > 0 ? logbookData[0] : null;
      const schoolYear = firstStudent ? firstStudent.school_year : "N/A";
      const titleText = `Student Logbook (School Year: ${schoolYear})`;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(
        globalColors.mainText[0],
        globalColors.mainText[1],
        globalColors.mainText[2]
      );
      doc.text(titleText, margin, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const now = new Date();
      const createdDate = `Created: ${now
        .getDate()
        .toString()
        .padStart(2, "0")}/${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${now.getFullYear()} ${now
        .getHours()
        .toString()
        .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
      doc.text(createdDate, margin, 22);
      const colCount = columnsForPDFTable.length;

      let dynamicImgHeight = 12;
      let dynamicFontSize = 4;

      if (colCount <= 5) {
        dynamicImgHeight = 24;
        dynamicFontSize = 12;
      } else if (colCount <= 9) {
        dynamicImgHeight = 18;
        dynamicFontSize = 9;
      } else if (colCount <= 14) {
        dynamicImgHeight = 14;
        dynamicFontSize = 6;
      } else {
        dynamicImgHeight = 12;
        dynamicFontSize = 4;
      }

      const fixedImgHeight = dynamicImgHeight;
      const aspectRatio = 59.97 / 81;
      const globalCellPadding = 2.5;
      const fixedImgWidth = fixedImgHeight * aspectRatio;
      const photoCellWidth = fixedImgWidth + globalCellPadding * 2;
      const photoCellHeight = fixedImgHeight + globalCellPadding * 2;

      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 28,
        margin: { left: margin, right: margin },
        theme: "grid",
        rowPageBreak: "auto",
        styles: {
          font: "helvetica",
          fontSize: dynamicFontSize,
          cellPadding: globalCellPadding,
          textColor: globalColors.mainText,
          lineColor: globalColors.mainGrey,
          lineWidth: 0.2,
          valign: "middle",
          minCellHeight: 1,
        },
        headStyles: {
          fontSize: dynamicFontSize,
          fillColor: globalColors.secondaryBg,
          textColor: globalColors.mainText,
          halign: "middle",
          minCellHeight: 7,
        },
        bodyStyles: {
          halign: "left",
        },
        columnStyles: {
          [photoColIndex]: {
            cellWidth: photoCellWidth,
            minCellHeight: photoCellHeight,
            halign: "center",
          },
        },

        willDrawCell: (data) => {
          if (
            photoColIndex !== -1 &&
            data.column.index === photoColIndex &&
            data.cell.section === "body"
          ) {
            data.cell.text = [];
          }
        },

        didDrawCell: (data) => {
          if (
            photoColIndex !== -1 &&
            data.column.index === photoColIndex &&
            data.cell.section === "body"
          ) {
            const cellHeight = data.cell.height;
            const cellWidth = data.cell.width;
            const imgData = loadedImages[data.row.index];

            if (imgData) {
              const imgHeight = fixedImgHeight; // Menggunakan nilai dinamis
              const imgWidth = fixedImgWidth; // Menggunakan nilai dinamis

              // Center gambar di dalam sel
              const x = data.cell.x + (cellWidth - imgWidth) / 2;
              const y = data.cell.y + (cellHeight - imgHeight) / 2;

              try {
                // PERBAIKAN 2: Gunakan format PNG saat menambahkan ke PDF
                doc.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
                const originalDrawColor = doc.getDrawColor();
                const originalLineWidth = doc.getLineWidth();
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.2);
                doc.rect(x, y, imgWidth, imgHeight);
                doc.setDrawColor(originalDrawColor);
                doc.setLineWidth(originalLineWidth);
              } catch (e) {
                console.error("Gagal menambah gambar ke PDF:", e);
                doc.text(
                  "X",
                  data.cell.x + cellWidth / 2,
                  data.cell.y + cellHeight / 2,
                  { halign: "center", valign: "middle" }
                );
              }
            } else {
              doc.text(
                "-",
                data.cell.x + cellWidth / 2,
                data.cell.y + cellHeight / 2,
                { halign: "center", valign: "middle" }
              );
            }
          }
        },
      });

      // --- Logika Nomor Halaman ---
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width - margin,
          doc.internal.pageSize.height - 5,
          { align: "right" }
        );
      }

      const fileName = `Student_Logbook_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("Gagal membuat PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [
    columns,
    selectedColumns,
    logbookData,
    hasSelectedColumns,
    isDownloading,
    dataLoaded,
  ]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <h2 className={styles.title}>Export Student Logbook</h2>
        </div>

        <div className={styles.content}>
          {currentLoading ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                fontStyle: "italic",
                color: "#7a7a7a",
                minHeight: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f9f9f9",
                borderRadius: "8px",
              }}
            >
              Memuat **semua** data logbook sesuai filter. Mohon tunggu...
            </div>
          ) : hasSelectedColumns ? (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.headerCell}>No.</th>
                    {selectedColumnsForPreview.map((column) => (
                      <th key={column} className={styles.headerCell}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Tampilkan maksimal 10 baris di preview untuk menghindari crash */}
                  {logbookData.slice(0, 10).map((student, index) => (
                    <tr key={student.student_id}>
                      <td className={styles.dataCell}>{index + 1}</td>
                      {selectedColumnsForPreview.map((column) => {
                        const dataKey = HEADER_KEY_MAP[column];
                        if (column === "Photo") {
                          return (
                            <td key={column} className={styles.photoCell}>
                              <img
                                src={student[dataKey] || placeholder}
                                alt={student.full_name}
                                className={styles.studentPhoto}
                              />
                            </td>
                          );
                        }
                        return (
                          <td key={column} className={styles.dataCell}>
                            {student[dataKey] || "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {logbookData.length > 10 && (
                    <tr>
                      <td
                        colSpan={selectedColumnsForPreview.length + 1}
                        className={styles.messageCell}
                        style={{
                          textAlign: "center",
                          fontStyle: "italic",
                          backgroundColor: "#f0f0f0",
                        }}
                      >
                        ... dan {logbookData.length - 10} data lainnya
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                fontStyle: "italic",
                color: "#7a7a7a",
                minHeight: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f9f9f9",
                borderRadius: "8px",
              }}
            >
              Please select at least one column first to see the preview.
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.buttonGroup}>
            <button
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isDownloading || currentLoading}
            >
              Cancel
            </button>

            <button
              className={styles.downloadButton}
              onClick={handleDownloadPDF}
              disabled={
                !hasSelectedColumns ||
                isDownloading ||
                currentLoading ||
                logbookData.length === 0
              }
            >
              {isDownloading
                ? "Generating PDF..."
                : currentLoading
                ? "Loading Data..."
                : "Download PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExportLogbookPopup;
