import React, { useState } from 'react';
import { X, User, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { RegisterStep2Form } from './RegisterStep2Form';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api/v1';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  allowClose?: boolean; // Allow closing the modal
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, allowClose = false }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  // Registration Step 1 form state
  const [registerData, setRegisterData] = useState({
    first_name: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        username: loginData.username,
        password: loginData.password
      });

      if (response.data.success) {
        const user = response.data.data.user;

        // Store tokens
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Check if user has completed registration (Step 2)
        try {
          const profileResponse = await axios.get(`${API_BASE_URL}/member/check-profile/${user.id}`, {
            headers: {
              Authorization: `Bearer ${response.data.data.accessToken}`
            }
          });

          if (profileResponse.data.success && !profileResponse.data.data.profileComplete) {
            // Profile not complete - show Step 2 form
            setUserId(user.id);
            setRegisterData({
              first_name: user.first_name || '',
              mobile: user.username || '',
              password: '',
              confirmPassword: ''
            });
            setActiveTab('register');
            setRegistrationStep(2);
            setLoading(false);
            return;
          }
        } catch (profileErr) {
          console.error('Error checking profile:', profileErr);
        }

        // Profile complete or error checking - proceed to home
        onClose();
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [userId, setUserId] = useState<number | null>(null);

  const handleRegisterStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    // Validate mobile number (10 digits)
    if (!/^\d{10}$/.test(registerData.mobile)) {
      setError('Mobile number must be 10 digits');
      setLoading(false);
      return;
    }

    try {
      // Create user in database (Step 1)
      const response = await axios.post(`${API_BASE_URL}/member/register-step1`, {
        first_name: registerData.first_name,
        mobile: registerData.mobile,
        password: registerData.password
      });

      if (response.data.success) {
        setUserId(response.data.data.user_id);

        // Check if profile is incomplete (user already exists)
        if (response.data.data.profileIncomplete) {
          // User exists but profile incomplete - go to Step 2
          setRegistrationStep(2);
        } else {
          // New user created - go to Step 2
          setRegistrationStep(2);
        }
      }
    } catch (err: any) {
      // Check if should redirect to login
      if (err.response?.data?.redirectToLogin) {
        setError(err.response.data.message);
        // Auto-switch to login tab after 2 seconds
        setTimeout(() => {
          setActiveTab('login');
          setError('');
        }, 2000);
      } else {
        setError(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setRegistrationStep(1);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {activeTab === 'login' ? 'Login' : registrationStep === 1 ? 'Register - Step 1' : 'Register - Step 2'}
          </h2>
          {allowClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => {
              setActiveTab('login');
              setRegistrationStep(1);
              setError('');
            }}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'login'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setRegistrationStep(1);
              setError('');
            }}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'register'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Register
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username / Mobile Number
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter username or mobile"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}

          {/* Register Step 1 Form */}
          {activeTab === 'register' && registrationStep === 1 && (
            <form onSubmit={handleRegisterStep1} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={registerData.first_name}
                  onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number (Username)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={registerData.mobile}
                    onChange={(e) => setRegisterData({ ...registerData, mobile: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter mobile number"
                    required
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit mobile number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Next Step
              </button>
            </form>
          )}

          {/* Register Step 2 Form */}
          {activeTab === 'register' && registrationStep === 2 && userId && (
            <RegisterStep2Form
              registerData={registerData}
              userId={userId}
              onBack={handleBackToStep1}
              onSuccess={() => {
                setActiveTab('login');
                setRegistrationStep(1);
                setUserId(null);
                setRegisterData({
                  first_name: '',
                  mobile: '',
                  password: '',
                  confirmPassword: ''
                });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

