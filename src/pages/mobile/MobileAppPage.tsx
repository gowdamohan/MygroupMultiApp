import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MobileHeader, getMobileHeaderHeight } from '../../components/mobile/MobileHeader';
import { MobileFooter, Category, MOBILE_FOOTER_HEIGHT } from '../../components/mobile/MobileFooter';
import { MobileMyMediaPage } from './MobileMyMediaPage';
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
}

export const MobileAppPage: React.FC = () => {
  // Get app name from URL params
  const { appName } = useParams<{ appName?: string }>();

  // App and user state
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoggedIn(false);
        return;
      }
      const response = await authAPI.getProfile();
      if (response.data.success) {
        setUserProfile(response.data.data);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setIsLoggedIn(false);
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
        fetchUserProfile()
      ]);
      setLoading(false);
    };
    initialize();
  }, [appName, fetchAppInfo, fetchUserProfile]);

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

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
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
      setIsLoggedIn(false);
      setUserProfile(null);
    }
  };

  // If appName is 'mymedia', render MobileMyMediaPage
  if (appName === 'mymedia') {
    return <MobileMyMediaPage />;
  }

  // Calculate header height for padding
  const headerHeight = getMobileHeaderHeight(true, true, true);

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <MobileHeader
          appName={appName}
          darkMode={darkMode}
          onDarkModeToggle={toggleDarkMode}
          userProfile={userProfile}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          showTopIcons={true}
          showAds={true}
          showDarkModeToggle={true}
          showProfileButton={true}
        />
        <div
          className="flex items-center justify-center"
          style={{ paddingTop: headerHeight, minHeight: `calc(100vh - ${MOBILE_FOOTER_HEIGHT}px)` }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* MobileHeader with selected app context */}
      <MobileHeader
        appId={appInfo?.id}
        appName={appName}
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
        userProfile={userProfile}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        showTopIcons={true}
        showAds={true}
        showDarkModeToggle={true}
        showProfileButton={true}
      />

      {/* Main Content Area */}
      <div
        style={{
          paddingTop: headerHeight,
          paddingBottom: MOBILE_FOOTER_HEIGHT + 16,
          minHeight: '100vh'
        }}
      >
        {/* App-specific body content */}
        <div className="p-4">
          {selectedCategory ? (
            <div className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <h2 className="text-xl font-bold mb-4">
                {selectedCategory.category_name}
              </h2>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Content for {selectedCategory.category_name} will be displayed here.
              </p>
              {/* App-specific content based on category */}
            </div>
          ) : (
            <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>Select a category from the footer to view content</p>
            </div>
          )}
        </div>
      </div>

      {/* MobileFooter with sub-apps/categories */}
      <MobileFooter
        appId={appInfo?.id}
        appName={appName}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleCategorySelect}
        onCategoriesLoaded={handleCategoriesLoaded}
        maxCategories={6}
        darkMode={darkMode}
      />
    </div>
  );
};

export default MobileAppPage;

