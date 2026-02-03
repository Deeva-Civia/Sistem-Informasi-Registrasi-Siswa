import React from 'react';
import '../../Styles/Controls.css';
import filterIcon from '../../../assets/filter.svg';
import filterActiveIcon from '../../../assets/filterActive.svg'; // ⬅️ Tambahkan

const FilterButton = ({
  disabled = false,
  onClick,
  title = 'Filter',
  isActive = false,
  isApplied = false,
}) => {
  const iconSrc = isActive || isApplied ? filterActiveIcon : filterIcon;

  return (
    <button
      type='button'
      className={`control-btn ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      aria-label={title}
      title={title}
      disabled={disabled}
    >
      <img
        src={iconSrc}
        alt='Filter Icon'
        width='24'
        height='24'
        style={{ transition: 'filter 0.2s ease, transform 0.2s ease' }}
      />
    </button>
  );
};

export default FilterButton;

