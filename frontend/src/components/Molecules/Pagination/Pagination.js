import React, { useState, useCallback, useMemo, useEffect } from 'react';
import styles from './Pagination.module.css'; 
import Arrow from '../../../assets/Vector.png'; 

const Pagination = ({  
    currentPage = 1, 
    totalPages = 1, 
    onPageChange = () => {} 
}) => {
    const [inputPage, setInputPage] = useState(currentPage.toString());

    useEffect(() => {
        setInputPage(currentPage.toString());
    }, [currentPage]);


    const isFirstPage = useMemo(() => currentPage === 1, [currentPage]);
    // eslint-disable-next-line
    const isLastPage = useMemo(() => currentPage === totalPages, [currentPage]);

    const navigateToInputPage = useCallback(() => {
        const page = parseInt(inputPage, 10);
        
        if (!isNaN(page) && page >= 1 && page <= totalPages && page !== currentPage) {
            onPageChange(page);
        } else {
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
            <div className={styles.pageIndicatorMinimal}>{pageInfoText}</div>

            <div className={styles.paginationButtonGroup}>
                
                <button 
                    onClick={goToPreviousPage} 
                    disabled={isFirstPage}
                    className={styles.paginationButton} 
                    title="Previous Page"
                >
                    <img src={Arrow} alt="Previous" width={20} height={20} />
                </button>
                
                <div className={styles.pageNumberWrapper}>
                    <input
                        type="text"
                        value={inputPage}
                        onChange={(e) => setInputPage(e.target.value.replace(/[^0-9]/g, ''))}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                navigateToInputPage();
                            }
                        }}
                        onBlur={navigateToInputPage}
                        className={styles.pageNumberInput} 
                    />
                </div>
                
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