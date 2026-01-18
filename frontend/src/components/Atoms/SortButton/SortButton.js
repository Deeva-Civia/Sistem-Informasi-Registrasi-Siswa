// SortButton.js
import React from 'react';
import '../../Styles/Controls.css';
import sortIcon from '../../../assets/sort.svg';
import bawahIcon from '../../../assets/bawah.svg';
import atasIcon from '../../../assets/atas.svg';
import './SortButton.css';

const SortButton = ({
  disabled = false,
  direction = 'none',
  onClick,
  title = 'Sort',
}) => {
  let iconSrc = sortIcon; // default (none)
  if (direction === 'asc') iconSrc = bawahIcon;
  else if (direction === 'desc') iconSrc = atasIcon;

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
        alt={`Sort ${direction}`}
        width='20'
        height='20'
        className={`sort-icon ${direction}`}
      />
    </button>
  );
};

export default SortButton;

