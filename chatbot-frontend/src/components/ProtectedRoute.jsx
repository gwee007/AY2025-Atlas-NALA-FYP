import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Extra security: Check localStorage directly in case of state inconsistency
  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUserId = localStorage.getItem('userId');
    
    if (!storedAuth || storedAuth !== 'true' || !storedUserId) {
      // Clear any inconsistent state
      localStorage.removeItem('userId');
      localStorage.removeItem('isAuthenticated');
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check both context state and localStorage for double security
  const storedAuth = localStorage.getItem('isAuthenticated');
  const storedUserId = localStorage.getItem('userId');
  
  if (!isAuthenticated || !storedAuth || storedAuth !== 'true' || !storedUserId) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
