import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api.config';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [formData, setFormData] = useState({
    identity: '',
    password: '',
    remember: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/admin/login`, formData);
      if (response.data.success) {
        // Store tokens
        localStorage.setItem('accessToken', response.data.data.accessToken);
        if (response.data.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.data.refreshToken);
        }

        // Store user data
        localStorage.setItem('user', JSON.stringify(response.data.data.user));

        // Update AuthContext with user data
        updateUser(response.data.data.user);

        // Navigate to dashboard
        navigate(response.data.data.dashboardRoute || '/dashboard/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_50%)]" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 w-full max-w-lg mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <img width="100" src={`${import.meta.env.VITE_BACKEND_URL}/backend/public/uploads/logo.png`} alt="Logo"/>
            <div>
              <h2 className="text-white" style={{ fontSize: '28px', lineHeight: '36px', fontWeight: 700 }}>My Group</h2>
              <p className="text-primary-200 text-sm">Admin Portal</p>
            </div>
          </div>

          {/* Tagline */}
          <h1 className="text-white mb-4" style={{ fontSize: '32px', lineHeight: '40px', fontWeight: 700 }}>
            Manage Dashboard
          </h1>
          <p className="text-lg text-primary-100 mb-10 leading-relaxed">
            My Group of Admins
          </p>

        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-gray-50">
        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-8 py-8">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-gray-900 mb-2" style={{ fontSize: '28px', lineHeight: '36px', fontWeight: 700 }}>
               Admins Login
              </h2>
              <p className="text-gray-600 text-sm">Sign in to access your dashboard</p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-2 text-sm text-gray-700">Username</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="username"
                    value={formData.identity}
                    onChange={(e) => setFormData({ ...formData, identity: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white text-gray-900"
                    style={{ fontSize: '14px', lineHeight: '20px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white text-gray-900"
                    style={{ fontSize: '14px', lineHeight: '20px' }}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={formData.remember}
                    onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300 disabled:opacity-50 text-sm"
                style={{ fontSize: '14px', lineHeight: '20px', fontWeight: 500 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
