import React from 'react';
import iconPeopleSolid from '../../../assets/icon_people_solid.svg';
import iconPeopleBlue from '../../../assets/icon_people_blue.svg';
import cardButtonSolid from '../../../assets/card_button_solid.svg';
import cardButtonBlue from '../../../assets/card_button_blue.svg';
import './StatCard.css';

const StatCard = ({ value, label, variant, footerText, onClick, style }) => {
  
  let variantClass;
  let headerIcon, valueIcon;

  if (variant === 'blue') {
    variantClass = 'blue';
    headerIcon = cardButtonBlue;
    valueIcon = iconPeopleBlue;
  } else {
    variantClass = 'gradient';
    headerIcon = cardButtonSolid;
    valueIcon = iconPeopleSolid;
  }

  const clickableClass = onClick ? 'clickable' : '';

  return (
    <div 
      className={`stat-card ${variantClass} ${clickableClass}`}
      onClick={onClick}
      style={style} 
    >
      <div className="card-main">
        <div className="card-header">
          <div className="card-label">{label}</div>
          <img src={headerIcon} alt="Card Button" className="card-icon-header" />
        </div>
        <div className="card-value-row">
          <div className="card-value">{value}</div>
          <img src={valueIcon} alt="People Icon" className="card-icon-value" />
        </div>
      </div>
      {footerText && (
        <div className="card-footer">{footerText}</div>
      )}
    </div>
  );
};

export default StatCard;

