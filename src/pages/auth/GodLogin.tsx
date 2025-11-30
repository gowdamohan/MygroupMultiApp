import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Crown, Mail, Lock, Shield, Zap, Star, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api/v1';

export const GodLogin: React.FC = () => {
  const navigate = useNavigate();
  const { groupName = 'default', subGroup = 'default' } = useParams();
  const { updateUser } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // For God login, we'll use the admin login endpoint with special handling
      const response = await axios.post(`${API_BASE_URL}/auth/admin/login`, {
        identity: formData.email,
        password: formData.password,
        remember: true
      });

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
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-all text-white border border-white/20 group text-sm"
      >
        <ArrowLeft size={18} className="transform group-hover:-translate-x-1 transition-transform" />
        <span>Back to Home</span>
      </button>

      {/* Login Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10">
          {/* Crown Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full blur-lg opacity-60 animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl">
                <Crown className="text-gray-900" size={40} />
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-white mb-2" style={{ fontSize: '24px', lineHeight: '32px', fontWeight: 700 }}>
              God Mode Access
            </h1>
            <p className="text-gray-300 text-sm mb-1">{groupName}</p>
            {subGroup !== 'default' && (
              <p className="text-gray-400 text-xs">{subGroup}</p>
            )}
          </div>

          {/* Premium Features */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Shield, label: 'Ultimate Control' },
              { icon: Zap, label: 'Full Access' },
              { icon: Star, label: 'Premium' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                  <item.icon className="text-yellow-400" size={18} />
                </div>
                <p className="text-xs text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 text-sm text-gray-300">God Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  placeholder="god@universe.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm text-gray-300">Master Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  style={{ fontSize: '14px', lineHeight: '20px' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-900 rounded-lg hover:shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 disabled:opacity-50 shadow-lg text-sm"
              style={{ fontSize: '14px', lineHeight: '20px', fontWeight: 600 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Crown size={18} />
                  <span>Enter God Mode</span>
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-700 text-center">
            <p className="text-sm text-gray-400">
              Need standard access?{' '}
              <button
                onClick={() => navigate('/')}
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                View all logins
              </button>
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
          <p className="text-sm text-red-400 flex items-center justify-center gap-2">
            <Shield size={14} />
            <span>Unauthorized access is strictly prohibited</span>
          </p>
        </div>
      </div>
    </div>
  );
};
