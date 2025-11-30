import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const ClientLogin: React.FC = () => {
  const navigate = useNavigate();
  const { groupName } = useParams<{ groupName: string }>();
  const [formData, setFormData] = useState({
    identity: '',
    password: '',
    remember: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [groupInfo, setGroupInfo] = useState<any>(null);

  useEffect(() => {
    // Fetch group information
    const fetchGroupInfo = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/groups/name/${groupName}`);
        if (response.data.success) {
          setGroupInfo(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching group info:', err);
      }
    };

    if (groupName) {
      fetchGroupInfo();
    }
  }, [groupName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/client/login/${groupName}`,
        formData
      );

      if (response.data.success) {
        // Check if profile completion is required
        if (response.data.requiresProfileCompletion) {
          navigate(response.data.data.redirectTo);
        } else {
          // Store tokens
          localStorage.setItem('accessToken', response.data.data.accessToken);
          if (response.data.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.data.refreshToken);
          }
          
          // Store user data
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
          
          // Navigate to dashboard
          navigate(response.data.data.dashboardRoute || '/dashboard/client');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            {groupInfo?.details?.logo && (
              <img 
                src={groupInfo.details.logo} 
                alt={groupInfo.apps_name}
                className="h-16 mx-auto mb-4"
              />
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {groupInfo?.apps_name || 'Client Login'}
            </h1>
            <p className="text-gray-600">
              Sign in to access your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email/Username Input */}
            <div>
              <label htmlFor="identity" className="block text-sm font-medium text-gray-700 mb-2">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  id="identity"
                  name="identity"
                  value={formData.identity}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your email or username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Remember me</span>
              </label>
              <Link
                to={`/forgot-password/${groupName}`}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link
                to={`/register/${groupName}`}
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

