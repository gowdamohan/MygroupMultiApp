import React, { useState, useEffect, useCallback } from 'react';
import { User, Moon, Sun, ChevronLeft, ChevronRight, X, Settings, LogOut, Camera, MapPin, Building2, Phone, Mail, Key, Shield, HelpCircle, MessageCircle, Share2, Download, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';
import { authAPI } from '../../services/api';

export interface TopIcon {
  id: number;
  icon: string;
  name: string;
  url: string;
  logo?: string;
  background_color?: string;
  apps_name?: string;
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

interface GroupedApps {
  [key: string]: TopIcon[];
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
  const [showMoreAppsModal, setShowMoreAppsModal] = useState(false);
  const [topIcons, setTopIcons] = useState<TopIcon[]>([]);
  const [allGroupedApps, setAllGroupedApps] = useState<GroupedApps>({});
  const [ads, setAds] = useState<Ad[]>([]);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [selectedApp, setSelectedApp] = useState<TopIcon | null>(null);
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

  // Fetch top icons for "My Apps" category only (horizontal scroll)
  // Also fetch all grouped apps for the "More" modal
  const fetchTopIcons = useCallback(async (id?: number) => {
    try {
      // Fetch from home/mobile-data for all apps
      const response = await axios.get(`${API_BASE_URL}/home/mobile-data`);
      if (response.data.success) {
        const topIconData = response.data.data?.topIcon || {};

        // Get My Apps for the top horizontal scroll (Section A)
        const myApps = topIconData.myapps || [];
        const formattedIcons: TopIcon[] = myApps.map((app: any) => ({
          id: app.id,
          name: app.name,
          icon: app.icon || '',
          logo: app.logo || '',
          url: `/mobile/${app.name?.toLowerCase().replace(/\s+/g, '') || app.name}`,
          background_color: app.background_color || '#ffffff',
          apps_name: 'My Apps'
        }));
        setTopIcons(formattedIcons);

        // Set first app as selected if none selected and we have apps
        if (formattedIcons.length > 0 && !selectedApp) {
          // Find the app that matches appName or use first one
          const matchingApp = formattedIcons.find(
            app => app.name.toLowerCase().replace(/\s+/g, '') === appName?.toLowerCase()
          );
          setSelectedApp(matchingApp || formattedIcons[0]);
        }

        // Store all grouped apps for "More" modal
        const grouped: GroupedApps = {};

        // My Apps
        if (myApps.length > 0) {
          grouped['My Apps'] = myApps.map((app: any) => ({
            id: app.id,
            name: app.name,
            icon: app.icon || '',
            logo: app.logo || '',
            url: `/mobile/${app.name?.toLowerCase().replace(/\s+/g, '') || app.name}`,
            background_color: app.background_color || '#ffffff',
            apps_name: 'My Apps'
          }));
        }

        // My Company
        const myCompany = topIconData.myCompany || [];
        if (myCompany.length > 0) {
          grouped['My Company'] = myCompany.map((app: any) => ({
            id: app.id,
            name: app.name,
            icon: app.icon || '',
            logo: app.logo || '',
            url: `/mobile/${app.name?.toLowerCase().replace(/\s+/g, '') || app.name}`,
            background_color: app.background_color || '#ffffff',
            apps_name: 'My Company'
          }));
        }

        // Online Apps
        const online = topIconData.online || [];
        if (online.length > 0) {
          grouped['Online Apps'] = online.map((app: any) => ({
            id: app.id,
            name: app.name,
            icon: app.icon || '',
            logo: app.logo || '',
            url: `/mobile/${app.name?.toLowerCase().replace(/\s+/g, '') || app.name}`,
            background_color: app.background_color || '#ffffff',
            apps_name: 'Online Apps'
          }));
        }

        // Offline Apps
        const offline = topIconData.offline || [];
        if (offline.length > 0) {
          grouped['Offline Apps'] = offline.map((app: any) => ({
            id: app.id,
            name: app.name,
            icon: app.icon || '',
            logo: app.logo || '',
            url: `/mobile/${app.name?.toLowerCase().replace(/\s+/g, '') || app.name}`,
            background_color: app.background_color || '#ffffff',
            apps_name: 'Offline Apps'
          }));
        }

        setAllGroupedApps(grouped);
      }
    } catch (error) {
      console.error('Error fetching top icons:', error);
      setTopIcons([]);
      setAllGroupedApps({});
    }
  }, [appName, selectedApp]);

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
        {/* Section A: Top Navigation Bar with Icons */}
        {showTopIcons && (
          <div className="bg-teal-600 px-2 py-2">
            <div className="flex items-center">
              {/* Fixed "More" Icon on the Left */}
              <button
                onClick={() => setShowMoreAppsModal(true)}
                className="flex flex-col items-center min-w-[50px] cursor-pointer mr-2 flex-shrink-0"
              >
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                  <MoreHorizontal size={18} className="text-white" />
                </div>
                <span className="text-xs text-white mt-1">More</span>
              </button>

              {/* Divider */}
              <div className="w-px h-10 bg-white/30 mr-2 flex-shrink-0" />

              {/* Horizontally Scrollable Top Icons (My Apps) */}
              <div className="flex gap-3 overflow-x-auto scrollbar-hide flex-1">
                {topIcons.length > 0 ? (
                  topIcons.map((icon) => (
                    <a
                      key={icon.id}
                      href={icon.url || `/mobile/${icon.name.toLowerCase().replace(/\s+/g, '')}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedApp(icon);
                        if (onTopIconClick) {
                          onTopIconClick(icon);
                        } else {
                          window.location.href = icon.url || `/mobile/${icon.name.toLowerCase().replace(/\s+/g, '')}`;
                        }
                      }}
                      className={`flex flex-col items-center min-w-[50px] cursor-pointer ${
                        selectedApp?.id === icon.id ? 'opacity-100' : 'opacity-80'
                      }`}
                    >
                      {icon.icon ? (
                        <img
                          src={icon.icon.startsWith('http') ? icon.icon : `${BACKEND_URL}${icon.icon}`}
                          alt={icon.name}
                          className="w-8 h-8 object-contain rounded-full"
                        />
                      ) : icon.logo ? (
                        <img
                          src={icon.logo.startsWith('http') ? icon.logo : `${BACKEND_URL}${icon.logo}`}
                          alt={icon.name}
                          className="w-8 h-8 object-contain rounded-full"
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
                  // Fallback placeholder icons
                  ['Mychat', 'Mydiary', 'Mymedia', 'Myjoy', 'Mybank', 'Myshop'].map((name) => {
                    const fallbackUrl = `/mobile/${name.toLowerCase()}`;
                    return (
                      <a
                        key={name}
                        href={fallbackUrl}
                        onClick={(e) => {
                          e.preventDefault();
                          const fallbackIcon: TopIcon = { id: 0, name, icon: '', url: fallbackUrl };
                          setSelectedApp(fallbackIcon);
                          if (onTopIconClick) {
                            onTopIconClick(fallbackIcon);
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
          </div>
        )}

        {/* Section B: User & App Info Bar */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-teal-500'} border-b`}>
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left: Logged-in User Profile Icon */}
            {showProfileButton && (
              <button
                onClick={handleProfileClick}
                className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-full transition-colors`}
              >
                {userProfile?.profile_img ? (
                  <img
                    src={userProfile.profile_img.startsWith('http') ? userProfile.profile_img : `${BACKEND_URL}${userProfile.profile_img}`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-teal-500"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                )}
              </button>
            )}

            {/* Right: Dark Mode Toggle & Currently Selected App Logo */}
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              {showDarkModeToggle && onDarkModeToggle && (
                <button
                  onClick={onDarkModeToggle}
                  className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-full transition-colors`}
                >
                  {darkMode ? (
                    <Sun size={20} className="text-yellow-400" />
                  ) : (
                    <Moon size={20} className="text-gray-700" />
                  )}
                </button>
              )}

              {/* Currently Selected App Logo */}
              <button
                onClick={handleAppNameClick}
                className={`flex items-center gap-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg px-2 py-1 transition-colors`}
              >
                {/* Show selected app logo or fallback to app info */}
                {selectedApp?.logo ? (
                  <img
                    src={selectedApp.logo.startsWith('http') ? selectedApp.logo : `${BACKEND_URL}${selectedApp.logo}`}
                    alt={selectedApp.name || 'App'}
                    className="w-8 h-8 rounded-full object-contain"
                  />
                ) : selectedApp?.icon ? (
                  <img
                    src={selectedApp.icon.startsWith('http') ? selectedApp.icon : `${BACKEND_URL}${selectedApp.icon}`}
                    alt={selectedApp.name || 'App'}
                    className="w-8 h-8 rounded-full object-contain"
                  />
                ) : displayLogo ? (
                  <img
                    src={displayLogo.startsWith('http') ? displayLogo : `${BACKEND_URL}${displayLogo}`}
                    alt={appInfo?.name || 'App'}
                    className="w-8 h-8 rounded-full object-contain"
                  />
                ) : displayIcon ? (
                  <img
                    src={displayIcon.startsWith('http') ? displayIcon : `${BACKEND_URL}${displayIcon}`}
                    alt={appInfo?.name || 'App'}
                    className="w-8 h-8 rounded-full object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">
                    {(selectedApp?.name || appInfo?.name || appName || 'M').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedApp?.name || appInfo?.name || appName || 'App'}
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

      {/* More Apps Slide-in Modal (Right to Left) */}
      <AnimatePresence>
        {showMoreAppsModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[100] bg-black/50"
              onClick={() => setShowMoreAppsModal(false)}
            />

            {/* Slide-in Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed top-0 right-0 bottom-0 z-[101] w-[85%] max-w-sm ${
                darkMode ? 'bg-gray-900' : 'bg-white'
              } shadow-2xl overflow-y-auto`}
            >
              {/* Modal Header */}
              <div className={`sticky top-0 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-4 flex items-center justify-between`}>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>All Apps</h2>
                <button
                  onClick={() => setShowMoreAppsModal(false)}
                  className={`p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-full transition-colors`}
                >
                  <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>

              {/* Grouped Apps List */}
              <div className="p-4 space-y-6">
                {Object.entries(allGroupedApps).map(([groupName, apps]) => (
                  <div key={groupName}>
                    {/* Group Header */}
                    <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {groupName}
                    </h3>

                    {/* Apps Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {apps.map((app) => (
                        <a
                          key={app.id}
                          href={app.url}
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedApp(app);
                            setShowMoreAppsModal(false);
                            if (onTopIconClick) {
                              onTopIconClick(app);
                            } else {
                              window.location.href = app.url;
                            }
                          }}
                          className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
                            selectedApp?.id === app.id
                              ? darkMode ? 'bg-teal-900/50' : 'bg-teal-50'
                              : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                          }`}
                        >
                          {app.icon ? (
                            <img
                              src={app.icon.startsWith('http') ? app.icon : `${BACKEND_URL}${app.icon}`}
                              alt={app.name}
                              className="w-12 h-12 object-contain rounded-xl"
                            />
                          ) : app.logo ? (
                            <img
                              src={app.logo.startsWith('http') ? app.logo : `${BACKEND_URL}${app.logo}`}
                              alt={app.name}
                              className="w-12 h-12 object-contain rounded-xl"
                            />
                          ) : (
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                              style={{ backgroundColor: app.background_color || '#14b8a6' }}
                            >
                              {app.name?.charAt(0) || 'A'}
                            </div>
                          )}
                          <span className={`text-xs mt-2 text-center truncate w-full ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {app.name}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {Object.keys(allGroupedApps).length === 0 && (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p>No apps available</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
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
