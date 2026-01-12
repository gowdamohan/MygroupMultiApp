import React, { useState, useEffect, useCallback } from 'react';
import { User, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

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
  profile_img?: string;
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
  userProfile,
  isLoggedIn: _isLoggedIn = false,
  onProfileClick,
  onTopIconClick,
  showTopIcons = true,
  showAds = true,
  showDarkModeToggle = true,
  showProfileButton = true,
  headerBgColor = 'bg-white',
  topIconsBgColor = 'bg-gray-900',
  customLogo,
  customIcon
}) => {
  // Suppress unused variable warning
  void _isLoggedIn;

  const [topIcons, setTopIcons] = useState<TopIcon[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [_loading, setLoading] = useState(true);

  // Fetch app info
  const fetchAppInfo = useCallback(async () => {
    try {
      let url = `${API_BASE_URL}/mymedia/app`;
      if (appName) {
        url += `?name=${encodeURIComponent(appName)}`;
      }
      const response = await axios.get(url);
      if (response.data.success) {
        setAppInfo(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching app info:', error);
    }
  }, [appName]);

  // Fetch top icons
  const fetchTopIcons = useCallback(async (id: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/apps/${id}/top-icons`);
      if (response.data.success) {
        setTopIcons(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching top icons:', error);
      // Fallback to empty array
      setTopIcons([]);
    }
  }, []);

  // Fetch ads/carousel
  const fetchAds = useCallback(async (id: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/apps/${id}/ads`);
      if (response.data.success) {
        setAds(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      // Fallback to empty array
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeHeader = async () => {
      const info = await fetchAppInfo();
      const targetAppId = appId || appInfo?.id;
      if (targetAppId) {
        fetchTopIcons(targetAppId);
        fetchAds(targetAppId);
      } else {
        setLoading(false);
      }
    };
    initializeHeader();
  }, [appId, fetchAppInfo, fetchTopIcons, fetchAds]);

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

  const handleTopIconClick = (e: React.MouseEvent, icon: TopIcon) => {
    if (onTopIconClick) {
      e.preventDefault();
      onTopIconClick(icon);
    }
    // If no callback, allow default anchor behavior (navigation via href)
  };

  // Get the logo to display (custom or from app info)
  const displayLogo = customLogo || appInfo?.logo;
  const displayIcon = customIcon || appInfo?.icon;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Top Icon Navigation */}
      {showTopIcons && topIcons.length > 0 && (
        <div className={`${topIconsBgColor} px-2 py-2`}>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {topIcons.map((icon) => (
              <a
                key={icon.id}
                href={icon.url}
                onClick={(e) => handleTopIconClick(e, icon)}
                className="flex flex-col items-center min-w-[50px] cursor-pointer"
              >
                <img
                  src={`${BACKEND_URL}${icon.icon}`}
                  alt={icon.name}
                  className="w-8 h-8 object-contain"
                />
                <span className="text-xs text-white mt-1 truncate max-w-[50px]">
                  {icon.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Logo Header */}
      <div className={`${headerBgColor} shadow-sm`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* User Profile Icon */}
          {showProfileButton && (
            <button
              onClick={onProfileClick}
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

          {/* Dark Mode Toggle & App Logo */}
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
            {/* App Logo */}
            <div className="p-1">
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
                  {(appInfo?.apps_name || appInfo?.name || 'M').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Ads Section */}
      {showAds && ads.length > 0 && (
        <div className="relative bg-gray-100">
          {/* Carousel Container */}
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
  );
};

export default MobileHeader;

