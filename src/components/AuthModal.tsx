import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, User, Lock, Phone, Eye, EyeOff, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { RegisterStep2Form } from './RegisterStep2Form';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  allowClose?: boolean;
}

type RegisterSubStep = 'mobile' | 'otp' | 'details';

const OTP_RESEND_SECONDS = 60;

const formatTimer = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, allowClose = false }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [registerSubStep, setRegisterSubStep] = useState<RegisterSubStep>('mobile');
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    first_name: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });

  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const resetRegistrationState = () => {
    setRegistrationStep(1);
    setRegisterSubStep('mobile');
    setOtp('');
    setOtpTimer(0);
    setSuccess('');
    setError('');
    setUserId(null);
    setRegisterData({
      first_name: '',
      mobile: '',
      password: '',
      confirmPassword: ''
    });
  };

  const redirectToMyMedia = () => {
    onClose();
    navigate('/mobile/mymedia');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        username: loginData.username,
        password: loginData.password
      });

      if (response.data.success) {
        const user = response.data.data.user;

        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        try {
          const profileResponse = await axios.get(
            `${API_BASE_URL}${API_ENDPOINTS.member.checkProfile(user.id)}`,
            {
              headers: {
                Authorization: `Bearer ${response.data.data.accessToken}`
              }
            }
          );

          if (profileResponse.data.success && !profileResponse.data.data.profileComplete) {
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

        redirectToMyMedia();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateMobile = () => {
    if (!/^\d{10}$/.test(registerData.mobile)) {
      setError('Mobile number must be 10 digits');
      return false;
    }
    return true;
  };

  const validateAccountDetails = () => {
    if (!registerData.first_name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSendWhatsappOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateMobile()) return;

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.member.sendWhatsappOtp}`, {
        mobile: registerData.mobile
      });

      if (response.data.success) {
        setRegisterSubStep('otp');
        setOtp('');
        setOtpTimer(OTP_RESEND_SECONDS);
        setSuccess(`Code sent to WhatsApp Number ending in ****${registerData.mobile.slice(-4)}`);
      }
    } catch (err: any) {
      if (err.response?.data?.redirectToLogin) {
        setError(err.response.data.message);
        setTimeout(() => {
          setActiveTab('login');
          setError('');
        }, 2000);
      } else {
        setError(err.response?.data?.message || 'Failed to send code via WhatsApp');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyWhatsappOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanOtp = otp.replace(/\D/g, '').slice(0, 6);
    if (cleanOtp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.member.verifyWhatsappOtp}`, {
        mobile: registerData.mobile,
        otp: cleanOtp
      });

      if (response.data.success) {
        if (response.data.data?.profileIncomplete) {
          setUserId(response.data.data.user_id);
          setRegisterData((prev) => ({
            ...prev,
            first_name: response.data.data.first_name || prev.first_name
          }));
          setSuccess('Mobile verified! Please complete your profile.');
          setRegistrationStep(2);
        } else {
          setSuccess('Mobile verified! Enter your account details.');
          setRegisterSubStep('details');
        }
      }
    } catch (err: any) {
      if (err.response?.data?.redirectToLogin) {
        setError(err.response.data.message);
        setTimeout(() => {
          setActiveTab('login');
          setError('');
        }, 2000);
      } else {
        setError(err.response?.data?.message || 'Invalid or expired code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateAccountDetails()) return;

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.member.registerStep1}`, {
        first_name: registerData.first_name,
        mobile: registerData.mobile,
        password: registerData.password
      });

      if (response.data.success) {
        setUserId(response.data.data.user_id);
        setRegistrationStep(2);
      }
    } catch (err: any) {
      if (err.response?.data?.redirectToLogin) {
        setError(err.response.data.message);
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

  const handleBackInRegister = () => {
    if (registrationStep === 2) {
      setRegistrationStep(1);
      setRegisterSubStep('details');
    } else if (registerSubStep === 'details') {
      setRegisterSubStep('otp');
    } else if (registerSubStep === 'otp') {
      setRegisterSubStep('mobile');
      setOtp('');
      setOtpTimer(0);
    }
    setError('');
    setSuccess('');
  };

  const getRegisterTitle = () => {
    if (registrationStep === 2) return 'Register - Step 2';
    if (registerSubStep === 'mobile') return 'Register - Verify Mobile';
    if (registerSubStep === 'otp') return 'Enter 6-digit code';
    return 'Register - Step 1';
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto relative z-[10000]">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {activeTab === 'login' ? 'Login' : getRegisterTitle()}
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

        <div className="flex border-b">
          <button
            onClick={() => {
              setActiveTab('login');
              resetRegistrationState();
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
              resetRegistrationState();
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

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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

          {activeTab === 'register' && registrationStep === 1 && registerSubStep === 'mobile' && (
            <form onSubmit={handleSendWhatsappOtp} className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter your mobile number. We will send a verification code to your WhatsApp.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={registerData.mobile}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, mobile: e.target.value.replace(/\D/g, '') })
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="10-digit mobile number"
                    required
                    maxLength={10}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-green-400 flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          )}

          {activeTab === 'register' && registrationStep === 1 && registerSubStep === 'otp' && (
            <form onSubmit={handleVerifyWhatsappOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">6-digit code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  required
                />
              </div>

              <div className="text-center text-sm text-gray-600">
                {otpTimer > 0 ? (
                  <span>Resend code in {formatTimer(otpTimer)}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendWhatsappOtp()}
                    disabled={loading}
                    className="text-green-700 font-medium hover:underline disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBackInRegister}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-green-400"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'register' && registrationStep === 1 && registerSubStep === 'details' && (
            <form onSubmit={handleRegisterStep1} className="space-y-4">
              <p className="text-sm text-gray-600">
                Mobile <span className="font-medium">{registerData.mobile}</span> verified. Create your account.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={registerData.first_name}
                  onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
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
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {loading ? 'Please wait...' : 'Next Step'}
              </button>
            </form>
          )}

          {activeTab === 'register' && registrationStep === 2 && userId && (
            <RegisterStep2Form
              registerData={registerData}
              userId={userId}
              onBack={handleBackInRegister}
              onSuccess={() => {
                setActiveTab('login');
                resetRegistrationState();
              }}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
