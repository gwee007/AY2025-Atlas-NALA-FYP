import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on mount (from localStorage)
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedAuth = localStorage.getItem('isAuthenticated');
    
    if (storedUserId && storedAuth === 'true') {
      setUserId(storedUserId);
      setIsAuthenticated(true);
    } else {
      // Clear any inconsistent localStorage data
      localStorage.removeItem('userId');
      localStorage.removeItem('isAuthenticated');
    }
    setLoading(false);
  }, []);

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
    <AuthContext.Provider value={{ isAuthenticated, userId, loading, login, logout }}>
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
