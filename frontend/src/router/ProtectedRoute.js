// src/router/ProtectedRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Komponen ini berfungsi sebagai "penjaga" rute.
 * Ia hanya memeriksa apakah pengguna sudah login (memiliki token).
 * @param {object} props
 * @param {React.ReactNode} props.children - Komponen halaman yang akan ditampilkan jika login berhasil.
 */
const ProtectedRoute = ({ children }) => {
  // 1. Cek apakah ada token di localStorage
  const token = localStorage.getItem('token');

  // 2. Jika TIDAK ada token, paksa kembali ke halaman login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 3. Jika ada token, izinkan akses ke halaman yang dituju
  return children;
};

export default ProtectedRoute;