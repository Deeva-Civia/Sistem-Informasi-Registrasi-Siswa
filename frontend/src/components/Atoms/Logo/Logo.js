import React from "react";
// Import kedua logo
import logoBlue from "../../../assets/logo-mis-f.png";
import logoWhite from "../../../assets/logoWhite.png"; // Pastikan file ini ada sesuai list assets
import "./Logo.css";

const Logo = ({ variant = "blue", isCard = false, className = "" }) => {
  // Tentukan source gambar berdasarkan variant
  const src = variant === "white" ? logoWhite : logoBlue;

  // Jika digunakan di ID Card, render gambar langsung tanpa container .logo-container
  // agar CSS layout ID Card bisa mengontrol penuh ukurannya.
  if (isCard) {
    return (
      <img
        src={src}
        alt="Manado Independent School"
        className={className} // Class dari parent (IdCard module css) akan masuk ke sini
      />
    );
  }

  // Default render untuk Login dan HeaderBar (dengan container asli)
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
