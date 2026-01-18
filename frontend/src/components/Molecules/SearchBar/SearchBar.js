import React from 'react';
import styles from './SearchBar.module.css';
import searchIcon from "../../../assets/Search-icon.png"; 

const SearchBar = ({ value, onChange, placeholder, className }) => {
  return (
    <div className={`${styles.searchBar} ${className || ''}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={styles.searchInput}
      />
      <img
        src={searchIcon}
        alt="Search"
        className={styles.searchIcon}
      />
    </div>
  );
};

export default SearchBar;

