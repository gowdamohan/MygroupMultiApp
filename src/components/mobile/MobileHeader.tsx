import React, { useState, useEffect, useCallback } from 'react';
import { User, Moon, Sun, ChevronLeft, ChevronRight, X, Settings, LogOut, Camera, MapPin, Building2, Phone, Mail, Key, Shield, HelpCircle, MessageCircle, Share2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';
import { authAPI } from '../../services/api';

export interface TopIcon {
  id: number;
  icon: string;
  name: string;
  url: string;
}

interface Ad {
  id: number;
  image: string;
  title: string;
  url: string;
}

interface AppInfo {
  id: number;
  name: string;
  apps_name: string;
  icon: string;
  logo: string;
  name_image: string;
}

interface UserProfile {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_img?: string;
  identification_code?: string;
}

interface MobileHeaderProps {
  appId?: number;
  appName?: string;
  darkMode?: boolean;
  onDarkModeToggle?: () => void;
  userProfile?: UserProfile | null;
  isLoggedIn?: boolean;
  onProfileClick?: () => void;
  onTopIconClick?: (icon: TopIcon) => void;
  onLogout?: () => void;
  // Customization options for different apps
  showTopIcons?: boolean;
  showAds?: boolean;
  showDarkModeToggle?: boolean;
  showProfileButton?: boolean;
  headerBgColor?: string;
  topIconsBgColor?: string;
  customLogo?: string;
  customIcon?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  appId,
  appName,
  darkMode = false,
  onDarkModeToggle,
  userProfile: externalUserProfile,
  isLoggedIn: externalIsLoggedIn = false,
  onProfileClick: externalOnProfileClick,
  onTopIconClick,
  onLogout,
  showTopIcons = true,
  showAds = true,
  showDarkModeToggle = true,
  showProfileButton = true,
  headerBgColor = 'bg-white',
  topIconsBgColor = 'bg-teal-600',
  customLogo,
  customIcon
}) => {
  // Internal state for modals and user profile
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAppSettingsModal, setShowAppSettingsModal] = useState(false);
  const [topIcons, setTopIcons] = useState<TopIcon[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [internalUserProfile, setInternalUserProfile] = useState<UserProfile | null>(null);
  const [internalIsLoggedIn, setInternalIsLoggedIn] = useState(false);

  // Use external props if provided, otherwise use internal state
  const userProfile = externalUserProfile || internalUserProfile;
  const isLoggedIn = externalIsLoggedIn || internalIsLoggedIn;

  // Fetch user profile if not provided
  const fetchUserProfile = useCallback(async () => {
    if (externalUserProfile) return; // Don't fetch if provided as prop
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setInternalIsLoggedIn(false);
        return;
      }
      
      const response = await authAPI.getProfile();
      if (response.data.success) {
        const userData = response.data.data;
        setInternalUserProfile({
          id: userData.id || 0,
          username: userData.username || '',
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          profile_img: userData.profile_img,
          identification_code: userData.identification_code
        });
        setInternalIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setInternalIsLoggedIn(false);
    }
  }, [externalUserProfile]);

  // Fetch app info
  const fetchAppInfo = useCallback(async () => {
    try {
      let url = `${API_BASE_URL}/mymedia/app`;
      if (appName) {
        url += `?name=${encodeURIComponent(appName)}`;
      }
      const response = await axios.get(url);
      if (response.data.success) {
        const info = response.data.data;
        setAppInfo(info);
        return info;
      }
    } catch (error) {
      console.error('Error fetching app info:', error);
    }
    return null;
  }, [appName]);

  // Fetch top icons
  const fetchTopIcons = useCallback(async (id?: number) => {
    try {
      if (id) {
        const response = await axios.get(`${API_BASE_URL}/apps/${id}/top-icons`);
        if (response.data.success && response.data.data && response.data.data.length > 0) {
          setTopIcons(response.data.data);
          return;
        }
      }
      // Fallback: Fetch from home/mobile-data for all apps
      const fallbackResponse = await axios.get(`${API_BASE_URL}/home/mobile-data`);
      if (fallbackResponse.data.success) {
        const myApps = fallbackResponse.data.data?.topIcon?.myapps || [];
        const formattedIcons = myApps.map((app: any) => ({
          id: app.id,
          name: app.name,
          icon: app.icon || '',
          url: `/mobile/${app.name?.toLowerCase().replace(/\s+/g, '') || app.name}`
        }));
        setTopIcons(formattedIcons);
      }
    } catch (error) {
      console.error('Error fetching top icons:', error);
      setTopIcons([]);
    }
  }, []);

  // Fetch ads/carousel by group_name with priority
  const fetchAds = useCallback(async (id?: number) => {
    try {
      let url = `${API_BASE_URL}/header-ads/by-group?limit=4`;
      if (id) {
        url += `&app_id=${id}`;
      }
      const response = await axios.get(url);
      if (response.data.success) {
        const formattedAds = response.data.data.map((ad: any) => ({
          id: ad.id,
          image: ad.file_path || ad.file_url || '',
          title: ad.app?.name || 'Advertisement',
          url: ad.link_url || '#'
        }));
        setAds(formattedAds);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Reset state when appName changes
    setAppInfo(null);
    setTopIcons([]);
    setAds([]);
    setCurrentAdIndex(0);
    
    const initializeHeader = async () => {
      await fetchUserProfile();
      const info = await fetchAppInfo();
      const targetAppId = appId || info?.id;
      fetchTopIcons(targetAppId);
      fetchAds(targetAppId);
    };
    initializeHeader();
  }, [appId, appName, fetchAppInfo, fetchTopIcons, fetchAds, fetchUserProfile]);

  // Auto-rotate carousel
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads.length]);

  const handlePrevAd = () => {
    setCurrentAdIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const handleNextAd = () => {
    setCurrentAdIndex((prev) => (prev + 1) % ads.length);
  };

  // Handle profile icon click
  const handleProfileClick = () => {
    if (externalOnProfileClick) {
      externalOnProfileClick();
    } else {
      setShowProfileModal(true);
    }
  };

  // Handle app name/icon click
  const handleAppNameClick = () => {
    setShowAppSettingsModal(true);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setInternalUserProfile(null);
      setInternalIsLoggedIn(false);
      setShowProfileModal(false);
      if (onLogout) {
        onLogout();
      }
      // Redirect to home
      window.location.href = '/';
    }
  };

  // Get the logo to display (custom or from app info)
  const displayLogo = customLogo || appInfo?.logo;
  const displayIcon = customIcon || appInfo?.icon;

  // Calculate header height
  const getHeaderHeight = () => {
    let height = 60; // Main header bar
    if (showTopIcons) height += 50; // Top icons bar
    if (showAds && ads.length > 0) height += 128; // Carousel ads
    return height;
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* Top Icon Navigation */}
        {showTopIcons && (
          <div className="bg-teal-600 px-2 py-2">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {topIcons.length > 0 ? (
                topIcons.map((icon) => (
                  <a
                    key={icon.id}
                    href={icon.url || `/mobile/${icon.name.toLowerCase().replace(/\s+/g, '')}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (onTopIconClick) {
                        onTopIconClick(icon);
                      } else {
                        window.location.href = icon.url || `/mobile/${icon.name.toLowerCase().replace(/\s+/g, '')}`;
                      }
                    }}
                    className="flex flex-col items-center min-w-[50px] cursor-pointer"
                  >
                    {icon.icon ? (
                      <img
                        src={`${BACKEND_URL}${icon.icon}`}
                        alt={icon.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {icon.name?.charAt(0) || 'A'}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-white mt-1 truncate max-w-[50px]">
                      {icon.name}
                    </span>
                  </a>
                ))
              ) : (
                ['More', 'Mychat', 'Mydiary', 'Mymedia', 'Myjoy', 'Mybank', 'Myshop'].map((name) => {
                  const fallbackUrl = `/mobile/${name.toLowerCase()}`;
                  return (
                    <a
                      key={name}
                      href={fallbackUrl}
                      onClick={(e) => {
                        e.preventDefault();
                        if (onTopIconClick) {
                          onTopIconClick({
                            id: 0,
                            name: name,
                            icon: '',
                            url: fallbackUrl
                          });
                        } else {
                          window.location.href = fallbackUrl;
                        }
                      }}
                      className="flex flex-col items-center min-w-[50px] cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-xs text-white mt-1 truncate max-w-[50px]">
                        {name}
                      </span>
                    </a>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Main Header Bar */}
        <div className="bg-white border-b border-teal-500">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left: User Profile Icon */}
            {showProfileButton && (
              <button
                onClick={handleProfileClick}
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
            )}

            {/* Right: Dark Mode Toggle & App Name with Icon */}
            <div className="flex items-center gap-2">
              {showDarkModeToggle && onDarkModeToggle && (
                <button
                  onClick={onDarkModeToggle}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  {darkMode ? (
                    <Sun size={20} className="text-gray-700" />
                  ) : (
                    <Moon size={20} className="text-gray-700" />
                  )}
                </button>
              )}
              {/* App Name with Icon - Clickable */}
              <button
                onClick={handleAppNameClick}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
              >
                {displayLogo ? (
                  <img
                    src={displayLogo.startsWith('http') ? displayLogo : `${BACKEND_URL}${displayLogo}`}
                    alt={appInfo?.apps_name || appInfo?.name || 'App'}
                    className="w-8 h-8 rounded-full object-contain"
                  />
                ) : displayIcon ? (
                  <img
                    src={displayIcon.startsWith('http') ? displayIcon : `${BACKEND_URL}${displayIcon}`}
                    alt={appInfo?.apps_name || appInfo?.name || 'App'}
                    className="w-8 h-8 rounded-full object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">
                    {(appInfo?.apps_name || appInfo?.name || appName || 'M').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-semibold text-gray-900">
                  {appInfo?.apps_name || appInfo?.name || appName || 'App'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Ads Section */}
        {showAds && ads.length > 0 && (
          <div className="relative bg-gray-100">
            <div className="relative h-32 overflow-hidden">
              {ads.map((ad, index) => (
                <a
                  key={ad.id}
                  href={ad.url}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentAdIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={`${BACKEND_URL}${ad.image}`}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}

              {/* Navigation Arrows */}
              {ads.length > 1 && (
                <>
                  <button
                    onClick={handlePrevAd}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
                  >
                    <ChevronLeft size={20} className="text-white" />
                  </button>
                  <button
                    onClick={handleNextAd}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
                  >
                    <ChevronRight size={20} className="text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Dots Navigation */}
            {ads.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {ads.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentAdIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentAdIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-4">
                {/* Profile Header */}
                <div className="flex flex-col items-center py-4">
                  <div className="relative">
                    {userProfile?.profile_img ? (
                      <img
                        src={`${BACKEND_URL}${userProfile.profile_img}`}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-teal-500"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-teal-500 flex items-center justify-center border-4 border-teal-500">
                        <User size={48} className="text-white" />
                      </div>
                    )}
                    <button className="absolute bottom-0 right-0 p-2 bg-teal-500 rounded-full hover:bg-teal-600 transition-colors">
                      <Camera size={16} className="text-white" />
                    </button>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mt-4">
                    {userProfile?.first_name && userProfile?.last_name
                      ? `${userProfile.first_name} ${userProfile.last_name}`
                      : userProfile?.username || 'User'}
                  </h3>
                  {userProfile?.email && (
                    <p className="text-sm text-gray-600 mt-1">{userProfile.email}</p>
                  )}
                  {userProfile?.identification_code && (
                    <p className="text-xs text-gray-500 mt-1">ID: {userProfile.identification_code}</p>
                  )}
                </div>

                {/* Profile Actions */}
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
                    <User size={20} className="text-gray-700" />
                    <span className="text-gray-900">Edit Profile</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
                    <MapPin size={20} className="text-gray-700" />
                    <span className="text-gray-900">Location Settings</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
                    <Shield size={20} className="text-gray-700" />
                    <span className="text-gray-900">Privacy & Security</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
                    <HelpCircle size={20} className="text-gray-700" />
                    <span className="text-gray-900">Help & Support</span>
                  </button>
                  {isLoggedIn && (
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left mt-4"
                    >
                      <LogOut size={20} className="text-red-600" />
                      <span className="text-red-600 font-semibold">Logout</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App Settings Modal */}
      <AnimatePresence>
        {showAppSettingsModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {displayLogo ? (
                    <img
                      src={displayLogo.startsWith('http') ? displayLogo : `${BACKEND_URL}${displayLogo}`}
                      alt="App"
                      className="w-8 h-8 rounded-full object-contain"
                    />
                  ) : displayIcon ? (
                    <img
                      src={displayIcon.startsWith('http') ? displayIcon : `${BACKEND_URL}${displayIcon}`}
                      alt="App"
                      className="w-8 h-8 rounded-full object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">
                      {(appInfo?.apps_name || appInfo?.name || appName || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h2 className="text-lg font-semibold text-gray-900">
                    {appInfo?.apps_name || appInfo?.name || appName || 'App'} Settings
                  </h2>
                </div>
                <button
                  onClick={() => setShowAppSettingsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
                  <Settings size={20} className="text-gray-700" />
                  <span className="text-gray-900">App Preferences</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
                  <MessageCircle size={20} className="text-gray-700" />
                  <span className="text-gray-900">Notifications</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
                  <Share2 size={20} className="text-gray-700" />
                  <span className="text-gray-900">Share App</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
                  <Download size={20} className="text-gray-700" />
                  <span className="text-gray-900">Download Content</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left">
                  <HelpCircle size={20} className="text-gray-700" />
                  <span className="text-gray-900">About {appInfo?.apps_name || appInfo?.name || appName}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// Export header height calculation helper
export const getMobileHeaderHeight = (showTopIcons: boolean = true, showAds: boolean = true, hasAds: boolean = false) => {
  let height = 60; // Main header bar
  if (showTopIcons) height += 50; // Top icons bar
  if (showAds && hasAds) height += 128; // Carousel ads
  return height;
};

export default MobileHeader;
