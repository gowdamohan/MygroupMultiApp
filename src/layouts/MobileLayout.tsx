import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MoreHorizontal, User, Moon, Sun, Settings, X, Camera,
  Lock, Globe, DollarSign, Key, FileText, Shield,
  HelpCircle, MessageCircle, Phone, Share2, Download,
  Star, LogOut, Users, MapPin, Building2, Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { authAPI } from '../services/api';
import { AuthModal } from '../components/AuthModal';
import { API_BASE_URL, BACKEND_URL } from '../config/api.config';

interface AppItem {
  id: number;
  name: string;
  icon: string;
  url: string;
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name?: string;
  display_name?: string;
  phone: string;
  profile_img?: string;
  identification_code?: string;
}

interface MobileLayoutProps {
  children: React.ReactNode;
  darkMode?: boolean;
  onDarkModeToggle?: () => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  darkMode = false,
  onDarkModeToggle
}) => {
  const location = useLocation();
  const [apps, setApps] = useState<AppItem[]>([]);
  const [showMoreAppsModal, setShowMoreAppsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [internalDarkMode, setInternalDarkMode] = useState(darkMode);
  const [profileTab, setProfileTab] = useState<'profile' | 'personal' | 'address'>('profile');

  // Location state
  const [countries, setCountries] = useState<{ id: number; country: string }[]>([]);
  const [states, setStates] = useState<{ id: number; state: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: number; district: string }[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [userLocation, setUserLocation] = useState<{
    setCountryData?: { country: string };
    setStateData?: { state: string };
    setDistrictData?: { district: string };
  } | null>(null);

  useEffect(() => {
    fetchApps();
    checkAuth();
  }, []);

  useEffect(() => {
    if (profileTab === 'profile' && showProfileModal) {
      fetchCountries();
    }
  }, [profileTab, showProfileModal]);

  useEffect(() => {
    if (selectedCountry) {
      fetchStates(selectedCountry);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState) {
      fetchDistricts(selectedState);
    }
  }, [selectedState]);

  const fetchApps = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/home/mobile-data`);
      if (response.data.success) {
        setApps(response.data.data.topIcon?.myapps || []);
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsLoggedIn(true);
      try {
        setUserProfile(JSON.parse(user));
        await fetchUserProfile();
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    } else {
      setShowAuthModal(true);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const userData = response.data.data;
        setUserProfile(userData.profile);
        localStorage.setItem('user', JSON.stringify(userData.profile));

        if (userData.profile.set_country) {
          setUserLocation({
            setCountryData: { country: userData.profile.setCountryData?.country || '' },
            setStateData: { state: userData.profile.setStateData?.state || '' },
            setDistrictData: { district: userData.profile.setDistrictData?.district || '' }
          });
          setSelectedCountry(userData.profile.set_country.toString());
          if (userData.profile.set_state) {
            setSelectedState(userData.profile.set_state.toString());
          }
          if (userData.profile.set_district) {
            setSelectedDistrict(userData.profile.set_district.toString());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/countries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCountries(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchStates = async (countryId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/states?countryId=${countryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchDistricts = async (stateId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/districts?stateId=${stateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setDistricts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      setUserProfile(null);
      setUserLocation(null);
      setShowProfileModal(false);
      setShowLocationModal(false);
      setShowAuthModal(true);
      setSelectedCountry('');
      setSelectedState('');
      setSelectedDistrict('');
    }
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // TODO: Upload to server
      console.log('Profile image selected:', e.target.files[0]);
    }
  };

  const handleSaveLocation = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${API_BASE_URL}/profile/location`, {
        set_country: selectedCountry,
        set_state: selectedState,
        set_district: selectedDistrict
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUserLocation({
        setCountryData: countries.find(c => c.id.toString() === selectedCountry),
        setStateData: states.find(s => s.id.toString() === selectedState),
        setDistrictData: districts.find(d => d.id.toString() === selectedDistrict)
      });
      setShowLocationModal(false);
    } catch (error) {
      console.error('Error saving location:', error);
      setShowLocationModal(false);
    }
  };

  const toggleDarkMode = () => {
    if (onDarkModeToggle) {
      onDarkModeToggle();
    } else {
      setInternalDarkMode(!internalDarkMode);
    }
  };

  const effectiveDarkMode = onDarkModeToggle ? darkMode : internalDarkMode;

  return (
    <div className={`min-h-screen ${effectiveDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Fixed Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: '#057284' }}>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 px-4 py-3" style={{ width: 'max-content' }}>
            {/* More Options Button */}
            <button
              onClick={() => setShowMoreAppsModal(true)}
              className="flex flex-col items-center gap-1 min-w-[60px] flex-shrink-0"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MoreHorizontal size={20} className="text-white" />
              </div>
              <span className="text-white text-xs text-center">More</span>
            </button>

            {/* Scrollable App Icons */}
            {apps.map((app) => (
              <Link
                key={app.id}
                to={app.url || '#'}
                className={`flex flex-col items-center gap-1 min-w-[60px] ${
                  location.pathname === app.url ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                }`}
              >
                {app.icon ? (
                  <img src={app.icon} alt={app.name} className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{app.name?.charAt(0)}</span>
                  </div>
                )}
                <span className="text-white text-xs text-center">{app.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Logo Header */}
      <div className="fixed top-[60px] left-0 right-0 z-40 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* User Profile Icon */}
          <button
            onClick={() => isLoggedIn && setShowProfileModal(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {userProfile?.profile_img ? (
              <img
                src={`${BACKEND_URL}${userProfile.profile_img}`}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User size={24} className="text-gray-700" />
            )}
          </button>

          {/* Dark Mode Toggle & Settings */}
          <div className="flex items-center gap-2">
            <button onClick={toggleDarkMode} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              {effectiveDarkMode ? <Sun size={20} className="text-gray-700" /> : <Moon size={20} className="text-gray-700" />}
            </button>
            <button
              onClick={() => isLoggedIn && setShowProfileModal(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Settings size={20} className="text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-[120px]">
        {children}
      </div>

      {/* More Apps Modal */}
      <AnimatePresence>
        {showMoreAppsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4a4a4a 0%, #2d2d2d 100%)' }}
            onClick={() => setShowMoreAppsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full h-full max-h-screen overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 sticky top-0 z-10" style={{ background: 'linear-gradient(135deg, #4a4a4a 0%, #2d2d2d 100%)' }}>
                <h2 className="text-2xl font-bold text-white">My Apps</h2>
                <button
                  onClick={() => setShowMoreAppsModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={28} className="text-white" />
                </button>
              </div>
              <div className="p-4 grid grid-cols-4 gap-4">
                {apps.map((app) => (
                  <Link
                    key={app.id}
                    to={app.url || '#'}
                    className="flex flex-col items-center gap-2 group"
                    onClick={() => setShowMoreAppsModal(false)}
                  >
                    <div className="relative">
                      {app.icon ? (
                        <div className="w-16 h-16 rounded-full bg-white p-2 shadow-lg group-hover:scale-110 transition-transform">
                          <img src={app.icon} alt={app.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="text-white text-lg font-bold">{app.name?.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-white text-sm text-center">{app.name}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Profile Modal - Slide from Right */}
      <AnimatePresence>
        {showProfileModal && userProfile && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[100]"
              onClick={() => setShowProfileModal(false)}
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-white z-[101] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Profile Header */}
              <div className="relative" style={{ background: 'linear-gradient(135deg, #057284 0%, #0a9fb5 100%)' }}>
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={24} className="text-white" />
                  </button>
                </div>

                <div className="flex flex-col items-center pt-8 pb-6 px-4">
                  {/* Profile Picture */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-white p-1">
                      {userProfile.profile_img ? (
                        <img
                          src={`${BACKEND_URL}${userProfile.profile_img}`}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                          {userProfile.first_name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <Camera size={16} className="text-gray-700" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileImageUpload}
                      />
                    </label>
                  </div>

                  {/* User Info */}
                  <h2 className="text-2xl font-bold text-white mt-4">
                    {userProfile.display_name || userProfile.first_name}
                  </h2>
                  {userProfile.identification_code && (
                    <p className="text-white/90 text-sm mt-1 font-mono bg-white/20 px-3 py-1 rounded-full">
                      ID: {userProfile.identification_code}
                    </p>
                  )}
                </div>
              </div>

              {/* Profile Tabs */}
              <div className="border-b">
                <div className="flex">
                  <button
                    onClick={() => setProfileTab('profile')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                      profileTab === 'profile'
                        ? 'text-[#057284] border-b-2 border-[#057284]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setProfileTab('personal')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                      profileTab === 'personal'
                        ? 'text-[#057284] border-b-2 border-[#057284]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Personal
                  </button>
                  <button
                    onClick={() => setProfileTab('address')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                      profileTab === 'address'
                        ? 'text-[#057284] border-b-2 border-[#057284]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Address
                  </button>
                </div>
              </div>

              {/* Profile Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {profileTab === 'profile' && (
                  <div className="space-y-4">
                    {/* Settings Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Settings</h3>
                      <div className="space-y-2">
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <Lock size={20} className="text-gray-600" />
                          <span className="text-gray-700">Security</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <Globe size={20} className="text-gray-600" />
                          <span className="text-gray-700">Language</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <DollarSign size={20} className="text-gray-600" />
                          <span className="text-gray-700">Currency</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <Key size={20} className="text-gray-600" />
                          <span className="text-gray-700">Change Password</span>
                        </button>
                      </div>
                    </div>

                    {/* Location Setting */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Location</h3>
                      <button
                        onClick={() => setShowLocationModal(true)}
                        className="w-full bg-blue-50 p-4 rounded-lg mb-4 hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin size={16} className="text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">Set Your Location</span>
                        </div>
                        {userLocation && userLocation.setCountryData ? (
                          <p className="text-xs text-blue-600 text-left">
                            {userLocation.setCountryData?.country}, {userLocation.setStateData?.state}, {userLocation.setDistrictData?.district}
                          </p>
                        ) : (
                          <p className="text-xs text-blue-600 text-left">Select your country, state, and district</p>
                        )}
                      </button>
                    </div>

                    {/* Legal Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Legal</h3>
                      <div className="space-y-2">
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <FileText size={20} className="text-gray-600" />
                          <span className="text-gray-700">Terms & Conditions</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <Shield size={20} className="text-gray-600" />
                          <span className="text-gray-700">Privacy Policy</span>
                        </button>
                      </div>
                    </div>

                    {/* Help & Support Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Help & Support</h3>
                      <div className="space-y-2">
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <HelpCircle size={20} className="text-gray-600" />
                          <span className="text-gray-700">Feedback</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <MessageCircle size={20} className="text-gray-600" />
                          <span className="text-gray-700">Live Chat</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <Phone size={20} className="text-gray-600" />
                          <span className="text-gray-700">Contact</span>
                        </button>
                      </div>
                    </div>

                    {/* Share & Download Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Share</h3>
                      <div className="space-y-2">
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <Share2 size={20} className="text-gray-600" />
                          <span className="text-gray-700">Share App</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <Download size={20} className="text-gray-600" />
                          <span className="text-gray-700">Download Apps</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <Star size={20} className="text-gray-600" />
                          <span className="text-gray-700">Reviews and Ratings</span>
                        </button>
                      </div>
                    </div>

                    {/* Total Users Section */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Total Users</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Users size={16} className="text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">Global</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-700">1.2M</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin size={16} className="text-green-600" />
                            <span className="text-xs text-green-600 font-medium">National</span>
                          </div>
                          <p className="text-2xl font-bold text-green-700">450K</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 size={16} className="text-purple-600" />
                            <span className="text-xs text-purple-600 font-medium">Regional</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-700">85K</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Map size={16} className="text-orange-600" />
                            <span className="text-xs text-orange-600 font-medium">Local</span>
                          </div>
                          <p className="text-2xl font-bold text-orange-700">12K</p>
                        </div>
                      </div>
                    </div>

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium"
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}

                {profileTab === 'personal' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-500">First Name</label>
                      <p className="text-gray-900 font-medium mt-1">{userProfile.first_name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Last Name</label>
                      <p className="text-gray-900 font-medium mt-1">{userProfile.last_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="text-gray-900 font-medium mt-1">{userProfile.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Phone</label>
                      <p className="text-gray-900 font-medium mt-1">{userProfile.phone}</p>
                    </div>
                  </div>
                )}

                {profileTab === 'address' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-500">Address</label>
                      <p className="text-gray-900 font-medium mt-1">Address information will be displayed here</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Location Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[110]"
              onClick={() => setShowLocationModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-4 bg-white rounded-lg z-[111] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Set Your Location</h2>
                  <button
                    onClick={() => setShowLocationModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-gray-600" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Country</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.country}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!selectedCountry}
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!selectedState}
                    >
                      <option value="">Select District</option>
                      {districts.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.district}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowLocationModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveLocation}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          checkAuth();
        }}
        allowClose={false}
      />
    </div>
  );
};

export default MobileLayout;

