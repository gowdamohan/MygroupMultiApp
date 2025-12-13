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
  logo?: string;
  apps_name?: string;
  dashboard_route?: string;
}

export const GroupAdminLogin: React.FC = () => {
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

  // Check for AppId in URL after apps are loaded
  useEffect(() => {
    if (apps.length > 0) {
      const appId = searchParams.get('AppId');
      if (appId) {
        const app = apps.find(a => a.id === parseInt(appId));
        if (app) {
          setSelectedApp(app);
        }
      }
    }
  }, [apps, searchParams]);

  const fetchApps = async () => {
    try {
      // Fetch apps that have users (only apps with users.group_id = app.id)
      const response = await axios.get(`${API_BASE_URL}/admin/apps-admin-login`);
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
    // Update URL with AppId query parameter
    navigate(`/admin/login?AppId=${app.id}`);
    setSelectedApp(app);
    setError('');
    setFormData({ username: '', password: '' });
  };

  const handleBack = () => {
    // Remove AppId from URL
    navigate('/admin/login');
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
      const response = await axios.post(`${API_BASE_URL}/admin/app-login`, {
        app_id: selectedApp.id,
        username: formData.username,
        password: formData.password
      });
      if (response.data.success) {
        // Store tokens
        localStorage.setItem('accessToken', response.data.data.accessToken);
        if (response.data.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.data.refreshToken);
        }

        // Store user data
        localStorage.setItem('user', JSON.stringify(response.data.data.user));

        // Redirect to app-specific dashboard
        const dashboardRoute = response.data.data.dashboardRoute || selectedApp.dashboard_route || `/app/${selectedApp.id}/dashboard`;
        navigate(dashboardRoute);
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
      navigate(`/admin/register/${selectedApp.id}`);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-500 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-indigo-500 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Back Button */}
      {selectedApp && (
        <button
          onClick={handleBack}
          className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-lg hover:bg-white transition-all shadow-md group text-sm"
        >
          <ArrowLeft size={18} className="transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-gray-700">Back to Apps</span>
        </button>
      )}

      <div className="relative w-full max-w-4xl z-10">
        <AnimatePresence mode="wait">
          {!selectedApp ? (
            // App Selection Screen
            <motion.div
              key="app-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/50"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
                <p className="text-gray-600">Select an app to continue</p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                  {error}
                </div>
              )}

              {apps.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No apps available
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {apps.map((app) => (
                    <motion.button
                      key={app.id}
                      onClick={() => handleAppSelect(app)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 hover:border-blue-400"
                    >
                      {app.logo ? (
                        <img
                          src={`${app.logo}`}
                          alt={app.name}
                          className="w-16 h-16 object-contain"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                          {app.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 text-center line-clamp-2">
                        {app.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            // Login Form Screen
            <motion.div
              key="login-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/50 max-w-md mx-auto"
            >
              {/* App Branding */}
              <div className="text-center mb-8">
                {selectedApp.logo ? (
                  <img
                    src={`${selectedApp.logo}`}
                    alt={selectedApp.name}
                    className="w-20 h-20 object-contain mx-auto mb-4"
                  />
                ) : (
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {selectedApp.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedApp.name}</h1>
                <p className="text-gray-600 text-sm">Admin Login</p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      <span>Login</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
