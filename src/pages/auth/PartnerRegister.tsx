import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, Building, Calendar } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api/v1';
const BACKEND_URL = 'http://localhost:5002';

interface AppDetails {
  id: number;
  name: string;
  apps_name?: string;
  details?: {
    icon?: string;
    logo?: string;
    custom_form?: string;
  };
}

interface CustomFormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  dataSource?: string; // For dropdown mapping (country, state, district)
}

interface Country {
  id: number;
  country: string;
  code: string;
}

interface State {
  id: number;
  state: string;
  code: string;
  country_id: number;
}

interface District {
  id: number;
  district: string;
  code: string;
  state_id: number;
}

type RegistrationStep = 'email' | 'otp' | 'password' | 'customForm';

export const PartnerRegister: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [app, setApp] = useState<AppDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<RegistrationStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [customFormData, setCustomFormData] = useState<Record<string, any>>({});
  const [customFormFields, setCustomFormFields] = useState<CustomFormField[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);
  
  // Dropdown data
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    fetchAppData();
    fetchCountries();
  }, []);

  // Timer for resend OTP
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const fetchAppData = async () => {
    try {
      const queryString = window.location.search.substring(1);
      if (!queryString) {
        setError('App not specified');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/groups`);
      if (response.data.success) {
        const foundApp = response.data.data.find((a: AppDetails) => a.name === queryString);
        if (foundApp) {
          setApp(foundApp);
          
          if (foundApp.details?.custom_form) {
            try {
              const parsedForm = JSON.parse(foundApp.details.custom_form);
              setCustomFormFields(parsedForm.fields || []);
            } catch (e) {
              console.error('Error parsing custom form:', e);
            }
          }
        } else {
          setError('App not found');
        }
      }
    } catch (err) {
      console.error('Error fetching app:', err);
      setError('Failed to load app data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      // Use public geo endpoint instead of admin endpoint
      const response = await axios.get(`${API_BASE_URL}/geo/countries`);
      if (response.data.success) {
        setCountries(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching countries:', err);
    }
  };

  const fetchStates = async (countryId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/geo/states/${countryId}`);
      if (response.data.success) {
        setStates(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching states:', err);
    }
  };

  const fetchDistricts = async (stateId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/geo/districts/${stateId}`);
      if (response.data.success) {
        setDistricts(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/partner/send-otp`, {
        email,
        app_id: app?.id
      });

      if (response.data.success) {
        setSuccess('OTP sent to your email! Please check your inbox.');
        setStep('otp');
        setTimer(60); // 60 seconds timer
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/partner/verify-otp`, {
        email,
        otp
      });

      if (response.data.success) {
        setSuccess('Email verified successfully!');
        setStep('password');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // If there are custom form fields, go to custom form step
    if (customFormFields.length > 0) {
      setStep('customForm');
    } else {
      // Register directly if no custom form
      await handleRegister();
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/partner/register`, {
        email,
        password,
        app_id: app?.id,
        app_name: app?.name,
        custom_form_data: customFormData
      });

      if (response.data.success) {
        setSuccess('Registration successful!');
        setTimeout(() => {
          navigate(`/partner?${app?.name}`);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomFormChange = (fieldId: string, value: any) => {
    setCustomFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Handle cascading dropdowns
    const field = customFormFields.find(f => f.id === fieldId);
    if (field?.dataSource === 'country') {
      // Clear dependent dropdowns first, then fetch new data
      setStates([]);
      setDistricts([]);
      // Clear dependent form values
      const stateField = customFormFields.find(f => f.dataSource === 'state');
      const districtField = customFormFields.find(f => f.dataSource === 'district');
      setCustomFormData(prev => {
        const updated = { ...prev, [fieldId]: value };
        if (stateField) updated[stateField.id] = '';
        if (districtField) updated[districtField.id] = '';
        return updated;
      });
      if (value) {
        fetchStates(parseInt(value));
      }
    } else if (field?.dataSource === 'state') {
      // Clear dependent dropdown first, then fetch new data
      setDistricts([]);
      // Clear dependent form value
      const districtField = customFormFields.find(f => f.dataSource === 'district');
      setCustomFormData(prev => {
        const updated = { ...prev, [fieldId]: value };
        if (districtField) updated[districtField.id] = '';
        return updated;
      });
      if (value) {
        fetchDistricts(parseInt(value));
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#057284] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* App Logo */}
          {app?.details?.logo && (
            <div className="flex justify-center mb-6">
              <img
                src={`${BACKEND_URL}${app.details.logo}`}
                alt={app.name}
                className="h-32 w-32 object-contain"
              />
            </div>
          )}

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Let's create your account
          </h2>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Step 1: Email Input */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp}>
              <p className="text-center text-gray-600 mb-6">Enter your Email ID</p>

              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none bg-gray-100 rounded-l-xl">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Email ID"
                    className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#057284] focus:border-transparent text-gray-800"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#057284] to-[#0a9fb5] text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'OTP Send to Email'}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/partner?${app?.name}`)}
                className="w-full mt-4 text-[#057284] font-medium hover:underline"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
              <p className="text-center text-gray-600 mb-2">Enter your Email ID</p>

              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none bg-gray-100 rounded-l-xl">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <p className="text-center text-sm text-gray-500 mb-2">OTP Send to Email</p>
              <p className="text-center text-sm text-[#057284] font-medium mb-4">{email}</p>

              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none bg-gray-100 rounded-l-xl">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter OTP"
                    maxLength={6}
                    className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#057284] focus:border-transparent text-gray-800 text-lg tracking-widest"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || otp.length !== 6}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Verifying...' : 'Verify'}
              </button>

              <div className="text-center mt-4">
                {timer > 0 ? (
                  <p className="text-gray-600">Resend Code in {formatTime(timer)}</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[#057284] font-medium hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate(`/partner?${app?.name}`)}
                className="w-full mt-4 text-[#057284] font-medium hover:underline"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Step 3: Password Setup */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              <p className="text-center text-gray-600 mb-6">Create your password</p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none bg-gray-100 rounded-l-xl">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#057284] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none bg-gray-100 rounded-l-xl">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#057284] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#057284] to-[#0a9fb5] text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {customFormFields.length > 0 ? 'Continue' : 'Register'}
              </button>

              <button
                type="button"
                onClick={() => setStep('otp')}
                className="w-full mt-4 text-gray-600 font-medium hover:underline"
              >
                Back
              </button>
            </form>
          )}

          {/* Step 4: Custom Form */}
          {step === 'customForm' && (
            <form onSubmit={handleRegister}>
              <p className="text-center text-gray-600 mb-6">Complete your profile</p>

              <div className="max-h-96 overflow-y-auto space-y-4 mb-6">
                {customFormFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {/* Text Input */}
                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={customFormData[field.id] || ''}
                        onChange={(e) => handleCustomFormChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#057284] focus:border-transparent"
                      />
                    )}

                    {/* Email Input */}
                    {field.type === 'email' && (
                      <input
                        type="email"
                        value={customFormData[field.id] || ''}
                        onChange={(e) => handleCustomFormChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#057284] focus:border-transparent"
                      />
                    )}

                    {/* Phone Input */}
                    {field.type === 'phone' && (
                      <input
                        type="tel"
                        value={customFormData[field.id] || ''}
                        onChange={(e) => handleCustomFormChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#057284] focus:border-transparent"
                      />
                    )}

                    {/* Number Input */}
                    {field.type === 'number' && (
                      <input
                        type="number"
                        value={customFormData[field.id] || ''}
                        onChange={(e) => handleCustomFormChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#057284] focus:border-transparent"
                      />
                    )}

                    {/* Date Input */}
                    {field.type === 'date' && (
                      <input
                        type="date"
                        value={customFormData[field.id] || ''}
                        onChange={(e) => handleCustomFormChange(field.id, e.target.value)}
                        required={field.required}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#057284] focus:border-transparent"
                      />
                    )}

                    {/* Textarea */}
                    {field.type === 'textarea' && (
                      <textarea
                        value={customFormData[field.id] || ''}
                        onChange={(e) => handleCustomFormChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#057284] focus:border-transparent resize-none"
                      />
                    )}

                    {/* Select/Dropdown */}
                    {field.type === 'select' && !field.dataSource && (
                      <select
                        value={customFormData[field.id] || ''}
                        onChange={(e) => handleCustomFormChange(field.id, e.target.value)}
                        required={field.required}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#057284] focus:border-transparent bg-white"
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map((option, idx) => (
                          <option key={idx} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Country Dropdown */}
                    {field.type === 'select' && field.dataSource === 'country' && (
                      <select
                        value={customFormData[field.id] || ''}
                        onChange={(e) => handleCustomFormChange(field.id, e.target.value)}
                        required={field.required}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#057284] focus:border-transparent bg-white"
                      >
                        <option value="">Select Country</option>
                        {countries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.country}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* State Dropdown */}
                    {field.type === 'select' && field.dataSource === 'state' && (
                      <select
                        value={customFormData[field.id] || ''}
                        onChange={(e) => handleCustomFormChange(field.id, e.target.value)}
                        required={field.required}
                        disabled={states.length === 0}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#057284] focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select State</option>
                        {states.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.state}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* District Dropdown */}
                    {field.type === 'select' && field.dataSource === 'district' && (
                      <select
                        value={customFormData[field.id] || ''}
                        onChange={(e) => handleCustomFormChange(field.id, e.target.value)}
                        required={field.required}
                        disabled={districts.length === 0}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#057284] focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select District</option>
                        {districts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.district}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#057284] to-[#0a9fb5] text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Registering...' : 'Complete Registration'}
              </button>

              <button
                type="button"
                onClick={() => setStep('password')}
                className="w-full mt-4 text-gray-600 font-medium hover:underline"
              >
                Back
              </button>
            </form>
          )}
        </div>

        {/* Footer Text */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Already have an account?{' '}
          <button
            onClick={() => navigate(`/partner?${app?.name}`)}
            className="text-[#057284] font-semibold hover:underline"
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

