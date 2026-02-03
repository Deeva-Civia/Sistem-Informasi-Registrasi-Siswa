import React from "react";
import logoBlue from "../../../assets/logo-mis-f.png";
import logoWhite from "../../../assets/logoWhite.png"; 
import "./Logo.css";

const Logo = ({ variant = "blue", isCard = false, className = "" }) => {
  const src = variant === "white" ? logoWhite : logoBlue;

  if (isCard) {
    return (
      <img
        src={src}
        alt="Manado Independent School"
        className={className} 
      />
    );
  }

  return (
    <div className="logo-container">
      <img
        src={src}
        alt="Manado Independent School"
        className={`logo-img ${className}`}
      />
    </div>
  );
};

export default Logo;