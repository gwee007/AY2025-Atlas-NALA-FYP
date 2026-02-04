import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';

const AuthContext = createContext(null);

// Initialize auth state synchronously from localStorage to eliminate loading delay
const getInitialAuthState = () => {
  const storedUserId = localStorage.getItem('userId');
  const storedAuth = localStorage.getItem('isAuthenticated');
  
  if (storedUserId && storedAuth === 'true') {
    return { isAuthenticated: true, userId: storedUserId };
  }
  
  // Clear any inconsistent localStorage data
  localStorage.removeItem('userId');
  localStorage.removeItem('isAuthenticated');
  return { isAuthenticated: false, userId: null };
};

export function AuthProvider({ children }) {
  const initialState = useMemo(() => getInitialAuthState(), []);
  const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated);
  const [userId, setUserId] = useState(initialState.userId);

  // Add a storage event listener to detect logout in other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'isAuthenticated' && e.newValue !== 'true') {
        setIsAuthenticated(false);
        setUserId(null);
      }
      if (e.key === 'userId' && !e.newValue) {
        setIsAuthenticated(false);
        setUserId(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (newUserId) => {
    setUserId(newUserId);
    setIsAuthenticated(true);
    localStorage.setItem('userId', newUserId);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const logout = () => {
    setUserId(null);
    setIsAuthenticated(false);
    localStorage.removeItem('userId');
    localStorage.removeItem('isAuthenticated');
    // Clear any other potential auth-related data
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
