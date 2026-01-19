import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh interval (30 minutes = 30 * 60 * 1000 ms)
const TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000;
let tokenRefreshTimer = null;

/**
 * Track user activity (page interactions, API calls)
 * This helps determine if user is active
 */
const trackActivity = () => {
  // Store last activity timestamp
  localStorage.setItem('lastActivity', Date.now().toString());
};

// Track activity on various user interactions
if (typeof window !== 'undefined') {
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  activityEvents.forEach(event => {
    document.addEventListener(event, trackActivity, { passive: true });
  });
}

/**
 * Refresh access token automatically
 */
const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return false;
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      // Track activity on token refresh
      trackActivity();
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Auto token refresh failed:', error);
    // Don't logout on auto-refresh failure, let the 401 handler deal with it
    return false;
  }
};

/**
 * Start automatic token refresh interval
 */
const startTokenRefreshInterval = () => {
  // Clear existing timer if any
  if (tokenRefreshTimer) {
    clearInterval(tokenRefreshTimer);
  }

  // Refresh token every 30 minutes for active sessions
  tokenRefreshTimer = setInterval(() => {
    const lastActivity = localStorage.getItem('lastActivity');
    const now = Date.now();
    
    // Only refresh if user has been active (within last 15 days)
    if (lastActivity) {
      const timeSinceActivity = now - parseInt(lastActivity, 10);
      const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
      
      if (timeSinceActivity < FIFTEEN_DAYS_MS) {
        refreshAccessToken();
      } else {
        // User inactive, stop auto-refresh
        stopTokenRefreshInterval();
      }
    } else {
      // No activity tracked, refresh anyway
      refreshAccessToken();
    }
  }, TOKEN_REFRESH_INTERVAL);
};

/**
 * Stop automatic token refresh interval
 */
const stopTokenRefreshInterval = () => {
  if (tokenRefreshTimer) {
    clearInterval(tokenRefreshTimer);
    tokenRefreshTimer = null;
  }
};

// Start token refresh when module loads (if user is logged in)
if (typeof window !== 'undefined' && localStorage.getItem('accessToken')) {
  startTokenRefreshInterval();
}

// Request interceptor to add auth token and track activity
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Track activity on API calls
      trackActivity();
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    // Track activity on successful responses
    trackActivity();
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          if (response.data.success && response.data.data) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            
            if (accessToken) {
              localStorage.setItem('accessToken', accessToken);
            }
            
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }

            // Track activity
            trackActivity();

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken || localStorage.getItem('accessToken')}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        stopTokenRefreshInterval();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('lastActivity');
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Authentication
  register: (data) => api.post('/auth/register', data),
  login: (data) => {
    // Start token refresh interval on login
    startTokenRefreshInterval();
    return api.post('/auth/login', data);
  },
  logout: () => {
    // Stop token refresh on logout
    stopTokenRefreshInterval();
    localStorage.removeItem('lastActivity');
    return api.post('/auth/logout');
  },
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),

  // Password Management
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.post('/auth/change-password', data),

  // Session Management
  getSessions: () => api.get('/auth/sessions'),
  revokeSession: (sessionId) => api.delete(`/auth/sessions/${sessionId}`),
  revokeAllSessions: () => api.delete('/auth/sessions'),

  // Location Management
  updateLocation: (data) => api.put('/auth/location', data),
};

// Export token refresh functions for use in other components
export { startTokenRefreshInterval, stopTokenRefreshInterval, refreshAccessToken };

export default api;

