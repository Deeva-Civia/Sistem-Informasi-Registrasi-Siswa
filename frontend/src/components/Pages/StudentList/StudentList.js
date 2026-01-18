import React, { useState, useEffect, useCallback } from "react";
import styles from "./StudentList.module.css";
import { useNavigate } from "react-router-dom";
import SearchBar from "../../Molecules/SearchBar/SearchBar";
import { getStudents, getRegistrationOptions } from "../../../services/api";
import Pagination from "../../Molecules/Pagination/Pagination";
import ColumnHeader from "../../Molecules/ColumnHeader/ColumnHeader";
import placeholder from "../../../assets/user.svg";
import infoIcon from "../../../assets/info_icon.svg";
import ResetFilterButton from "../../Atoms/ResetFilterButton/ResetFilterButton";
import AutoGraduatePopup from "../../Molecules/PopUp/PopUpAutoGraduate/PopUpAutoGraduate";

const ITEMS_PER_PAGE = 25;
const REFRESH_INTERVAL = 5000;

const StudentRow = ({ student, onClick }) => {
  const enrollmentStyle =
    student.enrollment_status === "ACTIVE" ? styles.active : styles.status;

  const statusStyle = styles.status;

  return (
    <div className={styles.studentDataRow} onClick={onClick}>
      <div className={styles.tableCell}>
        <img
          src={student.photo_url || placeholder}
          alt=""
          className={student.photo_url ? styles.photo : styles.placeholderPhoto}
        />
      </div>
      <div className={styles.tableCell} title={student.student_id}>
        {student.student_id}
      </div>
      <div className={styles.tableCell} title={student.full_name}>
        {student.full_name}
      </div>
      <div className={styles.tableCell} title={student.grade}>
        {student.grade}
      </div>
      <div className={styles.tableCell} title={student.section_name}>
        {student.section_name}
      </div>
      <div className={styles.tableCell} title={student.school_year}>
        {student.school_year}
      </div>
      <div className={styles.tableCell}>
        <div className={enrollmentStyle}>
          <div className={styles.statusText}>{student.enrollment_status}</div>
        </div>
      </div>
      <div className={styles.tableCell}>
        <div className={statusStyle}>
          <div className={styles.statusText}>{student.student_status}</div>
        </div>
      </div>
    </div>
  );
};

const StudentList = () => {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({});

  const [sorts, setSorts] = useState([]);
  const [showAutoGraduate, setShowAutoGraduate] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    sections: [],
    classes: [],
    schoolYears: [],
    enrollmentStatus: [
      { id: "ACTIVE", name: "Active" },
      { id: "INACTIVE", name: "Inactive" },
    ],
    studentStatus: [
      { id: "Not Graduate", name: "Not Graduate" },
      { id: "Graduate", name: "Graduate" },
      { id: "Withdraw", name: "Withdraw" },
      { id: "Expelled", name: "Expelled" },
    ],
  });

  const fetchStudents = useCallback(
    async (page = 1, options = {}) => {
      const { isBackgroundRefresh = false } = options;
      if (!isBackgroundRefresh) setLoading(true);

      try {
        const allParams = {
          ...filters,
          search: search || undefined,
          search_name: search ? undefined : filters.search_name || undefined,
          sort: sorts.length > 0 ? sorts : undefined,
          page: page,
          per_page: ITEMS_PER_PAGE,
        };

        const res = await getStudents(allParams);
        const data = res.data?.data || [];
        setStudentData(data);
        setTotalPages(res.data?.last_page || 1);
        setCurrentPage(res.data?.current_page || 1);
      } catch (err) {
        console.error("Error fetching student data:", err);
      } finally {
        if (!isBackgroundRefresh) setLoading(false);
      }
    },
    [search, filters, sorts]
  );

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const opts = await getRegistrationOptions();
        setFilterOptions((prev) => ({
          ...prev,
          sections: opts.sections || [],
          classes: opts.classes || [],
          schoolYears: opts.school_years || [],
        }));
      } catch (err) {
        console.error("Error fetching registration options:", err);
      }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (search && filters.search_name) {
      setFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.search_name;
        return newFilters;
      });
    }
  }, [search, filters.search_name, setFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);

      if (search || !filters.search_name) {
        fetchStudents(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filters.search_name, fetchStudents]);

  useEffect(() => {
    if (search) return;
    fetchStudents(1);
  }, [filters, sorts, fetchStudents, search]);

  useEffect(() => {
    const refreshData = () => {
      console.log("Auto refreshing student list (background)...");
      fetchStudents(currentPage, {
        isBackgroundRefresh: true,
      });
    };

    const intervalId = setInterval(refreshData, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [currentPage, fetchStudents]);

  const handlePageChange = (page) => {
    fetchStudents(page);
  };

  const handleSortChange = (fieldKey) => {
    setSorts((prev) => {
      const current = prev[0]?.field === fieldKey ? prev[0] : null;
      let next;
      if (!current) next = { field: fieldKey, order: "asc" };
      else if (current.order === "asc")
        next = { field: fieldKey, order: "desc" };
      else next = null;

      const newSorts = next ? [next] : [];
      return newSorts;
    });
  };

  const handleFilterChange = (filterKey, selectedValue) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters };
      const isArray = Array.isArray(selectedValue);

      if (isArray && selectedValue.length > 0) {
        newFilters[filterKey] = selectedValue;
      } else if (!isArray && selectedValue) {
        newFilters[filterKey] = selectedValue;
      } else {
        delete newFilters[filterKey];
      }

      if (filterKey === "search_name" && selectedValue) {
        setSearch("");
      }

      return newFilters;
    });
  };

  const getSortOrder = (fieldKey) => {
    return sorts.find((s) => s.field === fieldKey)?.order;
  };

  return (
    <div className={styles.studentListContainer}>
      <div>
        <h1 className={styles.pageTitle}>Student List</h1>
        <div className={styles.searchAndFilterContainer}>
          <SearchBar
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find name or student id"
          />
          <ResetFilterButton
            onClick={() => {
              setSearch("");
              setFilters({});
              setSorts([]);
            }}
          />
        </div>
      </div>

      <div>
        <div className={styles.autoGraduateParent}>
          <div
            className={styles.autoGraduate}
            onClick={() => setShowAutoGraduate(true)}
            style={{ cursor: "pointer" }}
          >
            Auto Graduate
          </div>
          <img className={styles.infoIcon} alt="Info" src={infoIcon} />
        </div>

        <div className={styles.tableContainer}>
          <div className={styles.tableHeaderGrid}>
            <ColumnHeader
              title="Photo"
              hasSort={true}
              hasFilter={true}
              disableFilter={true}
              disableSort={true}
            />

            <ColumnHeader
              title="Student ID"
              hasSort={true}
              fieldKey="student_id"
              sortOrder={getSortOrder("student_id")}
              onSort={handleSortChange}
              hasFilter={false}
            />
            <ColumnHeader
              title="Student Name"
              hasSort={true}
              fieldKey="full_name"
              sortOrder={getSortOrder("full_name")}
              onSort={handleSortChange}
              hasFilter={true}
              filterType="search"
              filterKey="search_name"
              onFilterChange={handleFilterChange}
              currentFilterValue={filters.search_name}
            />
            <ColumnHeader
              title="Grade"
              hasSort={true}
              fieldKey="grade"
              sortOrder={getSortOrder("grade")}
              onSort={handleSortChange}
              hasFilter={true}
              filterKey="class_id"
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions.classes}
              valueKey="class_id"
              labelKey="grade"
              currentFilterValue={filters.class_id}
            />
            <ColumnHeader
              title="Section"
              hasSort={true}
              fieldKey="section"
              sortOrder={getSortOrder("section")}
              onSort={handleSortChange}
              hasFilter={true}
              filterKey="section_id"
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions.sections}
              valueKey="section_id"
              labelKey="name"
              currentFilterValue={filters.section_id}
            />
            <ColumnHeader
              title="School Year"
              hasSort={true}
              hasFilter={true}
              filterKey="school_year_id"
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions.schoolYears}
              valueKey="school_year_id"
              labelKey="year"
              disableSort={true}
              currentFilterValue={filters.school_year_id}
              singleSelect={true}
            />
            <ColumnHeader
              title="Enrollment"
              hasSort={true}
              fieldKey="enrollment_status"
              sortOrder={getSortOrder("enrollment_status")}
              onSort={handleSortChange}
              hasFilter={true}
              filterKey="enrollment_status"
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions.enrollmentStatus}
              valueKey="id"
              labelKey="name"
              currentFilterValue={filters.enrollment_status}
            />
            <ColumnHeader
              title="Status"
              hasSort={true}
              fieldKey="student_status"
              sortOrder={getSortOrder("student_status")}
              onSort={handleSortChange}
              hasFilter={true}
              filterKey="student_status" // (Backend filter key)
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions.studentStatus}
              valueKey="id"
              labelKey="name"
              currentFilterValue={filters.student_status}
            />
          </div>

          <div className={styles.tableBody}>
            {loading ? (
              <div className={styles.messageCell}>Loading...</div>
            ) : studentData.length > 0 ? (
              studentData.map((student) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  onClick={() =>
                    navigate(`/students/${student.id}`, {
                      state: { fromList: true },
                    })
                  }
                />
              ))
            ) : (
              <div className={styles.messageCell}>No data available</div>
            )}
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
      {showAutoGraduate && (
        <AutoGraduatePopup
          onClose={() => setShowAutoGraduate(false)}
          onSuccess={() => fetchStudents(currentPage)}
        />
      )}
    </div>
  );
};

export default StudentList;
