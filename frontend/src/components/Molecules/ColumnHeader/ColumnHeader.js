import React, { useState } from "react"; 
import styles from "./ColumnHeader.module.css";
import SortButton from "../../Atoms/SortButton/SortButton";
import FilterButton from "../../Atoms/FilterButton/FilterButton"; 
import FilterPopup from "../FilterPopUp/FilterPopUp"; 

const ColumnHeader = ({
  title,
  hasSort = false,
  hasFilter = false,
  disableTitleOnNoActions = false,
  fieldKey,
  filterKey,
  sortOrder,
  onSort,
  onFilterChange,
  filterOptions = [],
  valueKey,
  labelKey,
  filterType,
  currentFilterValue,
  disableSort = false,
  disableFilter = false,
  singleSelect = false,
}) => {
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isFilterApplied = () => {
    if (!currentFilterValue) {
      return false;
    }

    if (filterType === "date-range") {
      return (
        Array.isArray(currentFilterValue) &&
        (currentFilterValue[0] || currentFilterValue[1])
      );
    }

    if (filterType === "checkbox") {
      return Array.isArray(currentFilterValue) && currentFilterValue.length > 0;
    }

    if (filterType === "search") {
      return (
        typeof currentFilterValue === "string" &&
        currentFilterValue.trim().length > 0
      );
    }

    return true;
  };
  const showActions = hasSort || hasFilter;

  const handleSortClick = () => {
    if (disableSort) return; 
    if (onSort) {
      onSort(fieldKey);
    }
  };

  const handleFilterToggle = () => {
    if (disableFilter) return; 
    setIsFilterOpen((prev) => !prev);
  };

  const handleFilterSubmit = (selectedValues) => {
    if (onFilterChange) {
      onFilterChange(filterKey, selectedValues);
    }
  };

  return (
    <div className={styles.columnController}>
      <div className={styles.columnName}>
        <div
          className={`${styles.loremIpsum} ${
            !showActions && disableTitleOnNoActions ? styles.titleDisabled : ""
          }`}
        >
          {title}
        </div>
      </div>

      <div
        className={`${styles.action} ${
          !showActions ? styles.disabledAction : ""
        }`}
      >
        {hasSort && (
          <div
            className={`${styles.control} ${
              disableSort ? styles.isDisabled : ""
            }`}
            title={disableSort ? "Sort disabled" : undefined}
          >
            <SortButton
              direction={sortOrder || "none"}
              onClick={handleSortClick}
            />
          </div>
        )}

        {hasFilter && (
          <div
            className={`${styles.control} ${
              disableFilter ? styles.isDisabled : ""
            }`}
            title={disableFilter ? "Filter disabled" : undefined}
          >
            <FilterButton
              onClick={handleFilterToggle}
              isActive={isFilterOpen}
              isApplied={isFilterApplied()}
            />
          </div>
        )}
        {hasFilter && isFilterOpen && (
          <FilterPopup
            options={filterOptions}
            valueKey={valueKey}
            labelKey={labelKey}
            onSubmit={handleFilterSubmit}
            onClose={() => setIsFilterOpen(false)}
            filterType={filterType}
            filterKey={filterKey}
            className={filterType === "date-range" ? styles.popupDateRange : ""}
            initialValue={currentFilterValue}
            singleSelect={singleSelect}
          />
        )}
      </div>
    </div>
  );
};

export default ColumnHeader;

