import React from "react";
import styles from "./TableHeaderController.module.css";
import Checkbox from "../../Atoms/Checkbox/Checkbox";
import SortButton from "../../Atoms/SortButton/SortButton";
import FilterButton from "../../Atoms/FilterButton/FilterButton";
import DragHandle from "../../Atoms/DragHandle/DragHandle";

const TableHeaderController = React.forwardRef(
  (
    {
      title,
      isChecked,
      onChange,
      controlsDisabled = false,
      showCheckbox = true,
      style,
      listeners,
      sortDirection = "none",
      onSortClick,
      isFilterActive = false,
      isFilterApplied = false,
      onFilterClick,
      showFilterPopup = false,
      filterPopupNode = null,
      disableSort = false,
      disableFilter = false,
      ...props
    },
    ref
  ) => {
    return (
      <th
        className={styles.tableHeaderController}
        ref={ref}
        style={style}
        {...props}
      >
        <div className={styles.headerLayout}>
          <DragHandle listeners={listeners} />
          <div className={styles.headerContent}>
            <div className={styles.headerActions}>
              {showCheckbox && (
                <Checkbox checked={isChecked} onChange={onChange} />
              )}
              <>
                <SortButton
                  disabled={disableSort || controlsDisabled}
                  direction={sortDirection}
                  onClick={onSortClick}
                />
                <FilterButton
                  disabled={disableFilter || controlsDisabled}
                  onClick={onFilterClick}
                  isActive={isFilterActive}
                  isApplied={isFilterApplied}
                />
              </>
            </div>
            <span className={styles.headerTitle}>{title}</span>
          </div>
        </div>
        {showFilterPopup && filterPopupNode}
      </th>
    );
  }
);

export default TableHeaderController;
