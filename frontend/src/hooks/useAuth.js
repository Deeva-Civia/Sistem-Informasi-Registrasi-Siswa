// eslint-disable-next-line
import { useState, useEffect } from 'react';

const getInitialUser = () => {
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      return JSON.parse(userString);
    } catch (e) {
      console.error('Error parsing user data from localStorage', e);
      return null;
    }
  }
  return null;
};

const useAuth = () => {
  // eslint-disable-next-line
  const [user, setUser] = useState(getInitialUser);

  const isUserRole = (role) => {
    return user && user.role === role;
  };

  const isAdmin = () => isUserRole('admin');
  const isRegistrar = () => isUserRole('registrar');
  const isHeadRegistrar = () => isUserRole('head_registrar');
  const isTeacher = () => isUserRole('teacher');
  
  return {
    user,
    isAdmin,
    isRegistrar,
    isUserRole,
    isHeadRegistrar, 
    isTeacher,
  };
};

export default useAuth;