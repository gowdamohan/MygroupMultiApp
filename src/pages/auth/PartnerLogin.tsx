import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, ArrowLeft, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api/v1';
const BACKEND_URL = 'http://localhost:5002';

interface AppDetails {
  id: number;
  name: string;
  apps_name?: string;
  dashboard_route?: string;
  details?: {
    icon?: string;
    logo?: string;
    name_image?: string;
    background_color?: string;
    url?: string;
  };
}

export const PartnerLogin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State
  const [apps, setApps] = useState<AppDetails[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppDetails | null>(null);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch apps on mount and check for AppId in URL
  useEffect(() => {
    fetchApps();
  }, []);

  // Check for app name in URL after apps are loaded
  useEffect(() => {
    if (apps.length > 0) {
      // Get the query string (everything after ?)
      const queryString = window.location.search.substring(1);
      if (queryString) {
        const app = apps.find(a => a.name === queryString);
        if (app) {
          setSelectedApp(app);
        }
      }
    }
  }, [apps, searchParams]);

  const fetchApps = async () => {
    try {
      // Fetch apps from group_create table
      const response = await axios.get(`${API_BASE_URL}/groups`);
      if (response.data.success) {
        setApps(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching apps:', err);
      setError('Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  const handleAppSelect = (app: AppDetails) => {
    // Update URL with app name query parameter
    navigate(`/partner?${app.name}`);
    setSelectedApp(app);
    setError('');
    setFormData({ username: '', password: '' });
  };

  const handleBack = () => {
    // Remove app name from URL
    navigate('/partner');
    setSelectedApp(null);
    setError('');
    setFormData({ username: '', password: '' });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);

    if (!selectedApp) {
      setError('Please select an app first');
      setLoginLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/partner/login`, {
        identity: formData.username,
        password: formData.password,
        app_id: selectedApp.id
      });
      
      if (response.data.success) {
        // Store tokens
        localStorage.setItem('accessToken', response.data.data.accessToken);
        if (response.data.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.data.refreshToken);
        }

        // Store user data
        localStorage.setItem('user', JSON.stringify(response.data.data.user));

        // Store selected app
        localStorage.setItem('selectedApp', JSON.stringify(selectedApp));

        // Navigate to dashboard
        navigate(response.data.data.dashboardRoute || '/dashboard/partner');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password
    alert('Forgot password functionality coming soon!');
  };

  const handleRegister = () => {
    if (selectedApp) {
      navigate(`/partner/register?${selectedApp.name}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading apps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <AnimatePresence mode="wait">
          {!selectedApp ? (
            // App Selection Screen
            <motion.div
              key="app-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-2xl p-8"
            >
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Partner Login</h1>
                <p className="text-gray-600">Select an app to continue</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {apps.map((app) => (
                  <motion.button
                    key={app.id}
                    onClick={() => handleAppSelect(app)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-blue-300"
                  >
                    {app.details?.logo ? (
                      <img
                        src={`${BACKEND_URL}${app.details.logo}`}
                        alt={app.name}
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                        {app.name.charAt(0)}
                      </div>
                    )}
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 text-sm">{app.name}</p>
                      {app.apps_name && (
                        <p className="text-xs text-gray-500 mt-1">{app.apps_name}</p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            // Login Form Screen
            <motion.div
              key="login-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md mx-auto"
            >
              {/* Header with selected app */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span className="text-sm">Back to apps</span>
                </button>

                <div className="flex items-center gap-4">
                  {selectedApp.details?.logo ? (
                    <img
                      src={`${BACKEND_URL}${selectedApp.details.logo}`}
                      alt={selectedApp.name}
                      className="w-16 h-16 object-contain bg-white rounded-lg p-2"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center text-2xl font-bold">
                      {selectedApp.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{selectedApp.name}</h2>
                    <p className="text-blue-100 text-sm">Partner Login</p>
                  </div>
                </div>
              </div>

              {/* Login Form */}
              <div className="p-8">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username or Email
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter username or email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter password"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loginLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <LogIn size={20} />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={handleForgotPassword}
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                      onClick={handleRegister}
                      className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                    >
                      Register
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

