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
import { AdminDashboardNew } from './pages/dashboard/AdminDashboardNew';
import { ClientDashboard } from './pages/dashboard/ClientDashboard';
import { CorporateDashboard } from './pages/dashboard/CorporateDashboard';
import { FranchiseDashboard } from './pages/dashboard/FranchiseDashboard';
import { LaborDashboard } from './pages/dashboard/LaborDashboard';
import { MediaChannelDashboard } from './pages/dashboard/MediaChannelDashboard';
import { PartnerDashboard } from './pages/dashboard/PartnerDashboard';
import { MediaDashboard } from './pages/media/MediaDashboard';
import { AppDashboard } from './pages/app/AppDashboard';
import Register from './pages/Register';
import { MobileAppPage } from './pages/mobile/MobileAppPage';

import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardRouter from './components/auth/DashboardRouter';
import RequireAuth from './components/auth/RequireAuth';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import { DesktopOnlyGuard } from './components/DesktopOnlyGuard';

const ADMIN_ROLES = ['admin', 'groups', 'corporate', 'head_office', 'regional', 'branch'] as const;
const CLIENT_ROLES = ['client', 'client_god'] as const;
const FRANCHISE_ROLES = ['head_office', 'regional', 'branch'] as const;
const MEDIA_ROLES = ['client', 'client_god', 'media'] as const;
const MEDIA_DASHBOARD_ROLES = ['partner', 'client', 'client_god', 'media'] as const;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ── Public routes (no auth) ── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/auth/login" element={<DesktopOnlyGuard><AdminLogin /></DesktopOnlyGuard>} />
          <Route path="/auth/admin" element={<AdminLogin />} />
          <Route path="/admin/login" element={<DesktopOnlyGuard><GroupAdminLogin /></DesktopOnlyGuard>} />
          <Route path="/god-login/:groupName/:subGroup" element={<GodLogin />} />
          <Route path="/client-login/:groupName" element={<ClientLogin />} />
          <Route path="/media-login/:groupName" element={<ClientLogin />} />
          <Route path="/partner" element={<DesktopOnlyGuard><PartnerLogin /></DesktopOnlyGuard>} />
          <Route path="/partner/register" element={<PartnerRegister />} />
          <Route path="/reporter/login" element={<AdminLogin />} />
          <Route path="/register-form/:groupName" element={<RegistrationForm />} />

          {/* Consumer mobile app — stays public per product decision */}
          <Route path="/mobile/:appName" element={<MobileAppPage />} />

          {/* ── Protected routes (specific paths before wildcards) ── */}
          <Route path="/dashboard" element={
            <RequireAuth>
              <DashboardRouter />
            </RequireAuth>
          } />

          <Route path="/media/dashboard/:channelId/*" element={
            <ProtectedRoute allowedRoles={[...MEDIA_DASHBOARD_ROLES]}>
              <MediaDashboard />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/admin" element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <AdminDashboardNew />
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
              <AdminDashboardNew />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/corporate" element={
            <ProtectedRoute allowedRoles={['corporate']}>
              <CorporateDashboard />
            </ProtectedRoute>
          } />
          <Route path="/corporate/*" element={
            <ProtectedRoute allowedRoles={['corporate']}>
              <CorporateDashboard />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/franchise" element={
            <ProtectedRoute allowedRoles={[...FRANCHISE_ROLES]}>
              <FranchiseDashboard />
            </ProtectedRoute>
          } />
          <Route path="/franchise/*" element={
            <ProtectedRoute allowedRoles={[...FRANCHISE_ROLES]}>
              <FranchiseDashboard />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/labor" element={
            <ProtectedRoute allowedRoles={['labor']}>
              <LaborDashboard />
            </ProtectedRoute>
          } />
          <Route path="/labor/*" element={
            <ProtectedRoute allowedRoles={['labor']}>
              <LaborDashboard />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/media" element={
            <ProtectedRoute allowedRoles={[...MEDIA_ROLES]}>
              <MediaChannelDashboard />
            </ProtectedRoute>
          } />
          <Route path="/media/*" element={
            <ProtectedRoute allowedRoles={[...MEDIA_ROLES]}>
              <MediaChannelDashboard />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/partner" element={
            <ProtectedRoute allowedRoles={['partner']}>
              <PartnerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/partner/*" element={
            <ProtectedRoute allowedRoles={['partner']}>
              <PartnerDashboard />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/client" element={
            <ProtectedRoute allowedRoles={[...CLIENT_ROLES]}>
              <ClientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/client/*" element={
            <ProtectedRoute allowedRoles={[...CLIENT_ROLES]}>
              <ClientDashboard />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/reporter" element={
            <ProtectedRoute allowedRoles={['reporter']}>
              <div className="p-6">Reporter Dashboard (Coming Soon)</div>
            </ProtectedRoute>
          } />

          <Route path="/app/:appId/*" element={
            <RequireAuth>
              <AppDashboard />
            </RequireAuth>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
