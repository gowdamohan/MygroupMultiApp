import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './pages/HomePage';

// Public corporate pages (no auth required)
import { AboutPage }        from './pages/public/AboutPage';
import { ClientsPage }      from './pages/public/ClientsPage';
import { TestimonialsPage } from './pages/public/TestimonialsPage';
import { MilestonesPage }   from './pages/public/MilestonesPage';
import { EventsPage }       from './pages/public/EventsPage';
import { NewsroomPage }     from './pages/public/NewsroomPage';
import { AwardsPage }       from './pages/public/AwardsPage';
import { TermsPage }        from './pages/public/TermsPage';
import { PrivacyPage }      from './pages/public/PrivacyPage';
import { ContactPage }      from './pages/public/ContactPage';
import { EnquiryPage }      from './pages/public/EnquiryPage';
import { GalleryPage }      from './pages/public/GalleryPage';
import { CareersPage }      from './pages/public/CareersPage';
import { FaqPage }          from './pages/public/FaqPage';
import {
  NewsroomDetailPage,
  AwardsDetailPage,
  EventsDetailPage,
} from './pages/public/FooterDetailPage';
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

          {/* ── Public corporate pages (footer_page, user_id=2) ── */}
          <Route path="/about"        element={<AboutPage />} />
          <Route path="/clients"      element={<ClientsPage />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/milestones"   element={<MilestonesPage />} />
          <Route path="/events"       element={<EventsPage />} />
          <Route path="/newsroom"     element={<NewsroomPage />} />
          <Route path="/awards"       element={<AwardsPage />} />
          <Route path="/terms"        element={<TermsPage />} />
          <Route path="/privacy"      element={<PrivacyPage />} />
          <Route path="/contact"      element={<ContactPage />} />
          <Route path="/enquiry"      element={<EnquiryPage />} />
          <Route path="/gallery"     element={<GalleryPage />} />
          <Route path="/careers"     element={<CareersPage />} />
          <Route path="/faq"         element={<FaqPage />} />
          <Route path="/newsroom/:id" element={<NewsroomDetailPage />} />
          <Route path="/awards/:id"   element={<AwardsDetailPage />} />
          <Route path="/events/:id"   element={<EventsDetailPage />} />

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
          <Route path="/app/:appId/dashboard" element={
            <RequireAuth>
              <AppDashboard />
            </RequireAuth>
          } />
          <Route path="/app/:appId/users" element={
            <RequireAuth>
              <AppDashboard />
            </RequireAuth>
          } />
          <Route path="/app/:appId/content" element={
            <RequireAuth>
              <AppDashboard />
            </RequireAuth>
          } />
          <Route path="/app/:appId/analytics" element={
            <RequireAuth>
              <AppDashboard />
            </RequireAuth>
          } />
          <Route path="/app/:appId/settings" element={
            <RequireAuth>
              <AppDashboard />
            </RequireAuth>
          } />

          {/* Mobile Routes - Protected */}
          <Route path="/mobile/:appName" element={
            <RequireAuth>
              <MobileAppPage />
            </RequireAuth>
          } />

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
