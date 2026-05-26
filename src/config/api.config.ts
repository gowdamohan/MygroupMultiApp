/**
 * API Configuration
 *
 * Centralized configuration for API endpoints and URLs.
 * All API-related URLs should be imported from this file.
 *
 * Supported Environment Variables:
 *
 * SIMPLE FORMAT (RECOMMENDED):
 * - VITE_API_URL: Base URL (e.g., http://13.127.190.207:5000)
 *   Automatically appends /api/v1 for API calls
 *
 * FULL FORMAT:
 * - VITE_API_BASE_URL: Full API URL (e.g., http://13.127.190.207:5000/api/v1)
 * - VITE_BACKEND_URL: Backend URL (e.g., http://13.127.190.207:5000)
 *
 * Examples:
 * - Local dev:        VITE_API_URL=http://localhost:5001
 * - Docker Compose:   VITE_API_URL=http://backend:5000
 * - EC2/Staging:      VITE_API_URL=http://13.127.190.207:5000
 * - Production:       VITE_API_URL=https://yourdomain.com
 * - Same-origin:      VITE_API_URL= (empty/relative URLs)
 */

// Detect if running in production
const isProduction = import.meta.env.PROD;

// Get API URL from environment (supports VITE_API_URL or VITE_API_BASE_URL)
const apiUrlEnv = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
const isFullApiUrl = apiUrlEnv?.endsWith('/api/v1');
const baseApiUrl = isFullApiUrl ? apiUrlEnv : (apiUrlEnv ? `${apiUrlEnv}/api/v1` : '');

// Default values
const DEFAULT_DEV_API_BASE_URL = 'http://localhost:5001/api/v1';
const DEFAULT_DEV_BACKEND_URL = 'http://localhost:5001';
const DEFAULT_PROD_API_BASE_URL = '/api/v1';
const DEFAULT_PROD_BACKEND_URL = '';

/**
 * API Base URL - automatically includes /api/v1 path
 *
 * Examples:
 * - http://13.127.190.207:5000/api/v1 (EC2)
 * - http://backend:5000/api/v1 (Docker)
 * - /api/v1 (relative, same-origin)
 */
export const API_BASE_URL = baseApiUrl ||
  (isProduction ? DEFAULT_PROD_API_BASE_URL : DEFAULT_DEV_API_BASE_URL);

/**
 * Backend URL - for static assets (uploads, images)
 * Automatically extracted from API_BASE_URL or set explicitly
 */
export const BACKEND_URL = (() => {
  const explicitBackendUrl = import.meta.env.VITE_BACKEND_URL;
  if (explicitBackendUrl !== undefined) {
    return explicitBackendUrl;
  }

  // Remove /api/v1 from API_BASE_URL to get BACKEND_URL
  if (API_BASE_URL.endsWith('/api/v1')) {
    return API_BASE_URL.slice(0, -7);
  }

  // If API_BASE_URL is absolute, use as-is
  if (API_BASE_URL.startsWith('http')) {
    return API_BASE_URL;
  }

  // For relative URLs, return empty
  return '';
})();

/**
 * Helper function to get the full URL for an uploaded file
 * @param path - The file path (e.g., /uploads/images/photo.jpg)
 * @returns Full URL to the file
 */
export const getUploadUrl = (path: string): string => {
  if (!path) return '';
  // If the path is already a full URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
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

