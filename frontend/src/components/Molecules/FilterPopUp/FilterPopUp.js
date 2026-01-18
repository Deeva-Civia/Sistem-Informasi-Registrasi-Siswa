import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import styles from "./FilterPopUp.module.css";

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

const FilterPopup = ({
  options = [],
  valueKey,
  labelKey,
  onSubmit,
  onClose,
  filterType = "checkbox",
  filterKey,
  className = "",
  initialValue,
  singleSelect = false,
}) => {
  const popupRef = useRef(null);
  const [popupStyle, setPopupStyle] = useState({ opacity: 0 });

  const [selected, setSelected] = useState(() => {
    return filterType === "checkbox" && Array.isArray(initialValue)
      ? initialValue
      : [];
  });

  const [searchTerm, setSearchTerm] = useState(() => {
    return filterType === "search" && typeof initialValue === "string"
      ? initialValue
      : "";
  });

  const [startDate, setStartDate] = useState(() => {
    return filterType === "date-range" && Array.isArray(initialValue)
      ? initialValue[0] || ""
      : "";
  });
  const [endDate, setEndDate] = useState(() => {
    return filterType === "date-range" && Array.isArray(initialValue)
      ? initialValue[1] || ""
      : "";
  });
  const [minVal, setMinVal] = useState(() => {
    return filterType === "number-range" && Array.isArray(initialValue)
      ? initialValue[0] || ""
      : "";
  });
  const [maxVal, setMaxVal] = useState(() => {
    return filterType === "number-range" && Array.isArray(initialValue)
      ? initialValue[1] || ""
      : "";
  });

  useClickOutside(popupRef, onClose);

  // FIXED: Hanya tutup popup jika scroll BUKAN dari dalam popup
  useEffect(() => {
    const handleResizeOrScroll = (event) => {
      // Cek apakah scroll berasal dari dalam popup
      if (popupRef.current && popupRef.current.contains(event.target)) {
        return; // Jangan tutup popup jika scroll dari dalam popup
      }

      if (onClose) {
        onClose();
      }
    };

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [onClose]);

  useLayoutEffect(() => {
    if (popupRef.current) {
      const parentElement = popupRef.current.parentElement;

      if (parentElement) {
        const rect = parentElement.getBoundingClientRect();
        const popupRect = popupRef.current.getBoundingClientRect();
        let top = rect.bottom + 4;
        let left = rect.right - popupRect.width;
        if (left < 10) left = 10;

        setPopupStyle({
          position: "fixed",
          top: `${top}px`,
          left: `${left}px`,
          opacity: 1,
          zIndex: 9999,
        });
      }
    }
  }, []);

  const handleToggle = (value) => {
    if (singleSelect) {
      setSelected((prev) => (prev.includes(value) ? [] : [value]));
    } else {
      setSelected((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      );
    }
  };

  const handleApplyClick = () => {
    if (filterType === "checkbox") {
      onSubmit(selected);
    } else if (filterType === "search") {
      onSubmit(searchTerm);
    } else if (filterType === "date-range") {
      onSubmit([startDate, endDate]);
    } else if (filterType === "number-range") {
      onSubmit([minVal, maxVal]);
    }
    onClose();
  };

  const handleResetClick = () => {
    if (filterType === "checkbox") {
      setSelected([]);
      onSubmit([]);
    } else if (filterType === "search") {
      setSearchTerm("");
      onSubmit("");
    } else if (filterType === "date-range") {
      setStartDate("");
      setEndDate("");
      onSubmit(["", ""]);
    } else if (filterType === "number-range") {
      setMinVal("");
      setMaxVal("");
      onSubmit(["", ""]);
    }
  };

  const getSearchPlaceholder = () => {
    if (filterKey === "search_id") return "Enter Registration ID...";
    if (filterKey === "search_name") return "Enter Student name...";
    if (filterKey === "search_family_rank") return "Enter rank number...";
    if (filterKey === "search_religion") return "Enter religion...";
    if (filterKey === "search_country") return "Enter country...";
    if (filterKey === "search_father") return "Enter father name...";
    if (filterKey === "search_mother") return "Enter mother name...";

    return "Enter text...";
  };

  return (
    <div
      className={`${styles.popupContainer} ${className}`}
      ref={popupRef}
      style={popupStyle}
    >
      <div className={styles.popupHeader}>
        <span>Filter by</span>
        <button onClick={onClose} className={styles.closeBtn}>
          &times;
        </button>
      </div>

      <div className={styles.popupBody}>
        {filterType === "date-range" ? (
          <div className={styles.dateRangePopupBody}>
            <label className={styles.dateLabel}>Start Date</label>
            <input
              type="date"
              className={styles.dateInput}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <label className={styles.dateLabel} style={{ marginTop: "10px" }}>
              End Date
            </label>
            <input
              type="date"
              className={styles.dateInput}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        ) : filterType === "number-range" ? (
          <div className={styles.dateRangePopupBody}>
            <label className={styles.dateLabel}>Min Age</label>
            <input
              type="number"
              placeholder="Min"
              className={styles.dateInput}
              value={minVal}
              onChange={(e) => setMinVal(e.target.value)}
            />
            <label className={styles.dateLabel} style={{ marginTop: "10px" }}>
              Max Age
            </label>
            <input
              type="number"
              placeholder="Max"
              className={styles.dateInput}
              value={maxVal}
              onChange={(e) => setMaxVal(e.target.value)}
            />
          </div>
        ) : filterType === "search" ? (
          <div className={styles.searchPopupBody}>
            <input
              type="text"
              className={styles.searchInputPopup}
              placeholder={getSearchPlaceholder()}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        ) : options.length > 0 ? (
          options.map((opt) => {
            const value = opt[valueKey];
            const label = opt[labelKey];
            return (
              <label key={value} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selected.includes(value)}
                  onChange={() => handleToggle(value)}
                  className={styles.checkboxInput}
                />
                <span className={styles.customCheckbox}></span>
                {label}
              </label>
            );
          })
        ) : (
          <div className={styles.noOptions}>No options available</div>
        )}
      </div>

      <div className={styles.popupFooter}>
        <button onClick={handleResetClick} className={styles.resetBtn}>
          Reset
        </button>
        <div className={styles.actionBtnGroup}>
          <button onClick={onClose} className={styles.actionBtn}>
            Cancel
          </button>
          <button onClick={handleApplyClick} className={styles.applyBtn}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPopup;
