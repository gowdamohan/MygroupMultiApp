import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';
import { getCategoryIcon } from './CategoryIcons';

export interface Category {
  id: number;
  category_name: string;
  category_image?: string;
  parent_id?: number;
  sort_order?: number;
  children?: Category[];
}

interface MobileFooterProps {
  appId?: number;
  appName?: string;
  selectedCategoryId?: number | null;
  onCategorySelect?: (categoryId: number, category: Category) => void;
  onCategoriesLoaded?: (categories: Category[]) => void;
  maxCategories?: number;
  darkMode?: boolean;
  // Customization options for different apps
  bgColor?: string;
  selectedBgColor?: string;
  selectedTextColor?: string;
  textColor?: string;
  borderColor?: string;
  showLabels?: boolean;
  iconSize?: number;
}

export const MobileFooter: React.FC<MobileFooterProps> = ({
  appId,
  appName,
  selectedCategoryId,
  onCategorySelect,
  onCategoriesLoaded,
  maxCategories = 6,
  darkMode = false,
  bgColor,
  selectedBgColor,
  selectedTextColor,
  textColor,
  borderColor,
  showLabels = true,
  iconSize = 24
}) => {
  // Apply dark mode defaults if not explicitly set
  const effectiveBgColor = bgColor || (darkMode ? 'bg-gray-900' : 'bg-white');
  const effectiveSelectedBgColor = selectedBgColor || 'bg-teal-600';
  const effectiveSelectedTextColor = selectedTextColor || 'text-white';
  const effectiveTextColor = textColor || (darkMode ? 'text-gray-300' : 'text-gray-600');
  const effectiveBorderColor = borderColor || (darkMode ? 'border-gray-700' : 'border-gray-200');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories/sub-apps for the selected app
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      // Build URL with appId or appName
      let url = `${API_BASE_URL}/mymedia/categories`;
      const params: string[] = [];
      if (appId) {
        params.push(`appId=${appId}`);
      }
      if (appName) {
        params.push(`appName=${encodeURIComponent(appName)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await axios.get(url);
      if (response.data.success) {
        const allCategories: Category[] = response.data.data;
        // Filter to only parent categories (parent_id IS NULL or undefined)
        const parentCategories = allCategories.filter(cat => !cat.parent_id);
        // Sort by sort_order if available
        parentCategories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        // Limit to maxCategories for footer
        const limitedCategories = parentCategories.slice(0, maxCategories);
        setCategories(limitedCategories);
        // Notify parent component that categories are loaded
        if (onCategoriesLoaded) {
          onCategoriesLoaded(limitedCategories);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [appId, appName, maxCategories, onCategoriesLoaded]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Render category icon from category_image or use SVG based on category name
  const renderCategoryIcon = (category: Category) => {
    // If category has a custom image, use that
    if (category.category_image) {
      return (
        <img
          src={`${BACKEND_URL}${category.category_image}`}
          alt={category.category_name}
          className="object-contain"
          style={{ width: iconSize, height: iconSize }}
        />
      );
    }
    // Otherwise, use an SVG icon based on category name
    const IconComponent = getCategoryIcon(category.category_name);
    return <IconComponent size={iconSize} />;
  };

  const handleCategoryClick = (category: Category) => {
    if (onCategorySelect) {
      onCategorySelect(category.id, category);
    }
  };

  // Calculate grid columns based on number of categories
  const gridCols = Math.min(categories.length || 1, maxCategories);

  // Loading state
  if (loading) {
    return (
      <div className={`fixed bottom-0 left-0 right-0 z-50 ${effectiveBgColor} border-t ${effectiveBorderColor} shadow-lg`}>
        <div className="grid grid-cols-6 h-16">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center justify-center gap-1 py-3">
              <div className={`w-6 h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`} />
              {showLabels && <div className={`w-10 h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded animate-pulse`} />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state - don't render footer if no categories
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${effectiveBgColor} border-t ${effectiveBorderColor} shadow-lg`}>
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            className={`flex flex-col items-center gap-1 py-3 transition-colors ${
              selectedCategoryId === category.id
                ? `${effectiveSelectedBgColor} ${effectiveSelectedTextColor}`
                : `${effectiveTextColor} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`
            }`}
          >
            <div className="flex items-center justify-center" style={{ width: iconSize, height: iconSize }}>
              {renderCategoryIcon(category)}
            </div>
            {showLabels && (
              <span className="text-[10px] whitespace-nowrap truncate max-w-[50px]">
                {category.category_name}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Export footer height constant
export const MOBILE_FOOTER_HEIGHT = 64;

export default MobileFooter;

