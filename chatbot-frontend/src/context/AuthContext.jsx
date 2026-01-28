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
    }
    setLoading(false);
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
