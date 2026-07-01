import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { clearAuthStorage, persistAuthStorage } from '../utils/authSession';

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

  const clearAuth = useCallback(() => {
    clearAuthStorage();
    setUser(null);
    setSessionTimeout(null);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) localStorage.removeItem('user');
        setUser(null);
        return;
      }

      try {
        const response = await authAPI.getProfile();
        const userData = response.data.data || response.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (apiError) {
        console.error('API profile fetch failed:', apiError);
        clearAuth();
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      clearAuth();
    }
  }, [clearAuth]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await checkAuth();
      if (!cancelled) setLoading(false);
    })();

    const timeoutId = setTimeout(() => {
      setSessionTimeout(true);
    }, 55 * 60 * 1000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [checkAuth]);

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);
      const { user: userData, accessToken, refreshToken } = response.data.data;

      persistAuthStorage(userData, accessToken, refreshToken);
      setUser(userData);

      return { success: true, user: userData };
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
      const { user: newUser, accessToken, refreshToken } = response.data.data;

      persistAuthStorage(newUser, accessToken, refreshToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuth();
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
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
    clearAuth,
    checkAuth,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
