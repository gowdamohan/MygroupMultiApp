import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * DashboardRouter Component
 * Routes users to appropriate dashboard based on their role
 */
export default function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Get user roles from groups array
  const userRoles = user.groups ? user.groups.map(g => g.name) : [];

  // Route based on user role (check in priority order)
  if (userRoles.includes('admin') || userRoles.includes('groups')) {
    return <Navigate to="/dashboard/admin" replace />;
  }

  if (userRoles.includes('corporate')) {
    return <Navigate to="/dashboard/corporate" replace />;
  }

  if (userRoles.includes('head_office') || userRoles.includes('regional') || userRoles.includes('branch')) {
    return <Navigate to="/dashboard/franchise" replace />;
  }

  if (userRoles.includes('labor')) {
    return <Navigate to="/dashboard/labor" replace />;
  }

  if (userRoles.includes('partner')) {
    return <Navigate to="/dashboard/partner" replace />;
  }

  if (userRoles.includes('reporter')) {
    return <Navigate to="/dashboard/reporter" replace />;
  }

  if (userRoles.includes('client') || userRoles.includes('client_god')) {
    return <Navigate to="/dashboard/client" replace />;
  }

  // Default to client dashboard for unknown roles
  return <Navigate to="/dashboard/client" replace />;
}

