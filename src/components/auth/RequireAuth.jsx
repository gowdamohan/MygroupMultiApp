import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { buildLoginRedirectUrl } from '../../utils/authRedirect';
import AuthLoadingScreen from './AuthLoadingScreen';

/**
 * Authentication gate — redirects unauthenticated users to the role-appropriate login.
 * Also checks localStorage token as fallback for the mobile AuthModal flow
 * which stores tokens directly without updating AuthContext.
 */
export default function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const hasToken = !!localStorage.getItem('accessToken');

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated && !hasToken) {
    const target = buildLoginRedirectUrl(location.pathname, location.search);
    return <Navigate to={target} replace state={{ from: location }} />;
  }

  return children;
}
