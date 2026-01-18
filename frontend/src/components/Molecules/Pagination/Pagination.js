import React, { useState, useCallback, useMemo, useEffect } from 'react';
import styles from './Pagination.module.css'; 
// Import Arrow diasumsikan ada di proyek Anda
import Arrow from '../../../assets/Vector.png'; 

const Pagination = ({  
    currentPage = 1, 
    totalPages = 1, 
    onPageChange = () => {} 
}) => {
    // 1. TAMBAH STATE LOKAL UNTUK MENGELOLA INPUT
    // Kita inisialisasi inputPage dengan nilai currentPage
    const [inputPage, setInputPage] = useState(currentPage.toString());

    // 2. Gunakan useEffect untuk Sinkronisasi
    // Ketika currentPage (dari prop) berubah, kita update nilai input
    useEffect(() => {
        setInputPage(currentPage.toString());
    }, [currentPage]);


    const isFirstPage = useMemo(() => currentPage === 1, [currentPage]);
    // eslint-disable-next-line
    const isLastPage = useMemo(() => currentPage === totalPages, [currentPage]);

    // Fungsi utama untuk memproses input dan memanggil onPageChange
    const navigateToInputPage = useCallback(() => {
        const page = parseInt(inputPage, 10);
        
        // 3. LOGIKA VALIDASI
        if (!isNaN(page) && page >= 1 && page <= totalPages && page !== currentPage) {
            // Panggil handler dari parent (Registration.js)
            onPageChange(page);
        } else {
            // Jika input tidak valid, kembalikan input ke currentPage yang benar
            setInputPage(currentPage.toString());
        }
    }, [inputPage, totalPages, currentPage, onPageChange]);


    const goToPreviousPage = useCallback(() => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    }, [currentPage, onPageChange]);

    const goToNextPage = useCallback(() => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    }, [currentPage, totalPages, onPageChange]);

    const pageInfoText = `Page ${currentPage} out of ${totalPages}`;

    return (
        <div className={styles.paginationControlsMinimal}> 
            {/* Teks Informasi Halaman */}
            <div className={styles.pageIndicatorMinimal}>{pageInfoText}</div>

            {/* Kontainer Tombol Paginasi */}
            <div className={styles.paginationButtonGroup}>
                
                {/* Tombol Previous - Menggunakan Image */}
                <button 
                    onClick={goToPreviousPage} 
                    disabled={isFirstPage}
                    className={styles.paginationButton} 
                    title="Previous Page"
                >
                    <img src={Arrow} alt="Previous" width={20} height={20} />
                </button>
                
                {/* Wrapper untuk Angka Halaman Aktif (DIUBAH MENJADI INPUT) */}
                <div className={styles.pageNumberWrapper}>
                    <input
                        type="text"
                        value={inputPage}
                        // Hanya izinkan angka saat mengetik
                        onChange={(e) => setInputPage(e.target.value.replace(/[^0-9]/g, ''))}
                        // Panggil navigasi saat user menekan Enter
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                navigateToInputPage();
                            }
                        }}
                        // Panggil navigasi saat input kehilangan fokus (onBlur)
                        onBlur={navigateToInputPage}
                        className={styles.pageNumberInput} // Tambah class baru untuk styling input
                    />
                </div>
                
                {/* Tombol Next - Menggunakan Image */}
                <button 
                    onClick={goToNextPage} 
                    disabled={isLastPage}
                    className={styles.paginationButton} 
                    title="Next Page"
                >
                    <img src={Arrow} alt="Next" width={20} height={20} style={{ transform: 'rotate(180deg)' }} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;