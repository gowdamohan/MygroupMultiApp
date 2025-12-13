import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './pages/HomePage';
import { AdminLogin } from './pages/auth/AdminLogin';
import { ClientLogin } from './pages/auth/ClientLogin';
import { GroupAdminLogin } from './pages/auth/GroupAdminLogin';
import { GodLogin } from './pages/auth/GodLogin';
import { PartnerLogin } from './pages/auth/PartnerLogin';
import { PartnerRegister } from './pages/auth/PartnerRegister';
import { RegistrationForm } from './pages/auth/RegistrationForm';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { AdminDashboardNew } from './pages/dashboard/AdminDashboardNew';
import { ClientDashboard } from './pages/dashboard/ClientDashboard';
import { CorporateDashboard } from './pages/dashboard/CorporateDashboard';
import { FranchiseDashboard } from './pages/dashboard/FranchiseDashboard';
import { LaborDashboard } from './pages/dashboard/LaborDashboard';
import { MediaChannelDashboard } from './pages/dashboard/MediaChannelDashboard';
import { PartnerDashboard } from './pages/dashboard/PartnerDashboard';
import { AppDashboard } from './pages/app/AppDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// New Layout Components
import AdminDashboardLayout from './layouts/AdminDashboardLayout';
import ClientDashboardLayout from './layouts/ClientDashboardLayout';
import Overview from './pages/dashboard/Overview';
import Users from './pages/dashboard/Users';

// Auth Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardRouter from './components/auth/DashboardRouter';
import RequireAuth from './components/auth/RequireAuth';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Home */}
          <Route path="/" element={<HomePage />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Dashboard Router - Auto-routes based on role */}
          <Route path="/dashboard" element={
            <RequireAuth>
              <DashboardRouter />
            </RequireAuth>
          } />

          {/* Admin Dashboard with Layout - Protected */}
          <Route path="/dashboard/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'groups', 'corporate', 'head_office', 'regional', 'branch']}>
              <AdminDashboardNew />
            </ProtectedRoute>
          } />

          {/* Admin Sub-Routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['admin', 'groups', 'corporate', 'head_office', 'regional', 'branch']}>
              <AdminDashboardNew />
            </ProtectedRoute>
          } />

          {/* Client Dashboard with Layout - Protected */}
          <Route path="/dashboard/client" element={
            <ProtectedRoute allowedRoles={['client', 'client_god']}>
              <ClientDashboard />
            </ProtectedRoute>
          } />

          {/* Client Sub-Routes */}
          <Route path="/client/*" element={
            <ProtectedRoute allowedRoles={['client', 'client_god']}>
              <ClientDashboard />
            </ProtectedRoute>
          } />

          {/* Corporate Dashboard - Protected */}
          <Route path="/dashboard/corporate" element={
            <ProtectedRoute allowedRoles={['corporate']}>
              <CorporateDashboard />
            </ProtectedRoute>
          } />

          {/* Corporate Sub-Routes */}
          <Route path="/corporate/*" element={
            <ProtectedRoute allowedRoles={['corporate']}>
              <CorporateDashboard />
            </ProtectedRoute>
          } />

          {/* Franchise Dashboard - Protected */}
          <Route path="/dashboard/franchise" element={
            <ProtectedRoute allowedRoles={['head_office', 'regional', 'branch']}>
              <FranchiseDashboard />
            </ProtectedRoute>
          } />

          {/* Franchise Sub-Routes */}
          <Route path="/franchise/*" element={
            <ProtectedRoute allowedRoles={['head_office', 'regional', 'branch']}>
              <FranchiseDashboard />
            </ProtectedRoute>
          } />

          {/* Labor Dashboard - Protected */}
          <Route path="/dashboard/labor" element={
            <ProtectedRoute allowedRoles={['labor']}>
              <LaborDashboard />
            </ProtectedRoute>
          } />

          {/* Labor Sub-Routes */}
          <Route path="/labor/*" element={
            <ProtectedRoute allowedRoles={['labor']}>
              <LaborDashboard />
            </ProtectedRoute>
          } />

          {/* Media Channel Dashboard - Protected */}
          <Route path="/dashboard/media" element={
            <ProtectedRoute allowedRoles={['client', 'client_god', 'media']}>
              <MediaChannelDashboard />
            </ProtectedRoute>
          } />

          {/* Media Sub-Routes */}
          <Route path="/media/*" element={
            <ProtectedRoute allowedRoles={['client', 'client_god', 'media']}>
              <MediaChannelDashboard />
            </ProtectedRoute>
          } />

          {/* Partner Dashboard - Protected */}
          <Route path="/dashboard/partner" element={
            <ProtectedRoute allowedRoles={['partner']}>
              <PartnerDashboard />
            </ProtectedRoute>
          } />

          {/* Partner Sub-Routes */}
          <Route path="/partner/*" element={
            <ProtectedRoute allowedRoles={['partner']}>
              <PartnerDashboard />
            </ProtectedRoute>
          } />

          {/* Reporter Dashboard - Protected */}
          <Route path="/dashboard/reporter" element={
            <ProtectedRoute allowedRoles={['reporter']}>
              <div className="p-6">Reporter Dashboard (Coming Soon)</div>
            </ProtectedRoute>
          } />

          {/* Original Authentication Routes */}
          <Route path="/auth/login" element={<AdminLogin />} />
          <Route path="/auth/admin" element={<AdminLogin />} />
          <Route path="/admin/login" element={<GroupAdminLogin />} />
          <Route path="/god-login/:groupName/:subGroup" element={<GodLogin />} />
          <Route path="/client-login/:groupName" element={<ClientLogin />} />
          <Route path="/media-login/:groupName" element={<ClientLogin />} />
          <Route path="/partner" element={<PartnerLogin />} />
          <Route path="/partner/register" element={<PartnerRegister />} />
          <Route path="/reporter/login" element={<AdminLogin />} />
          <Route path="/register-form/:groupName" element={<RegistrationForm />} />

          {/* App Dashboard Routes */}
          <Route path="/app/:appId/dashboard" element={<AppDashboard />} />
          <Route path="/app/:appId/users" element={<AppDashboard />} />
          <Route path="/app/:appId/content" element={<AppDashboard />} />
          <Route path="/app/:appId/analytics" element={<AppDashboard />} />
          <Route path="/app/:appId/settings" element={<AppDashboard />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;