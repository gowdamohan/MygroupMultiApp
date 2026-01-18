import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MobileHeader, TopIcon, getMobileHeaderHeight } from '../../components/mobile/MobileHeader';
import { MobileFooter, Category } from '../../components/mobile/MobileFooter';
import { API_BASE_URL } from '../../config/api.config';
import { authAPI } from '../../services/api';

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

interface MobileStandardLayoutProps {
  appName?: string;
  appId?: number;
}

export const MobileStandardLayout: React.FC<MobileStandardLayoutProps> = ({ 
  appName = 'mymedia',
  appId 
}) => {

  // App and user state
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Category selection state
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Fetch app info
  const fetchAppInfo = useCallback(async (name?: string) => {
    try {
      let url = `${API_BASE_URL}/mymedia/app`;
      if (name) {
        url += `?name=${encodeURIComponent(name)}`;
      }
      const response = await axios.get(url);
      if (response.data.success) {
        setAppInfo(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching app info:', error);
    }
    return null;
  }, []);

  // Check authentication
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsLoggedIn(true);
      try {
        const userData = JSON.parse(user);
        setUserProfile({
          id: userData.id || 0,
          username: userData.username || '',
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          profile_img: userData.profile_img,
          identification_code: userData.identification_code
        });
        const response = await authAPI.getProfile();
        if (response.data.success) {
          const profileData = response.data.data;
          setUserProfile({
            id: profileData.id || 0,
            username: profileData.username || '',
            email: profileData.email,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            phone: profileData.phone,
            profile_img: profileData.profile_img,
            identification_code: profileData.identification_code
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
  }, []);

  // Initialize page - reset state when appName changes
  useEffect(() => {
    // Reset state when appName changes
    setAppInfo(null);
    setSelectedCategoryId(null);
    setSelectedCategory(null);
    
    const initialize = async () => {
      setLoading(true);
      await Promise.all([
        fetchAppInfo(appName),
        checkAuth()
      ]);
      setLoading(false);
    };
    initialize();
  }, [appName, fetchAppInfo, checkAuth]);

  // Handle top icon click - navigate to different app
  const handleTopIconClick = (icon: TopIcon) => {
    // Use icon.url if available, otherwise construct from name
    const targetUrl = icon.url || `/mobile/${icon.name.toLowerCase().replace(/\s+/g, '')}`;
    // Force full page reload to ensure component re-initializes with new app
    window.location.href = targetUrl;
  };

  // Handle footer category selection
  const handleCategorySelect = (categoryId: number, category: Category) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategory(category);
  };

  // Handle categories loaded - auto-select first category
  const handleCategoriesLoaded = useCallback((categories: Category[]) => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
      setSelectedCategory(categories[0]);
    }
  }, [selectedCategoryId]);

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserProfile(null);
    // Header component will handle the actual logout
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Calculate header height (assume ads are shown by default)
  const headerHeight = getMobileHeaderHeight(true, true, true);

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header Component with top icons, profile, dark mode, and carousel ads */}
      <MobileHeader
        appId={appId || appInfo?.id}
        appName={appName}
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
        userProfile={userProfile}
        isLoggedIn={isLoggedIn}
        onTopIconClick={handleTopIconClick}
        onLogout={handleLogout}
        showTopIcons={true}
        showAds={true}
        showDarkModeToggle={true}
        showProfileButton={true}
      />

      {/* Main Content Area */}
      <div
        className="pb-16"
        style={{ paddingTop: `${headerHeight}px` }}
      >
        {/* Body Content - Keep existing MyMedia implementation or minimal */}
        <div className="p-4">
          {selectedCategory ? (
            <div className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <h2 className="text-xl font-bold mb-4">
                {selectedCategory.category_name}
              </h2>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Content coming soon...
              </p>
            </div>
          ) : (
            <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>Select a category from the footer to view content</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Component with app-specific categories */}
      <MobileFooter
        appId={appId || appInfo?.id}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleCategorySelect}
        onCategoriesLoaded={handleCategoriesLoaded}
        maxCategories={6}
      />
    </div>
  );
};

export default MobileStandardLayout;