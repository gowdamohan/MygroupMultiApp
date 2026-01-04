/**
 * API Configuration
 * 
 * Centralized configuration for API endpoints and URLs.
 * All API-related URLs should be imported from this file.
 * 
 * Environment Variables:
 * - VITE_API_BASE_URL: Full API base URL (e.g., http://18.61.71.16:5000/api/v1)
 * - VITE_BACKEND_URL: Backend server URL for static assets (e.g., http://18.61.71.16:5000)
 * 
 * When transitioning to a domain:
 * 1. Update .env file with new domain
 * 2. Update GitHub Actions secrets with new domain
 * 3. No code changes required!
 */

// Default values for development - these will be overridden by .env in production
const DEFAULT_API_BASE_URL = 'http://localhost:5000/api/v1';
const DEFAULT_BACKEND_URL = 'http://localhost:5000';

/**
 * API Base URL for all API calls
 * Example: http://18.61.71.16:5000/api/v1 or https://api.yourdomain.com/api/v1
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

/**
 * Backend URL for static assets (uploads, images, etc.)
 * Example: http://18.61.71.16:5000 or https://api.yourdomain.com
 */
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || DEFAULT_BACKEND_URL;

/**
 * Helper function to get the full URL for an uploaded file
 * @param path - The file path (e.g., /uploads/images/photo.jpg)
 * @returns Full URL to the file
 */
export const getUploadUrl = (path: string): string => {
  if (!path) return '';
  // If the path is already a full URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Ensure the path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${normalizedPath}`;
};

/**
 * API endpoints organized by feature
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    adminLogin: '/auth/admin/login',
    clientLogin: (groupName: string) => `/auth/client/login/${groupName}`,
    partnerLogin: (groupName: string) => `/auth/partner/login/${groupName}`,
    reporterLogin: (groupName: string) => `/auth/reporter/login/${groupName}`,
    groupAdminLogin: '/auth/group-admin/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    changePassword: '/auth/change-password',
    sessions: '/auth/sessions',
    location: '/auth/location',
  },
  member: {
    registerStep1: '/member/register-step1',
    checkProfile: (userId: number) => `/member/check-profile/${userId}`,
  },
  admin: {
    appsAdminLogin: '/admin/apps-admin-login',
    appLogin: '/admin/app-login',
  },
  home: {
    mobileData: '/home/mobile-data',
  },
  groups: '/groups',
  testimonials: '/testimonials',
  footer: {
    socialMedia: '/footer/social-media',
  },
  geo: {
    countries: '/geo/countries',
    states: (countryId: number) => `/geo/states/${countryId}`,
    districts: (stateId: number) => `/geo/districts/${stateId}`,
  },
  headerAds: '/header-ads',
  companyAds: '/company-ads',
  applications: '/applications',
  franchiseTerms: '/franchise-terms',
  tncDetails: '/tnc-details',
} as const;

// Export default for convenience
export default {
  API_BASE_URL,
  BACKEND_URL,
  getUploadUrl,
  API_ENDPOINTS,
};

