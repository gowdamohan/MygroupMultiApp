import React, { useState, useEffect, useCallback } from 'react';
import { User, ChevronLeft, ChevronRight, X, Search, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';
import { authAPI } from '../../services/api';
import { UserProfileModal } from './UserProfileModal';
import { AppSettingsModal } from './AppSettingsModal';

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

interface UserProfileData {
  set_country?: number;
  set_state?: number;
  set_district?: number;
  country?: number;
  state?: number;
  district?: number;
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
  profile?: UserProfileData;
}

interface GroupedApps {
  [key: string]: TopIcon[];
}

interface MobileHeaderProps {
  appId?: number;
  appName?: string;
  /** When true, parent provides app info - header will not fetch /mymedia/app. Pass appInfo when loaded. */
  appInfoFromParent?: boolean;
  /** App info from parent (e.g. MobileAppPage). When provided, header uses it instead of fetching. */
  appInfo?: AppInfo | null;
  /** Selected footer category ID for carousel ad filtering (required by API). */
  selectedCategoryId?: number | null;
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
  appInfoFromParent = false,
  appInfo: appInfoProp = undefined,
  selectedCategoryId = null,
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
  const [internalAppInfo, setInternalAppInfo] = useState<AppInfo | null>(null);
  const appInfo = appInfoFromParent ? (appInfoProp ?? internalAppInfo) : (appInfoProp ?? internalAppInfo);
  const [selectedApp, setSelectedApp] = useState<TopIcon | null>(null);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [internalUserProfile, setInternalUserProfile] = useState<UserProfile | null>(null);
  const [internalIsLoggedIn, setInternalIsLoggedIn] = useState(false);

  // Use external props if provided, otherwise use internal state
  const userProfile = externalUserProfile || internalUserProfile;
  const isLoggedIn = externalIsLoggedIn || internalIsLoggedIn;

  // Fetch user profile if not provided (when parent provides app info it usually provides profile too)
  const fetchUserProfile = useCallback(async () => {
    if (externalUserProfile != null) return; // Don't fetch if provided as prop
    if (appInfoFromParent) return; // Parent (e.g. MobileAppPage) will provide profile

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
          identification_code: userData.identification_code,
          profile: userData.profile ? {
            set_country: userData.profile.set_country,
            set_state: userData.profile.set_state,
            set_district: userData.profile.set_district,
            country: userData.profile.country,
            state: userData.profile.state,
            district: userData.profile.district
          } : undefined
        });
        setInternalIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setInternalIsLoggedIn(false);
    }
  }, [externalUserProfile, appInfoFromParent]);

  // Fetch app info (only when parent does not provide it)
  const fetchAppInfo = useCallback(async () => {
    if (appInfoFromParent) return null;
    try {
      let url = `${API_BASE_URL}/mymedia/app`;
      if (appName) {
        url += `?name=${encodeURIComponent(appName)}`;
      }
      const response = await axios.get(url);
      if (response.data.success) {
        const info = response.data.data;
        setInternalAppInfo(info);
        return info;
      }
    } catch (error) {
      console.error('Error fetching app info:', error);
    }
    return null;
  }, [appName, appInfoFromParent]);

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

  // Fetch carousel ads with location-based and category-based filtering
  // API requires app_id and category_id. Location params from user profile for hierarchical filtering.
  const fetchAds = useCallback(async (id?: number, profile?: UserProfileData, categoryId?: number | null) => {
    try {
      const params = new URLSearchParams();
      if (id) params.append('app_id', id.toString());
      if (categoryId != null) params.append('category_id', categoryId.toString());

      const countryId = profile?.set_country || profile?.country;
      const stateId = profile?.set_state || profile?.state;
      const districtId = profile?.set_district || profile?.district;
      if (countryId) params.append('country_id', countryId.toString());
      if (stateId) params.append('state_id', stateId.toString());
      if (districtId) params.append('district_id', districtId.toString());

      const url = `${API_BASE_URL}/advertisement/carousel?${params.toString()}`;
      const response = await axios.get(url);

      if (response.data.success) {
        const formattedAds = response.data.data.map((ad: any) => ({
          id: ad.id,
          image: ad.signed_url || ad.image || ad.file_path || ad.file_url || '',
          title: ad.title || 'Advertisement',
          url: ad.url || '#'
        }));
        setAds(formattedAds);
      }
    } catch (error) {
      console.error('Error fetching carousel ads:', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const initializingRef = React.useRef(false);
  const lastAppNameRef = React.useRef<string | undefined>(undefined);

  // Single init effect: run only when appName changes (not when appId gets set later by parent)
  useEffect(() => {
    if (lastAppNameRef.current === appName && initializingRef.current) return;
    lastAppNameRef.current = appName;
    initializingRef.current = true;

    if (!appInfoFromParent) setInternalAppInfo(null);
    setTopIcons([]);
    setAds([]);
    setCurrentAdIndex(0);

    const initializeHeader = async () => {
      await fetchUserProfile();
      const effectiveAppId = appId ?? appInfoProp?.id;
      const info = effectiveAppId != null && appInfoFromParent && appInfoProp
        ? appInfoProp
        : await fetchAppInfo();
      const targetAppId = effectiveAppId ?? info?.id;
      fetchTopIcons(targetAppId);

      let profileData: UserProfileData | undefined;
      if (externalUserProfile?.profile) {
        profileData = externalUserProfile.profile;
      } else {
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            if (userData.profile) {
              profileData = {
                set_country: userData.profile.set_country,
                set_state: userData.profile.set_state,
                set_district: userData.profile.set_district,
                country: userData.profile.country,
                state: userData.profile.state,
                district: userData.profile.district
              };
            }
          }
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }

      if (targetAppId != null || !appInfoFromParent) {
        fetchAds(targetAppId ?? undefined, profileData, selectedCategoryId ?? undefined);
      }
      initializingRef.current = false;
    };
    initializeHeader();
  }, [appName, appInfoFromParent]);

  // When app id or selected category becomes available/changes, fetch ads (category_id is required by API)
  useEffect(() => {
    if (!showAds) return;
    const effectiveAppId = appId ?? appInfoProp?.id;
    if (effectiveAppId == null || selectedCategoryId == null) return;
    let profileData: UserProfileData | undefined;
    if (externalUserProfile?.profile) {
      profileData = externalUserProfile.profile;
    } else {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData?.profile) {
            profileData = {
              set_country: userData.profile.set_country,
              set_state: userData.profile.set_state,
              set_district: userData.profile.set_district,
              country: userData.profile.country,
              state: userData.profile.state,
              district: userData.profile.district
            };
          }
        }
      } catch (e) {
        // ignore
      }
    }
    fetchAds(effectiveAppId, profileData, selectedCategoryId);
  }, [appId, appInfoProp?.id, showAds, selectedCategoryId]);

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
        {/* Section A: Top Navigation Bar with Icons - Updated with pink/rose background */}
        {showTopIcons && (
          <div className="bg-gradient-to-r from-pink-200 via-pink-100 to-pink-200 px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              {/* Fixed Menu Icon on the Left */}
              <button
                onClick={() => setShowMoreAppsModal(true)}
                className="flex flex-col items-center min-w-[60px] cursor-pointer flex-shrink-0"
              >
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow">
                  <Menu size={20} className="text-gray-700" />
                </div>
              </button>

              {/* Horizontally Scrollable Top Icons (My Apps) - Updated styling */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
                {topIcons.length > 0 ? (
                  topIcons.map((icon, index) => (
                    <a
                      key={`top-${icon.id}-${icon.name}-${index}`}
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
                      className={`flex flex-col items-center min-w-[60px] cursor-pointer transition-all ${
                        selectedApp?.id === icon.id ? 'scale-105' : 'opacity-90 hover:opacity-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg shadow-sm flex items-center justify-center transition-all ${
                        selectedApp?.id === icon.id
                          ? 'bg-red-500 shadow-md'
                          : icon.background_color
                            ? `bg-white`
                            : 'bg-white'
                      }`}>
                        {icon.icon ? (
                          <img
                            src={icon.icon.startsWith('http') ? icon.icon : `${BACKEND_URL}${icon.icon}`}
                            alt={icon.name}
                            className="w-6 h-6 object-contain"
                          />
                        ) : icon.logo ? (
                          <img
                            src={icon.logo.startsWith('http') ? icon.logo : `${BACKEND_URL}${icon.logo}`}
                            alt={icon.name}
                            className="w-6 h-6 object-contain"
                          />
                        ) : (
                          <span className={`font-bold text-sm ${selectedApp?.id === icon.id ? 'text-white' : 'text-gray-700'}`}>
                            {icon.name?.charAt(0) || 'A'}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] mt-1 truncate max-w-[60px] font-medium ${
                        selectedApp?.id === icon.id ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {icon.name}
                      </span>
                    </a>
                  ))
                ) : (
                  // Fallback placeholder icons with updated styling
                  ['Home', 'My Chat', 'My Media', 'My Video', 'My Go'].map((name) => {
                    const fallbackUrl = `/mobile/${name.toLowerCase().replace(/\s+/g, '')}`;
                    const isSelected = name.toLowerCase().replace(/\s+/g, '') === appName?.toLowerCase();
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
                        className={`flex flex-col items-center min-w-[60px] cursor-pointer transition-all ${
                          isSelected ? 'scale-105' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg shadow-sm flex items-center justify-center ${
                          isSelected ? 'bg-red-500' : 'bg-white'
                        }`}>
                          <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                            {name.charAt(0)}
                          </span>
                        </div>
                        <span className={`text-[10px] mt-1 truncate max-w-[60px] font-medium ${
                          isSelected ? 'text-gray-900' : 'text-gray-700'
                        }`}>
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

        {/* Section B: User Profile & Search Bar - Updated design */}
        <div className="bg-gradient-to-r from-pink-200 via-pink-100 to-pink-200 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: User Profile Icon */}
            {showProfileButton && (
              <button
                onClick={handleProfileClick}
                className="flex-shrink-0"
              >
                {userProfile?.profile_img ? (
                  <img
                    src={userProfile.profile_img.startsWith('http') ? userProfile.profile_img : `${BACKEND_URL}${userProfile.profile_img}`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-sm border-2 border-white">
                    <User size={20} className="text-white" />
                  </div>
                )}
              </button>
            )}

            {/* Right: Search Bar, Menu, and Pinterest Icon */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              {/* Search Icon */}
              <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow">
                <Search size={20} className="text-gray-700" />
              </button>

              {/* Menu Icon */}
              <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow">
                <Menu size={20} className="text-gray-700" />
              </button>

              {/* Pinterest-style Icon (using app logo or default) */}
              <button
                onClick={handleAppNameClick}
                className="w-10 h-10 rounded-full bg-red-600 shadow-sm flex items-center justify-center hover:shadow-md transition-shadow"
              >
                {displayLogo || displayIcon ? (
                  <img
                    src={(displayLogo || displayIcon)!.startsWith('http') ? (displayLogo || displayIcon) : `${BACKEND_URL}${displayLogo || displayIcon}`}
                    alt={appInfo?.name || 'App'}
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {(selectedApp?.name || appInfo?.name || appName || 'P').charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Ads Section - Updated with rounded corners and better styling */}
        {showAds && ads.length > 0 && (
          <div className="bg-gradient-to-r from-pink-200 via-pink-100 to-pink-200 px-4 pb-3">
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-32 overflow-hidden">
                {ads.map((ad, index) => (
                  <a
                    key={`ad-${ad.id}-${index}`}
                    href={ad.url}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === currentAdIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <img
                      src={`${ad.image}`}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}

                {/* Navigation Arrows - Updated styling */}
                {ads.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevAd}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 hover:bg-white rounded-full transition-all shadow-md"
                    >
                      <ChevronLeft size={18} className="text-gray-700" />
                    </button>
                    <button
                      onClick={handleNextAd}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 hover:bg-white rounded-full transition-all shadow-md"
                    >
                      <ChevronRight size={18} className="text-gray-700" />
                    </button>
                  </>
                )}
              </div>

              {/* Dots Navigation - Updated styling */}
              {ads.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {ads.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentAdIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentAdIndex ? 'bg-red-500 w-4' : 'bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <UserProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            userProfile={userProfile}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
            appLogo={displayLogo}
            appName={appInfo?.apps_name || appInfo?.name || appName || 'My Group'}
          />
        )}
      </AnimatePresence>

      {/* App Settings Modal */}
      <AnimatePresence>
        {showAppSettingsModal && (
          <AppSettingsModal
            isOpen={showAppSettingsModal}
            onClose={() => setShowAppSettingsModal(false)}
            appLogo={displayLogo}
            appIcon={displayIcon}
            appName={appInfo?.apps_name || appInfo?.name || appName || 'App'}
          />
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
                          key={`${groupName}-${app.id}-${app.name}`}
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

// Export header height calculation helper - Updated for new design
export const getMobileHeaderHeight = (showTopIcons: boolean = true, showAds: boolean = true, hasAds: boolean = false) => {
  let height = 0;
  if (showTopIcons) height += 70; // Top icons bar (increased for new design)
  height += 66; // User profile & search bar
  if (showAds && hasAds) height += 152; // Carousel ads with padding (increased for rounded design)
  return height;
};

export default MobileHeader;
