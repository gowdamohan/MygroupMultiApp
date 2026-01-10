import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionTimeout, setSessionTimeout] = useState(null);

  useEffect(() => {
    checkAuth();

    // Set up session timeout warning (55 minutes - 5 min before token expires)
    const timeoutId = setTimeout(() => {
      setSessionTimeout(true);
    }, 55 * 60 * 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        // If we have both token and stored user, use the stored user
        // This handles app login scenario where profile endpoint may not exist
        setUser(JSON.parse(storedUser));
      } else if (token) {
        // Try to get profile from API only if we have token but no stored user
        try {
          const response = await authAPI.getProfile();
          const userData = response.data.data || response.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (apiError) {
          console.error('API profile fetch failed:', apiError);
          // Clear tokens if profile fetch fails
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      } else if (storedUser) {
        // If no token but we have stored user, clear it
        localStorage.removeItem('user');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);
      const { user, accessToken, refreshToken } = response.data.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      const { user, accessToken, refreshToken } = response.data.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Call logout API to invalidate session on server
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Always clear local storage and user state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setSessionTimeout(null);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    sessionTimeout,
    login,
    register,
    logout,
    updateUser,
    clearError,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

