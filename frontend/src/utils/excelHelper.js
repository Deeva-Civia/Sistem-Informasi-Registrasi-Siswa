import * as XLSX from "xlsx-js-style";

export const generateExcelReport = (tableData, contextTitle = "Data Ekspor", totalCount = 0, isDailyReport = false) => {
    if (!tableData) return;

    const workbook = XLSX.utils.book_new();
    const safeTitle = contextTitle.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "_").substring(0, 35);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `MISmart_${safeTitle}_${dateStr}.xlsx`;

    let summaryData = null;
    let detailsData = null;
    let comparativeTable = null;

    // ==========================================
    // 1. DATA EXTRACTION
    // ==========================================
    const extractFromMatrix = (matrix) => {
        if (Array.isArray(matrix) && matrix.length >= 2 && Array.isArray(matrix[0]) && Array.isArray(matrix[1])) {
            if (matrix[0].length > 0 && (matrix[0][0].Kategori !== undefined || matrix[0][0].kategori !== undefined)) {
                summaryData = matrix[0];
                detailsData = matrix[1];
                if (matrix.length > 2 && Array.isArray(matrix[2])) {
                    comparativeTable = matrix[2];
                }
            }
        }
    };

    if (Array.isArray(tableData)) {
        extractFromMatrix(tableData);
    } else if (typeof tableData === 'object' && tableData !== null) {
        if (tableData.data) extractFromMatrix(tableData.data);
        else if (tableData.table_1) extractFromMatrix(tableData.table_1);
        
        if (tableData.table_2) comparativeTable = tableData.table_2;
    }

    if (summaryData && detailsData) {
        // ==========================================
        // 2. SETUP BASE COLUMNS & HEADERS
        // ==========================================
        const allKeys = Object.keys(detailsData[0] || {});
        const baseColumns = [];
        const baseHeaders = ["No."];

        if (allKeys.includes("registration_date")) {
            baseColumns.push("registration_date");
            baseHeaders.push("Reg Date");
        }

        baseColumns.push("student_id", "full_name");
        baseHeaders.push("Student ID", "Name of students"); 

        if (allKeys.includes("grade")) {
            baseColumns.push("grade");
            baseHeaders.push("Grade");
        }

        // ==========================================
        // 3. SETUP MATRIX CRITERIA
        // ==========================================
        let orderedCriteria = summaryData.map(item => ({
            category: item.Kategori || item.kategori,
            criteria: item.Kriteria || item.kriteria
        }));

        orderedCriteria = orderedCriteria.filter(col => String(col.category).toLowerCase() !== "grade");

        const formatHeader = (str) => str.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        const formatDate = (dateString) => {
            if (!dateString) return "";
            const datePart = String(dateString).split(' ')[0];
            const parts = datePart.split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
            return dateString;
        };

        const currentTotal = isDailyReport ? detailsData.length : (totalCount || detailsData.length);
        const aoaData = [
            [`Total Data: ${currentTotal}`],
            []
        ];

        const criteriaTotals = Array(orderedCriteria.length).fill(0);

        // ==========================================
        // 4. SMART MATCHING FUNCTION
        // ==========================================
        const isMatch = (student, categoryName, criteriaName) => {
            const catLower = String(categoryName).toLowerCase();
            const critLower = String(criteriaName).toLowerCase();

            const status = String(student.student_status || "").toLowerCase();
            const gender = String(student.gender || "").toLowerCase();
            const payment = String(student.payment_method || "").toLowerCase();
            const discType = String(student.discount_type || "").toLowerCase();
            const discNotes = String(student.discount_notes || "").toLowerCase();
            const acadStatus = String(student.academic_status || "").toLowerCase();
            const schoolYear = String(student.school_year || "").toLowerCase(); 

            const isInstallment = payment.includes("installment");
            const isFullPayment = payment.includes("full payment") || payment === "cash";

            if (catLower === "gender") return gender === critLower || gender.startsWith(critLower);
            if (catLower === "student status") return status === critLower;
            if (catLower === "school year") return schoolYear === critLower;

            if (catLower === "academic status") {
                if (critLower === "regular") return acadStatus === "regular";
                if (critLower.includes("sit")) return acadStatus.includes("sit");
                return acadStatus === critLower;
            }
            
            if (catLower === "payment") {
                if (critLower === "cash") return isFullPayment && discType !== "ip";
                if (critLower === "ip") return isFullPayment && discType === "ip"; 
                return payment === critLower; 
            }

            const isStatusMatch = (status === critLower); 
            
            if (catLower === "sg") return isStatusMatch && discType === "beasiswa";
            if (catLower === "sd") return isStatusMatch && discType === "special discount";
            if (catLower === "sc") return isStatusMatch && discType === "staff";
            
            if (catLower === "cash 12%") return isStatusMatch && isFullPayment && discNotes.includes("12%");
            if (catLower === "cash 10%") return isStatusMatch && isFullPayment && discNotes.includes("10%");
            if (catLower === "cash 5%") return isStatusMatch && isFullPayment && discNotes.includes("5%");
            
            if (catLower === "ip%") {
                return isStatusMatch && isInstallment && discType === "ip";
            }
            
            for (const [key, val] of Object.entries(student)) {
                if (baseColumns.includes(key) || val === null || val === undefined) continue;
                
                if (String(val).toLowerCase() === critLower) {
                    const keyFormatted = key.toLowerCase().replace(/_/g, ' ');
                    if (keyFormatted.includes(catLower) || catLower.includes(keyFormatted.split(' ')[0])) {
                        return true;
                    }
                }
            }
            return false;
        };

        // ==========================================
        // 5. MENGISI DATA MATRIX SISWA
        // ==========================================
        detailsData.forEach((student, index) => {
            const studentRow = [index + 1];

            baseColumns.forEach(col => {
                if (col === "registration_date") {
                    studentRow.push(formatDate(student[col]));
                } else {
                    studentRow.push(student[col] || "");
                }
            });

            orderedCriteria.forEach((colDef, cIndex) => {
                if (isMatch(student, colDef.category, colDef.criteria)) {
                    studentRow.push(1);
                    criteriaTotals[cIndex]++;
                } else {
                    studentRow.push("");
                }
            });
            
            studentRow.push(1); // Kolom REG
            aoaData.push(studentRow);
        });

        const emptySeparatorRow = Array(baseHeaders.length + orderedCriteria.length + 1).fill("");
        aoaData.push(emptySeparatorRow);

        const footerStartRowIndex = aoaData.length;

        // ==========================================
        // 6. SETUP FOOTER (Total Row)
        // ==========================================
        const kategoriRow = [...baseHeaders];
        const kriteriaRow = Array(baseHeaders.length).fill("");
        const totalRow = Array(baseHeaders.length).fill("");

        const fullNameIndex = baseHeaders.indexOf("Name of students"); 
        const gradeIndex = baseHeaders.indexOf("Grade");

        if (fullNameIndex !== -1) totalRow[fullNameIndex] = "Total:";
        if (gradeIndex !== -1) totalRow[gradeIndex] = currentTotal;

        orderedCriteria.forEach((colDef, index) => {
            const isFirstOfCategory = index === 0 || orderedCriteria[index - 1].category !== colDef.category;
            const catLower = String(colDef.category).toLowerCase();
            
            const isMergedVertically = ["student status", "academic status", "payment"].includes(catLower);

            if (isMergedVertically) {
                kategoriRow.push(formatHeader(colDef.criteria)); 
                kriteriaRow.push(""); 
            } else {
                kategoriRow.push(isFirstOfCategory ? formatHeader(colDef.category) : "");
                kriteriaRow.push(colDef.criteria);
            }
            
            totalRow.push(criteriaTotals[index]);
        });

        kategoriRow.push("Reg");
        kriteriaRow.push(""); 
        totalRow.push(currentTotal); 

        aoaData.push(kategoriRow);
        aoaData.push(kriteriaRow);
        aoaData.push(totalRow);

        // ==========================================
        // 7. COMPARATIVE TABLE
        // ==========================================
        let comparativeStartRowIndex = -1;
        
        if (comparativeTable && comparativeTable.length > 0) {
            aoaData.push([]); 
            comparativeStartRowIndex = aoaData.length;
            
            // Baris Title Comparative Data
            aoaData.push(["Comparative Data of Enrollee"]);
            
            // Baris Date Hari ini (Format: As Per Month DD, YYYY)
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const today = new Date();
            const formattedDate = `As Per ${monthNames[today.getMonth()]} ${String(today.getDate()).padStart(2, '0')}, ${today.getFullYear()}`;
            aoaData.push([formattedDate]);
            
            // Baris Headers School Year (Tambahkan awalan SY)
            const schoolYearHeaders = comparativeTable.map(item => "SY " + (item["School Year"] || item.school_year));
            const headers = ["", "", ...schoolYearHeaders];
            aoaData.push(headers);

            const buildRow = (label, key, isBlank = false) => {
                const row = [label, ""]; 
                if (isBlank) {
                    comparativeTable.forEach(() => row.push(""));
                } else {
                    comparativeTable.forEach(r => {
                        const value = r[key] !== undefined ? r[key] : (r[key.toLowerCase().replace(/ /g, '_')] || 0);
                        row.push(Number(value));
                    });
                }
                return row;
            };

            aoaData.push(buildRow("New Student", "Total New"));
            aoaData.push(buildRow("Returning", "Total Returning")); 
            aoaData.push(buildRow("Paid The Registration", "", true)); 
            aoaData.push(buildRow("Visitors(MIS)", "", true)); 
            aoaData.push(buildRow("Total Enrollee", "Total Enrollee"));
        }

        const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

        // ==========================================
        // 8. SETUP MERGES 
        // ==========================================
        const merges = [];
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }); 

        for (let i = 0; i < baseHeaders.length; i++) {
            merges.push({ s: { r: footerStartRowIndex, c: i }, e: { r: footerStartRowIndex + 1, c: i } });
        }

        let colIndex = baseHeaders.length;
        let startCol = colIndex;
        let lastCategory = null;

        orderedCriteria.forEach((col, i) => {
            const catLower = String(col.category).toLowerCase();
            const isMergedVertically = ["student status", "academic status", "payment"].includes(catLower);

            if (col.category !== lastCategory) {
                if (i > 0 && !["student status", "academic status", "payment"].includes(String(lastCategory).toLowerCase())) {
                    merges.push({
                        s: { r: footerStartRowIndex, c: startCol },
                        e: { r: footerStartRowIndex, c: colIndex - 1 }
                    });
                }
                startCol = colIndex;
                lastCategory = col.category;
            }
            
            if (isMergedVertically) {
                merges.push({ s: { r: footerStartRowIndex, c: colIndex }, e: { r: footerStartRowIndex + 1, c: colIndex } });
            }
            
            colIndex++;
        });
        
        if (orderedCriteria.length > 0 && !["student status", "academic status", "payment"].includes(String(lastCategory).toLowerCase())) {
            merges.push({
                s: { r: footerStartRowIndex, c: startCol },
                e: { r: footerStartRowIndex, c: colIndex - 1 }
            });
        }
        
        const regColumnIndex = baseHeaders.length + orderedCriteria.length;
        merges.push({ s: { r: footerStartRowIndex, c: regColumnIndex }, e: { r: footerStartRowIndex + 1, c: regColumnIndex } });

        // Comparative Table Merges
        if (comparativeStartRowIndex !== -1) {
            const lastCompColIndex = 1 + comparativeTable.length;
            
            merges.push({
                s: { r: comparativeStartRowIndex, c: 0 },
                e: { r: comparativeStartRowIndex, c: lastCompColIndex }
            });
            
            merges.push({
                s: { r: comparativeStartRowIndex + 1, c: 0 },
                e: { r: comparativeStartRowIndex + 1, c: lastCompColIndex }
            });
            
            for (let r = 2; r <= 7; r++) {
                merges.push({
                    s: { r: comparativeStartRowIndex + r, c: 0 },
                    e: { r: comparativeStartRowIndex + r, c: 1 }
                });
            }
        }

        worksheet["!merges"] = merges;

        // ==========================================
        // 9. APPLY STYLING MATRIX
        // ==========================================
        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        for (let R = 0; R <= range.e.r; ++R) {
            if (R === footerStartRowIndex - 1) continue; 

            for (let C = 0; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };
                const cell = worksheet[cellAddress];
                cell.s = cell.s || {};

                if (R === 0 && C === 0) {
                    cell.s.font = { bold: true };
                    cell.s.alignment = { horizontal: "left" };
                    continue;
                }

                if (R >= 2 && R <= footerStartRowIndex + 2) {
                    cell.s.border = {
                        top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } }
                    };
                    cell.s.alignment = { vertical: "center", horizontal: "center" };
                }

                if (R >= 2 && R < footerStartRowIndex) {
                    if (C === 0) cell.s.font = { bold: true };
                    else if (C === fullNameIndex) cell.s.alignment = { vertical: "center", horizontal: "left" };
                }

                if (R === footerStartRowIndex || R === footerStartRowIndex + 1) {
                    cell.s.font = { bold: true, color: { rgb: "000000" } };
                    cell.s.fill = { fgColor: { rgb: "BDD7EE" } };
                    cell.s.alignment = { vertical: "center", horizontal: "center" };
                }

                if (R === footerStartRowIndex + 2) {
                    cell.s.font = { bold: true, color: { rgb: "000000" } };
                    if (C === fullNameIndex) cell.s.alignment = { vertical: "center", horizontal: "right" };
                }

                // Styling Khusus Comparative Table
                if (comparativeStartRowIndex !== -1 && R >= comparativeStartRowIndex) {
                    const maxColBound = 1 + comparativeTable.length;
                    
                    if (C <= maxColBound) {
                        cell.s.border = {
                            top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } }
                        };

                        if (R === comparativeStartRowIndex || R === comparativeStartRowIndex + 1) {
                            cell.s.font = { bold: true };
                            cell.s.alignment = { horizontal: "center", vertical: "center" };
                        } else {
                            if (C === 0 || C === 1) {
                                cell.s.font = { bold: true };
                                cell.s.fill = { fgColor: { rgb: "BDD7EE" } };
                                cell.s.alignment = { vertical: "center", horizontal: "left" }; // Teks label jadi rata kiri
                            } else {
                                cell.s.alignment = { vertical: "center", horizontal: "center" };
                            }

                            if (R === comparativeStartRowIndex + 2) {
                                cell.s.font = { bold: true };
                                cell.s.fill = { fgColor: { rgb: "BDD7EE" } };
                            }
                        }
                    }
                }
            }
        }

        // ==========================================
        // 10. SETUP UKURAN KOLOM LEBAR
        // ==========================================
        worksheet['!cols'] = Array(range.e.c + 1).fill({ wch: 15 });
        worksheet['!cols'][0] = { wch: 5 }; 

        const regDateIndex = baseHeaders.indexOf("Reg Date");
        if (regDateIndex !== -1) worksheet['!cols'][regDateIndex] = { wch: 14 };

        const studentIdIndex = baseHeaders.indexOf("Student ID");
        if (studentIdIndex !== -1) worksheet['!cols'][studentIdIndex] = { wch: 15 };

        if (fullNameIndex !== -1) worksheet['!cols'][fullNameIndex] = { wch: 30 };
        if (gradeIndex !== -1) worksheet['!cols'][gradeIndex] = { wch: 10 };
        
        orderedCriteria.forEach((col, i) => {
            const criteriaLength = String(col.criteria).length;
            worksheet['!cols'][baseHeaders.length + i] = { wch: Math.max(criteriaLength + 3, 6) };
        });
        
        worksheet['!cols'][regColumnIndex] = { wch: 8 };

        // Pastikan kolom-kolom di area Comparative Table cukup lebar agar teks SY tidak terpotong
        if (comparativeStartRowIndex !== -1 && comparativeTable) {
            for (let i = 0; i < comparativeTable.length; i++) {
                // Kolom dimulai dari index ke-2 (karena 0 dan 1 dimerge untuk teks kriteria)
                const targetColIndex = 2 + i;
                
                // Setel minimal lebar 16 agar teks "SY 2024/2025" muat
                if (worksheet['!cols'][targetColIndex].wch < 16) {
                    worksheet['!cols'][targetColIndex].wch = 16;
                }
            }
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, "Rekapan Pendaftaran");
        XLSX.writeFile(workbook, fileName);
        return;
    }

    Object.keys(tableData).forEach((tableKey, index) => {
        const sheetData = tableData[tableKey];
        if (!sheetData || sheetData.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, `Data ${index + 1}`);
    });

    XLSX.writeFile(workbook, fileName);
};