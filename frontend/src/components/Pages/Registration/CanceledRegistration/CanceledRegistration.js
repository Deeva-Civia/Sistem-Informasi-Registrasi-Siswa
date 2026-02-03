import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../../Molecules/Pagination/Pagination';
import styles from './CanceledRegistration.module.css';
import SearchBar from '../../../Molecules/SearchBar/SearchBar'; 
import ColumnHeader from '../../../Molecules/ColumnHeader/ColumnHeader';
import Button from '../../../Atoms/Button/Button';
import ResetFilterButton from '../../../Atoms/ResetFilterButton/ResetFilterButton';

import {
  getCancelledRegistrations,
  getRegistrationOptions,
} from "../../../../services/api";

const CanceledRegistrationRow = ({ registration }) => {
  return (
    <div className={styles.registrationDataRow}>
      <div className={styles.tableCell}>
        {registration.registration_date
          ? new Date(registration.registration_date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : '-'}
      </div>

      <div className={styles.tableCell}>
        {registration.cancelled_at
          ? new Date(registration.cancelled_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : '-'}
      </div>

      <div className={styles.tableCell}>{registration.full_name}</div>

      <div className={styles.tableCell}>{registration.school_year || '-'}</div>

      <div className={styles.tableCell}>
        {registration.section || 'N/A'}
      </div>

      <div className={styles.tableCell}>{registration.student_status || '-'}</div>

      <div className={styles.tableCell}>
        {registration.notes || '-'}
      </div>
    </div>
  );
};

const CanceledRegistration = () => {
  const navigate = useNavigate();
  const [registrationData, setRegistrationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(25);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [sorts, setSorts] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    sections: [],
    classes: [],
    studentType: [
      { id: 'New', name: 'New' },
      { id: 'Old', name: 'Old' },
    ],
  });
// eslint-disable-next-line 
  const fetchControllerRef = useRef(null);

  const fetchRegistrations = useCallback(
    async (currentFilters = {}, page = 1, currentSorts = []) => {
      setLoading(true);
      try {
        const params = {
          page,
          per_page: perPage,
          search: search || undefined,
          filter_name: currentFilters.filter_name,
          filter_notes: currentFilters.filter_notes,
          reg_start_date: currentFilters.reg_start_date,
          reg_end_date: currentFilters.reg_end_date,
          cancel_start_date: currentFilters.cancel_start_date,
          cancel_end_date: currentFilters.cancel_end_date,
          sections: currentFilters.sections,
          student_status: currentFilters.student_status,
          sort_by: currentSorts[0]?.field,
          sort_order: currentSorts[0]?.order,
        };

        const response = await getCancelledRegistrations(params);

        if (response?.status === 'success') {
          setRegistrationData(response.data.data || []);
          setTotalPages(response.data.last_page || 1);
          setCurrentPage(response.data.current_page || 1);
        }
      } catch (err) {
        console.error('Error fetching canceled registrations:', err);
        setRegistrationData([]);
      } finally {
        setLoading(false);
      }
    },
    [search, perPage]
  );

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const opts = await getRegistrationOptions();
        setFilterOptions((prev) => ({
          ...prev,
          sections: opts.sections || [],
          classes: opts.classes || [],
        }));
      } catch (err) {
        console.error('Error fetching options:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRegistrations(filters, 1, sorts);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, filters, sorts, fetchRegistrations]);

  const handleSortChange = (fieldKey) => {
    setSorts((prev) => {
      const current = prev[0]?.field === fieldKey ? prev[0] : null;
      let next;
      if (!current) {
        next = { field: fieldKey, order: 'asc' };
      } else if (current.order === 'asc') {
        next = { field: fieldKey, order: 'desc' };
      } else {
        next = null;
      }
      return next ? [next] : [];
    });
  };

  const handleFilterChange = (filterKey, selectedValue) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters };
      if (filterKey === 'reg_date_range' && Array.isArray(selectedValue)) {
        const [startDate, endDate] = selectedValue;
        newFilters['reg_start_date'] = startDate || undefined;
        newFilters['reg_end_date'] = endDate || undefined;
      } else if (filterKey === 'cancel_date_range' && Array.isArray(selectedValue)) {
        const [startDate, endDate] = selectedValue;
        newFilters['cancel_start_date'] = startDate || undefined;
        newFilters['cancel_end_date'] = endDate || undefined;
      } else if (filterKey === 'sections' || filterKey === 'student_status') {
         newFilters[filterKey] = selectedValue.length > 0 ? selectedValue : undefined;
      } else {
        newFilters[filterKey] = selectedValue || undefined;
      }
      return newFilters;
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilters({});
    setSorts([]);
  };

  const getSortOrder = (fieldKey) => {
    return sorts.find((s) => s.field === fieldKey)?.order;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchRegistrations(filters, newPage, sorts);
    }
  };

  const handleBackToRegistration = () => {
    navigate('/registration');
  };

  return (
    <div className={styles.registrationContainer}>
      <div className={styles.frameParent}>
        <div className={styles.headerTopRow}>
          <div>
            <div className={styles.title}>Canceled Registration</div>
            <div className={styles.searchAndFilterContainer}>
              <SearchBar
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Find name or student id'
              />
              <ResetFilterButton onClick={handleResetFilters} />
            </div>
          </div>
          <div className={styles.actionButtonsContainer}>
            <Button onClick={handleBackToRegistration} variant='solid'>
              Back to registration
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeaderGrid}>
          <ColumnHeader
            title='Registration Date'
            hasSort={true}
            fieldKey='registration_date'
            sortOrder={getSortOrder('registration_date')}
            onSort={handleSortChange}
            hasFilter={true}
            filterType='date-range'
            filterKey='reg_date_range'
            onFilterChange={handleFilterChange}
            currentFilterValue={[filters.reg_start_date, filters.reg_end_date]}
          />
          <ColumnHeader
            title='Cancellation Date'
            hasSort={true}
            fieldKey='cancelled_at'
            sortOrder={getSortOrder('cancelled_at')}
            onSort={handleSortChange}
            hasFilter={true}
            filterType='date-range'
            filterKey='cancel_date_range'
            onFilterChange={handleFilterChange}
            currentFilterValue={[filters.cancel_start_date, filters.cancel_end_date]}
          />
          <ColumnHeader
            title='Student Name'
            hasSort={true}
            fieldKey='full_name'
            sortOrder={getSortOrder('full_name')}
            onSort={handleSortChange}
            hasFilter={true}
            filterType='search'
            filterKey='filter_name'
            onFilterChange={handleFilterChange}
            currentFilterValue={filters.filter_name}
          />
          
          <ColumnHeader
            title='School Year'
            hasSort={false}
            hasFilter={false}
          />

          <ColumnHeader
            title='Section'
            hasSort={true}
            fieldKey='section'
            sortOrder={getSortOrder('section')}
            onSort={handleSortChange}
            hasFilter={true}
            filterKey='sections'
            onFilterChange={handleFilterChange}
            filterOptions={filterOptions.sections}
            valueKey='name'
            labelKey='name'
            currentFilterValue={filters.sections}
          />
          <ColumnHeader
            title='Type'
            hasSort={true}
            fieldKey='student_status'
            sortOrder={getSortOrder('student_status')}
            onSort={handleSortChange}
            hasFilter={true}
            filterKey='student_status'
            onFilterChange={handleFilterChange}
            filterOptions={filterOptions.studentType}
            valueKey='id'
            labelKey='name'
            currentFilterValue={filters.student_status}
          />
          <ColumnHeader
            title='Notes'
            hasSort={false}
            fieldKey='notes'
            hasFilter={true}
            filterType='search'
            filterKey='filter_notes'
            onFilterChange={handleFilterChange}
            currentFilterValue={filters.filter_notes}
          />
        </div>

        <div className={styles.tableBody}>
          {loading ? (
            <div className={styles.messageCell}>Loading...</div>
          ) : registrationData.length > 0 ? (
            registrationData.map((row, idx) => (
              <CanceledRegistrationRow
                key={idx}
                registration={row}
              />
            ))
          ) : (
            <div className={styles.messageCell}>No canceled registrations found</div>
          )}
        </div>
      </div>

      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default CanceledRegistration;