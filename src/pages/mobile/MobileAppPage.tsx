import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MobileHeader, TopIcon } from '../../components/mobile/MobileHeader';
import { MobileFooter, Category } from '../../components/mobile/MobileFooter';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';
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
  profile_img?: string;
}

export const MobileAppPage: React.FC = () => {
  // Get app name from URL params
  const { appName } = useParams<{ appName?: string }>();
  const navigate = useNavigate();

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
        setUserProfile(JSON.parse(user));
        const response = await authAPI.getProfile();
        if (response.data.success) {
          setUserProfile(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
  }, []);

  // Initialize page
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([
        fetchAppInfo(appName || 'mymedia'),
        checkAuth()
      ]);
      setLoading(false);
    };
    initialize();
  }, [appName, fetchAppInfo, checkAuth]);

  // Handle top icon click - navigate to different app
  const handleTopIconClick = (icon: TopIcon) => {
    // Extract app name from URL or icon name
    const targetAppName = icon.name.toLowerCase().replace(/\s+/g, '');
    navigate(`/mobile/${targetAppName}`);
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

  // Handle profile click
  const handleProfileClick = () => {
    // TODO: Show profile modal
    console.log('Profile clicked');
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Calculate header height based on what's visible
  const getHeaderHeight = () => {
    let height = 60; // Logo header
    // Add top icons bar if present
    height += 50;
    // Add carousel ads if present
    height += 128;
    return height;
  };

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
      {/* Header Component */}
      <MobileHeader
        appId={appInfo?.id}
        appName={appName || 'mymedia'}
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
        userProfile={userProfile}
        isLoggedIn={isLoggedIn}
        onProfileClick={handleProfileClick}
        onTopIconClick={handleTopIconClick}
      />

      {/* Main Content Area */}
      <div
        className="pb-16"
        style={{ paddingTop: `${getHeaderHeight()}px` }}
      >
        {/* Content based on selected category */}
        <div className="p-4">
          {selectedCategory ? (
            <div className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <h2 className="text-xl font-bold mb-4">
                {selectedCategory.category_name}
              </h2>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Content for {selectedCategory.category_name} will be displayed here.
              </p>
              {/* TODO: Render appropriate content based on category type */}
              {/* e.g., TV channels, Radio stations, E-Paper documents, etc. */}
            </div>
          ) : (
            <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>Select a category from the footer to view content</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Component */}
      <MobileFooter
        appId={appInfo?.id}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleCategorySelect}
        onCategoriesLoaded={handleCategoriesLoaded}
        maxCategories={6}
      />
    </div>
  );
};

export default MobileAppPage;

