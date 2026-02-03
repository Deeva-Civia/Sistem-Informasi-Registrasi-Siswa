import styles from './ResetFilterButton.module.css';


const ResetFilterButton = ({ onClick }) => {
	return (
		<div className={styles.resetFilters} onClick={onClick}>Reset Filters</div>
  	);
};

export default ResetFilterButton;
