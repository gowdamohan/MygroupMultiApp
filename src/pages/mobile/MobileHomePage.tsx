import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Sun, Moon, Settings, MoreHorizontal, X, Camera,
  Lock, Globe, DollarSign, Key, FileText, Shield,
  HelpCircle, MessageCircle, Phone, Share2, Download,
  Star, LogOut, Users, MapPin, Building2, Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { HomeData } from '../../types/home.types';
import { AuthModal } from '../../components/AuthModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api/v1';
const BACKEND_URL = 'http://localhost:5002';

interface App {
  id: number;
  name: string;
  apps_name: string;
  details?: {
    icon?: string;
    logo?: string;
    name_image?: string;
  };
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

export const MobileHomePage: React.FC = () => {
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMoreAppsModal, setShowMoreAppsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [allApps, setAllApps] = useState<App[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileTab, setProfileTab] = useState<'profile' | 'personal' | 'address'>('profile');
  const [profileImage, setProfileImage] = useState<File | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    if (!token) {
      setShowAuthModal(true);
      setIsLoggedIn(false);
    } else {
      setIsLoggedIn(true);
      if (user) {
        setUserProfile(JSON.parse(user));
      }
      fetchUserProfile();
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
    if (isLoggedIn) {
      fetchAllApps();
    }
  }, [isLoggedIn]);

  const fetchHomeData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/home/mobile-data`);
      if (response.data.success) {
        setHomeData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllApps = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/groups`);
      if (response.data.success) {
        setAllApps(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching all apps:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userId = userProfile?.id || JSON.parse(localStorage.getItem('user') || '{}').id;

      if (!userId) return;

      const response = await axios.get(`${API_BASE_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserProfile(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserProfile(null);
    setShowProfileModal(false);
    setShowAuthModal(true);
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
      // TODO: Upload to server
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!homeData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <>
      {/* Auth Modal - Cannot be closed until user logs in */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        allowClose={false}
      />

      <div className={`mobile-home ${darkMode ? 'dark-mode' : ''}`}>
        {/* Fixed Top Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: '#057284' }}>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 px-4 py-3" style={{ width: 'max-content' }}>
              {/* More Options Button - Fixed on Left */}
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
              {homeData.topIcon.myapps.map((app) => (
                <Link
                  key={app.id}
                  to={app.url || '#'}
                  className="flex flex-col items-center gap-1 min-w-[60px]"
                >
                  <img
                    src={`${app.icon}`}
                    alt={app.name}
                    className="w-8 h-8 object-contain"
                  />
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
              <button
                onClick={toggleDarkMode}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                {darkMode ? <Sun size={20} className="text-gray-700" /> : <Moon size={20} className="text-gray-700" />}
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

      {/* Main Content - Add margin-top to account for fixed headers */}
      <div className="pt-[120px]">
        {/* My Apps Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
          style={{ background: 'linear-gradient(-45deg, #ac32e4, #7918f2, #4801ff)' }}>
          <div className="flex flex-col gap-4 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white text-center mb-4">My Apps</h2>
            {homeData.topIcon.myapps.map((app) => (
              <Link
                key={app.id}
                to={app.url || '#'}
                className="flex items-center justify-center gap-3 bg-transparent border-2 border-white rounded-full py-3 px-6 text-white font-medium hover:bg-white hover:text-purple-600 transition-all duration-300"
              >
                <img
                  src={`${app.icon}`}
                  alt={app.name}
                  className="w-5 h-5 object-contain"
                />
                <span>{app.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* More sections will be added here */}
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
                className="w-full h-full overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 sticky top-0 z-10" style={{ background: 'linear-gradient(135deg, #4a4a4a 0%, #2d2d2d 100%)' }}>
                  <h2 className="text-2xl font-bold text-white">My Apps</h2>
                  <button
                    onClick={() => setShowMoreAppsModal(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={28} className="text-white" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="px-6 pb-8">
                  {/* Group apps by apps_name */}
                  {['My Apps', 'My Company', 'My Online Apps', 'My Offline Apps'].map((category) => {
                    const categoryApps = allApps.filter(app => app.apps_name === category);
                    if (categoryApps.length === 0) return null;

                    return (
                      <div key={category} className="mb-8">
                        <h3 className="text-xl font-bold text-white mb-6">{category}</h3>
                        <div className="grid grid-cols-4 gap-6">
                          {categoryApps.map((app) => (
                            <Link
                              key={app.id}
                              to="#"
                              className="flex flex-col items-center gap-2 group"
                              onClick={() => setShowMoreAppsModal(false)}
                            >
                              <div className="relative">
                                {app.details?.icon ? (
                                  <div className="w-16 h-16 rounded-full bg-white p-2 shadow-lg group-hover:scale-110 transition-transform">
                                    <img
                                      src={`${BACKEND_URL}${app.details.icon}`}
                                      alt={app.name}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                                    {app.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <span className="text-white text-xs text-center font-medium leading-tight">
                                {app.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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
      </div>
    </>
  );
};

