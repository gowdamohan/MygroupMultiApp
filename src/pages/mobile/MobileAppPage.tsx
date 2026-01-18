import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MobileLayout } from '../../layouts/MobileLayout';
import { MobileFooter, Category } from '../../components/mobile/MobileFooter';
import { MobileMyMediaPage } from './MobileMyMediaPage';
import { API_BASE_URL } from '../../config/api.config';

interface AppInfo {
  id: number;
  name: string;
  apps_name: string;
  icon: string;
  logo: string;
  name_image: string;
}

export const MobileAppPage: React.FC = () => {
  // Get app name from URL params
  const { appName } = useParams<{ appName?: string }>();

  // For all apps - hooks must be called unconditionally
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
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

  // Initialize page - reset state when appName changes
  useEffect(() => {
    // Reset state when appName changes
    setAppInfo(null);
    setSelectedCategoryId(null);
    setSelectedCategory(null);
    
    const initialize = async () => {
      setLoading(true);
      await fetchAppInfo(appName);
      setLoading(false);
    };
    initialize();
  }, [appName, fetchAppInfo]);

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
  };

  // If appName is 'mymedia', render MobileMyMediaPage which already uses MobileLayout
  // with the same navigation endpoint as MobileAppPage
  if (appName === 'mymedia') {
    return <MobileMyMediaPage />;
  }

  // For all other apps, render generic app page
  if (loading) {
    return (
      <MobileLayout
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
        appName={appName || 'mymedia'}
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      darkMode={darkMode}
      onDarkModeToggle={toggleDarkMode}
      appName={appName || 'mymedia'}
    >
      <div className="pb-20">
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

        {/* Footer Component */}
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <MobileFooter
            appId={appInfo?.id}
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={handleCategorySelect}
            onCategoriesLoaded={handleCategoriesLoaded}
            maxCategories={6}
          />
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileAppPage;

