import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check if user is logged in by looking at localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  if (!currentUser || !currentUser.isLoggedIn) {
    // Redirect them to the login page if not logged in
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;