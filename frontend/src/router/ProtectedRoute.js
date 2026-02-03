import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;