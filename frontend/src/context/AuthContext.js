import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('admin_token'));

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/login`, {
        email,
        password
      });
      const { access_token } = response.data;
      localStorage.setItem('admin_token', access_token);
      setToken(access_token);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Erreur de connexion' };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setIsAuthenticated(false);
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};