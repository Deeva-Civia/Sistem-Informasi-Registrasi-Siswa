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

    // 1. DATA EXTRACTION (SMART DYNAMIC PARSER)
    const extractDataSets = (data) => {
        let matrices = [];

        if (Array.isArray(data)) {
            if (data.length > 0 && !Array.isArray(data[0])) {
                matrices.push(data);
            } else {
                matrices = [...data];
            }
        } else if (typeof data === 'object' && data !== null) {
            Object.values(data).forEach(val => {
                if (Array.isArray(val)) {
                    if (val.length > 0 && !Array.isArray(val[0])) matrices.push(val);
                    else matrices.push(...val);
                }
            });
        }

        matrices.forEach(arr => {
            if (!Array.isArray(arr) || arr.length === 0) return;
            
            const keys = Object.keys(arr[0] || {}).map(k => String(k).toLowerCase());

            if (keys.includes("kategori") || keys.includes("kriteria")) {
                summaryData = arr;
            } else if (keys.includes("student_id") || keys.includes("full_name") || keys.includes("grade")) {
                detailsData = arr;
            } else if (keys.includes("school year") || keys.includes("total new") || keys.includes("total returning")) {
                comparativeTable = arr;
            }
        });
    };

    extractDataSets(tableData);

    if (comparativeTable && comparativeTable.length > 0) {
        isDailyReport = true;
    }

    if (summaryData || detailsData) { 
        summaryData = summaryData || [];
        detailsData = detailsData || [];

        // 2. SETUP BASE COLUMNS & HEADERS
        const allKeys = Object.keys(detailsData[0] || {});
        const baseColumns = [];
        const baseHeaders = ["No."];

        const formatHeader = (str) => {
            const cleanStr = String(str).replace(/_/g, " ");
            // Daftar singkatan yang HARUS huruf besar semua
            const exactUppers = ["nik", "nisn", "kitas", "id", "va"]; 
            
            if (exactUppers.includes(cleanStr.toLowerCase())) {
                return cleanStr.toUpperCase();
            }
            return cleanStr.replace(/\b\w/g, (l) => l.toUpperCase());
        };

        // Custom format untuk me-rename teks header Cash
        const formatDisplayHeader = (str) => {
            const s = String(str).toLowerCase().trim();
            if (s === 'cash 12%') return '12%cash';
            if (s === 'cash 10%') return '10%cash';
            if (s === 'cash 5%') return '5%cash';
            return formatHeader(str);
        };

        const formatDisplayCriteria = (str) => {
            const s = String(str).toLowerCase().trim();
            if (s === 'cash 12%') return '12%cash';
            if (s === 'cash 10%') return '10%cash';
            if (s === 'cash 5%') return '5%cash';
            return str;
        };

        // KONDISI: Tampilkan Student ID jika bukan Daily Report Format
        const allowedBaseKeys = isDailyReport 
            ? ["full_name", "grade"] 
            : [
                "student_name", "student_id", "registration_id", "nickname", 
                "nik", "nisn", "place_of_birth", "age", "date_of_birth", 
                "kitas", "address", "previous_school", "email_siswa", 
                "phone_number_siswa", "grade"
            ];
        const allowedBaseHeaders = isDailyReport 
            ? ["Name of students", "Grade"] 
            : [
                "Student's Name", "Student ID", "Registration ID", "Nickname", 
                "NIK", "NISN", "Place of Birth", "Age", "Date of Birth", 
                "KITAS", "Address", "Previous School", "Email Siswa", 
                "Phone Number", "Grade"
            ];
        // Ambil semua kategori dari summaryData untuk membedakan mana yang Matrix
        const matrixCategoriesLower = summaryData.map(item => {
            const catKey = Object.keys(item).find(k => k.toLowerCase() === 'kategori');
            return catKey ? String(item[catKey]).toLowerCase() : "";
        });

        const dynamicBaseKeys = [];
        const dynamicBaseHeaders = [];

        const personalDataKeywords = [
            'address', 'guardian', 'relation', 'company', 'occupation', 'name', 
            'nik', 'nisn', 'kitas', 'phone', 'dob', 'birth', 'email', 'account',
            'father', 'mother', 'previous', 'nickname', 'age', 'registration_id', 'virtual'
        ];

        if (!isDailyReport) {
            allKeys.forEach(key => {
                const lowerKey = String(key).toLowerCase();
                const formattedLowerKey = lowerKey.replace(/_/g, ' ');
                const isDiscount = lowerKey.includes('discount'); 
                const isPersonalData = personalDataKeywords.some(keyword => formattedLowerKey.includes(keyword));

                if (
                    !allowedBaseKeys.includes(lowerKey) &&
                    lowerKey !== "registration_date" &&
                    lowerKey !== "date" &&
                    !isDiscount && 
                    (isPersonalData  || (!matrixCategoriesLower.includes(formattedLowerKey) && !matrixCategoriesLower.includes(lowerKey)))
                ) {
                    dynamicBaseKeys.push(key);
                    dynamicBaseHeaders.push(formatHeader(key)); 
                }
            });
        }

        // Masukkan allowedBaseKeys KECUALI grade terlebih dahulu
        allowedBaseKeys.forEach((key, index) => {
            if (key !== "grade" && allKeys.includes(key)) {
                baseColumns.push(key);
                baseHeaders.push(allowedBaseHeaders[index]);
            }
        });

        // Sisipkan Dynamic Columns (seperti Mother's name, dll)
        dynamicBaseKeys.forEach((key, index) => {
            baseColumns.push(key);
            baseHeaders.push(dynamicBaseHeaders[index]);
        });

        // Masukkan Grade di paling akhir urutan base columns
        const gradeIndexInAllowed = allowedBaseKeys.indexOf("grade");
        if (gradeIndexInAllowed !== -1 && allKeys.includes("grade")) {
            baseColumns.push("grade");
            baseHeaders.push(allowedBaseHeaders[gradeIndexInAllowed]);
        }

        // 3. SETUP MATRIX CRITERIA & HEADERS
        let orderedCriteria = summaryData.map(item => {
            const getVal = (keyStr) => {
                const key = Object.keys(item).find(k => k.toLowerCase() === keyStr);
                return key ? item[key] : "";
            };
            return {
                category: getVal('kategori'),
                criteria: getVal('kriteria'),
                total: getVal('total') || 0
            };
        });

        // KONDISI: Hapus School Year hanya jika ini adalah Daily Report Format
        orderedCriteria = orderedCriteria.filter(col => {
            const catLower = String(col.category).toLowerCase();
            const critLower = String(col.criteria).toLowerCase();
            
            const isPersonalCategory = personalDataKeywords.some(keyword => catLower.includes(keyword));
            if (isPersonalCategory) return false;

            if (isDailyReport) {
                return catLower !== "grade" && catLower !== "school year" && critLower !== "transferee";
            }
            // Jika false, tetap tampilkan school year
            return catLower !== "grade" && critLower !== "transferee";
        });

        // MEMBUAT HEADER UNTUK BAGIAN ATAS & BAWAH
        const kategoriRow = [...baseHeaders];
        const kriteriaRow = Array(baseHeaders.length).fill("");

        orderedCriteria.forEach((colDef, index) => {
            const isFirstOfCategory = index === 0 || orderedCriteria[index - 1].category !== colDef.category;
            const catLower = String(colDef.category).toLowerCase();
            const isMergedVertically = ["student status", "academic status", "payment"].includes(catLower);

            if (isMergedVertically) {
                kategoriRow.push(formatDisplayHeader(colDef.criteria)); 
                kriteriaRow.push(""); 
            } else {
                kategoriRow.push(isFirstOfCategory ? formatDisplayHeader(colDef.category) : "");
                kriteriaRow.push(formatDisplayCriteria(colDef.criteria));
            }
        });

        // Tambahkan Header Reg dan Date di posisi paling akhir
        kategoriRow.push("Reg");
        kriteriaRow.push(""); 
        kategoriRow.push("Date");
        kriteriaRow.push(""); 

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
            [],
            [...kategoriRow], 
            [...kriteriaRow]
        ];

        const criteriaTotals = Array(orderedCriteria.length).fill(0);

        // Cari keys untuk Date secara dinamis 
        const dateKey = allKeys.find(k => k.toLowerCase() === "registration_date" || k.toLowerCase() === "date") || "registration_date";

        // 4. SMART MATCHING FUNCTION
        const isMatch = (student, categoryName, criteriaName) => {
            const catLower = String(categoryName).toLowerCase();
            const critLower = String(criteriaName).toLowerCase();

            const status = String(student.student_status || student.status || student["student status"] || "").toLowerCase().trim();
            const gender = String(student.gender || "").toLowerCase();
            const payment = String(student.payment_method || student.payment_details || student.tuition_fees || student.residence_payment || "").toLowerCase();
            const discType = String(student.discount_type || "").toLowerCase();
            const discNotes = String(student.discount_notes || "").toLowerCase();
            const acadStatus = String(student.academic_status || "").toLowerCase();
            const schoolYear = String(student.school_year || "").toLowerCase(); 

            const section = String(student.section || "").toLowerCase();
            const residence = String(student.residence_type || "").toLowerCase();

            const isInstallment = payment.includes("installment");
            const isFullPayment = payment.includes("full payment") || payment === "cash";

            if (catLower === "section") return section === critLower;
            if (catLower === "residence type" || catLower === "residence") return residence === critLower;

            if (catLower === "gender") return gender === critLower || gender.startsWith(critLower);
            if (catLower === "student status" || catLower === "status") {
                return status === critLower || (status === "" && false);
            }
            if (catLower === "school year") return schoolYear === critLower;

            if (catLower === "academic status") {
                if (critLower === "regular") return acadStatus === "regular";
                if (critLower.includes("sit")) return acadStatus.includes("sit");
                return acadStatus === critLower;
            }
            
            if (catLower === "payment") {
                if (critLower === "cash") return isFullPayment && discType !== "ip";
                if (critLower === "ip") return isInstallment && discType === "ip"; 
                if (critLower === "installment") return isInstallment;
                return payment.includes(critLower) || payment === critLower;
            }

            if (catLower === "discount" || catLower === "discount type") {
                return discType === critLower;
            }
            if (catLower === "discount notes") {
                return discNotes.includes(critLower);
            }

            const isStatusMatch = isDailyReport ? (status === critLower) : true; 
            
            if (catLower === "sg") return isStatusMatch && discType === "beasiswa";
            if (catLower === "sd") return isStatusMatch && discType === "special discount";
            if (catLower === "sc") return isStatusMatch && discType === "staff";
            
            if (catLower === "cash 12%") return isStatusMatch && isFullPayment && discNotes.includes("12%");
            if (catLower === "cash 10%") return isStatusMatch && isFullPayment && discNotes.includes("10%");
            if (catLower === "cash 5%") return isStatusMatch && isFullPayment && discNotes.includes("5%");
            
            if (catLower === "ip%") {
                return isStatusMatch && isFullPayment && discType === "ip";
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

        // 5. MENGISI DATA MATRIX SISWA
        detailsData.forEach((student, index) => {
            const studentRow = [index + 1];

            baseColumns.forEach(col => {
                let val = student[col] !== undefined && student[col] !== null ? student[col] : "";
                const colLower = String(col).toLowerCase();

                const isLongNumericString = ['nik', 'nisn', 'kitas'].includes(colLower) || 
                                            colLower.includes('phone') || 
                                            colLower.includes('va_') || 
                                            colLower.includes('virtual') ||
                                            colLower.includes('account');

                if (isLongNumericString && val !== "") {
                    // format menjadi Teks/String (t: 's') agar angka tidak berubah jadi e+
                    studentRow.push({ v: String(val), t: 's' }); 
                } else {
                    studentRow.push(val);
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
            
            studentRow.push(1); // Kolom Reg
            studentRow.push(formatDate(student[dateKey])); // Kolom Date di akhir
            aoaData.push(studentRow);
        });

        const emptySeparatorRow = Array(baseHeaders.length + orderedCriteria.length + 2).fill("");
        aoaData.push(emptySeparatorRow);

        const footerStartRowIndex = aoaData.length;

        // 6. SETUP FOOTER (Total Row)
        const totalRow = Array(baseHeaders.length).fill("");

        const fullNameIndex = baseHeaders.findIndex(header => 
            ["Name of students", "Student's Name", "Full Name"].includes(header)
        );
        const gradeIndex = baseHeaders.indexOf("Grade");
        
        // [PERUBAHAN 4]: Menentukan posisi kata "Total:" agar persis di kiri kolom Grade
        const totalLabelIndex = gradeIndex > 0 ? gradeIndex - 1 : fullNameIndex; 

        if (totalLabelIndex !== -1) totalRow[totalLabelIndex] = "Total:";
        if (gradeIndex !== -1) totalRow[gradeIndex] = currentTotal;

        orderedCriteria.forEach((colDef, index) => {
            const finalTotal = detailsData.length > 0 ? criteriaTotals[index] : colDef.total;
            totalRow.push(finalTotal);
        });

        totalRow.push(currentTotal); 
        totalRow.push("");           

        aoaData.push([...kategoriRow]); 
        aoaData.push([...kriteriaRow]); 
        aoaData.push(totalRow);

        // 7. COMPARATIVE TABLE & DESCRIPTIONS
        let comparativeStartRowIndex = -1;
        
        if (comparativeTable && comparativeTable.length > 0) {
            aoaData.push([]); 
            comparativeStartRowIndex = aoaData.length;
            
            aoaData.push(["Comparative Data of Enrollee"]);
            
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const today = new Date();
            const formattedDate = `As Per ${monthNames[today.getMonth()]} ${String(today.getDate()).padStart(2, '0')}, ${today.getFullYear()}`;
            aoaData.push([formattedDate]);
            
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

        // KONDISI: MENAMBAHKAN DESKRIPSI HANYA JIKA isDailyReport TRUE
        let legendStartIndex = -1;
        let legendEndIndex = -1;
        if (isDailyReport) {
            aoaData.push([]);
            legendStartIndex = aoaData.length; 
            aoaData.push(["Keterangan:", ""]);
            const descriptions = [
                ["Grade", ": Kelas"],
                ["New, Old", ": Student Status"],
                ["SG", ": Scholarship Grantee"],
                ["SD", ": Special Discount"],
                ["SC", ": Staff Child"],
                ["IP%", ": Beasiswa IP dengan pembayaran Full Payment"],
                ["IP", ": Beasiswa IP dengan pembayaran Installment"],
                ["Cash", ": Full Payment"],
                ["12%cash", ": Beasiswa 12% dengan pembayaran Full Payment"],
                ["10%cash", ": Beasiswa 10% dengan pembayaran Full Payment"],
                ["5%cash", ": Beasiswa 5% dengan pembayaran Full Payment"],
                ["Regular", ": Academic Status Regular"],
                ["Sit In", ": Academic Status Sit In"],
                ["Reg", ": Registration (total registration)"],
                ["SY", ": School Year"],
                ["Returning", ": Old Student"]
            ];

            descriptions.forEach((desc, index) => {
                aoaData.push([`${index + 1}.`, desc[0], desc[1]]); 
            });
            legendEndIndex = aoaData.length - 1; 
        }

        const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

        // 8. SETUP MERGES 
        const merges = [];
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }); 

        const regColumnIndex = baseHeaders.length + orderedCriteria.length;
        const dateColumnIndex = regColumnIndex + 1;

        const applyHeaderMerges = (startRowIndex) => {
            for (let i = 0; i < baseHeaders.length; i++) {
                merges.push({ s: { r: startRowIndex, c: i }, e: { r: startRowIndex + 1, c: i } });
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
                            s: { r: startRowIndex, c: startCol },
                            e: { r: startRowIndex, c: colIndex - 1 }
                        });
                    }
                    startCol = colIndex;
                    lastCategory = col.category;
                }
                
                if (isMergedVertically) {
                    merges.push({ s: { r: startRowIndex, c: colIndex }, e: { r: startRowIndex + 1, c: colIndex } });
                }
                colIndex++;
            });
            
            if (orderedCriteria.length > 0 && !["student status", "academic status", "payment"].includes(String(lastCategory).toLowerCase())) {
                merges.push({
                    s: { r: startRowIndex, c: startCol },
                    e: { r: startRowIndex, c: colIndex - 1 }
                });
            }
            
            merges.push({ s: { r: startRowIndex, c: regColumnIndex }, e: { r: startRowIndex + 1, c: regColumnIndex } });
            merges.push({ s: { r: startRowIndex, c: dateColumnIndex }, e: { r: startRowIndex + 1, c: dateColumnIndex } });
        };

        applyHeaderMerges(2); // Merge untuk header Atas
        applyHeaderMerges(footerStartRowIndex); // Merge untuk header Bawah

        if (comparativeStartRowIndex !== -1) {
            const lastCompColIndex = 1 + comparativeTable.length;
            merges.push({ s: { r: comparativeStartRowIndex, c: 0 }, e: { r: comparativeStartRowIndex, c: lastCompColIndex } });
            merges.push({ s: { r: comparativeStartRowIndex + 1, c: 0 }, e: { r: comparativeStartRowIndex + 1, c: lastCompColIndex } });
            for (let r = 2; r <= 7; r++) {
                merges.push({ s: { r: comparativeStartRowIndex + r, c: 0 }, e: { r: comparativeStartRowIndex + r, c: 1 } });
            }
        }

        // KONDISI: Merge kolom Keterangan jika isDailyReport
        if (isDailyReport && legendStartIndex !== -1) {
            merges.push({ s: { r: legendStartIndex, c: 0 }, e: { r: legendStartIndex, c: 2 } }); 
            
            for (let r = legendStartIndex + 1; r <= legendEndIndex; r++) {                
                merges.push({ s: { r: r, c: 2 }, e: { r: r, c: 4 } }); 
            }
        }

        worksheet["!merges"] = merges;

        // 9. APPLY STYLING MATRIX
        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        for (let R = 0; R <= range.e.r; ++R) {

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

                // Styling Keterangan
                if (isDailyReport && legendStartIndex !== -1 && R >= legendStartIndex && R <= legendEndIndex) {
                    // Baris judul "Keterangan:"
                    if (R === legendStartIndex && C === 0) {
                        cell.s.font = { bold: true };
                        cell.s.alignment = { horizontal: "left", vertical: "center" };
                    } 
                    // Baris isi list keterangan
                    else if (R > legendStartIndex) {
                        if (C === 0) {
                            // Angka nomor 
                            cell.s.font = { bold: false };
                            cell.s.alignment = { horizontal: "center", vertical: "center" };
                        } else if (C === 1) {
                            // Label 
                            cell.s.alignment = { horizontal: "left", vertical: "center" };
                        } else if (C === 2) {
                            // Penjelasan 
                            cell.s.alignment = { horizontal: "left", vertical: "center" };
                        }
                    }
                    continue;
                }

                if (R >= 2 && R <= footerStartRowIndex + 2) {
                    cell.s.border = {
                        top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } }
                    };
                    cell.s.alignment = { vertical: "center", horizontal: "center" };
                }

                // Styling Data Tabel Utama (Baris 4 hingga sebelum Footer)
                if (R >= 4 && R < footerStartRowIndex) {
                    if (C === 0) {
                        cell.s.font = { bold: true };
                    } else if (["Name of students", "Student's Name", "Full Name"].includes(baseHeaders[C])) {
                        cell.s.alignment = { vertical: "center", horizontal: "left" };
                    }

                    // Text wrap alamat
                    if (baseHeaders[C]) {
                        const currentHeaderLower = String(baseHeaders[C]).toLowerCase();
                        if (["student address", "father address", "mother address", "guardian address"].includes(currentHeaderLower)) {
                            cell.s.alignment = cell.s.alignment || {};
                            cell.s.alignment.wrapText = true; // Mengaktifkan text-wrap
                            cell.s.alignment.vertical = "center"; 
                            cell.s.alignment.horizontal = "left"; // Dibuat rata kiri agar mudah dibaca
                        }
                    }
                }

                // Styling Header Atas (2 & 3) dan Header Bawah
                if (R === 2 || R === 3 || R === footerStartRowIndex || R === footerStartRowIndex + 1) {
                    cell.s.font = { bold: true, color: { rgb: "000000" } };
                    cell.s.fill = { fgColor: { rgb: "BDD7EE" } };
                    cell.s.alignment = { vertical: "center", horizontal: "center" };
                    cell.s.border = {
                        top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } }
                    };
                }

                // [PERUBAHAN 5]: Styling Baris Total Paling Bawah agar "Total:" sejajar di kanan (menempel Grade)
                if (R === footerStartRowIndex + 2) {
                    cell.s.font = { bold: true, color: { rgb: "000000" } };
                    if (C === totalLabelIndex) cell.s.alignment = { vertical: "center", horizontal: "right" };
                }

                // Styling Comparative Table
                if (comparativeStartRowIndex !== -1 && R >= comparativeStartRowIndex && R < comparativeStartRowIndex + 8) {
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
                                cell.s.font = { bold: false };
                                cell.s.alignment = { vertical: "center", horizontal: "left" };
                            } else {
                                cell.s.alignment = { vertical: "center", horizontal: "center" };
                            }
                            
                            if (R === comparativeStartRowIndex + 2) {
                                cell.s.font = { bold: false };
                            }
                        }
                    }
                }
            }
        }

        // 10. SETUP UKURAN KOLOM
        worksheet['!cols'] = Array(range.e.c + 1).fill({ wch: 15 });
        worksheet['!cols'][0] = { wch: 5 }; 

        const studentIdIndex = baseHeaders.indexOf("Student ID");
        if (studentIdIndex !== -1) worksheet['!cols'][studentIdIndex] = { wch: 15 };

        if (fullNameIndex !== -1) worksheet['!cols'][fullNameIndex] = { wch: 30 };
        if (gradeIndex !== -1) worksheet['!cols'][gradeIndex] = { wch: 6 }; 
        
        if (!isDailyReport) {
            dynamicBaseHeaders.forEach(header => {
                const hIndex = baseHeaders.indexOf(header);
                if (hIndex !== -1) {
                    // Lebar kolom menyesuaikan panjang judul (minimal 20)
                    worksheet['!cols'][hIndex] = { wch: Math.max(header.length + 5, 20) };
                }
            });
        }
        
        orderedCriteria.forEach((col, i) => {
            const critLower = String(col.criteria).toLowerCase();
            const catLower = String(col.category).toLowerCase();

            if (critLower === "new" || critLower === "old") {
                worksheet['!cols'][baseHeaders.length + i] = { wch: 5 };
            } else if (catLower === "school year") {
                const criteriaLength = String(col.criteria).length;
                worksheet['!cols'][baseHeaders.length + i] = { wch: Math.max(criteriaLength + 4, 12) };
            } else {
                const criteriaLength = String(col.criteria).length;
                const categoryLength = String(col.category).length;
                
                worksheet['!cols'][baseHeaders.length + i] = { wch: Math.max(criteriaLength + 3, categoryLength + 2, 6) };
            }
        });
        
        worksheet['!cols'][regColumnIndex] = { wch: 8 };
        worksheet['!cols'][dateColumnIndex] = { wch: 14 };

        // Logika Dynamic Width untuk menyeimbangkan tabel SY Comparative
        if (comparativeStartRowIndex !== -1 && comparativeTable) {
            for (let i = 0; i < comparativeTable.length; i++) {
                const targetColIndex = 2 + i;
                const syText = "SY " + (comparativeTable[i]["School Year"] || comparativeTable[i].school_year);
                const minSyWidth = syText.length + 2; 
                
                if(worksheet['!cols'][targetColIndex]) {
                    const currentWch = worksheet['!cols'][targetColIndex].wch;
                    if (currentWch < minSyWidth || currentWch === 15) {
                        worksheet['!cols'][targetColIndex] = { wch: minSyWidth };
                    }
                }
            }
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, "Rekapan Pendaftaran");
        XLSX.writeFile(workbook, fileName);
        return;
    }

    // FALLBACK
    Object.keys(tableData).forEach((tableKey, index) => {
        const sheetData = tableData[tableKey];
        if (!sheetData || sheetData.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, `Data ${index + 1}`);
    });

    XLSX.writeFile(workbook, fileName);
};