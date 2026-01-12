import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';
import { getCategoryIcon } from './CategoryIcons';

export interface Category {
  id: number;
  category_name: string;
  category_image?: string;
  parent_id?: number;
  children?: Category[];
}

interface MobileFooterProps {
  appId?: number;
  selectedCategoryId?: number | null;
  onCategorySelect?: (categoryId: number, category: Category) => void;
  onCategoriesLoaded?: (categories: Category[]) => void;
  maxCategories?: number;
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
  selectedCategoryId,
  onCategorySelect,
  onCategoriesLoaded,
  maxCategories = 6,
  bgColor = 'bg-white',
  selectedBgColor = 'bg-teal-700',
  selectedTextColor = 'text-white',
  textColor = 'text-gray-600',
  borderColor = 'border-gray-200',
  showLabels = true,
  iconSize = 24
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories for the app
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/mymedia/categories`;
      if (appId) {
        url += `?appId=${appId}`;
      }
      const response = await axios.get(url);
      if (response.data.success) {
        const allCategories: Category[] = response.data.data;
        // Limit to maxCategories for footer
        const limitedCategories = allCategories.slice(0, maxCategories);
        setCategories(limitedCategories);
        // Notify parent component that categories are loaded
        if (onCategoriesLoaded) {
          onCategoriesLoaded(limitedCategories);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [appId, maxCategories, onCategoriesLoaded]);

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
  const gridCols = Math.min(categories.length, maxCategories);
  const gridColsClass = `grid-cols-${gridCols}`;

  if (loading) {
    return (
      <div className={`fixed bottom-0 left-0 right-0 z-50 ${bgColor} border-t ${borderColor} shadow-lg`}>
        <div className="grid grid-cols-6 h-16">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center justify-center gap-1 py-3">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
              {showLabels && <div className="w-10 h-2 bg-gray-200 rounded animate-pulse" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${bgColor} border-t ${borderColor} shadow-lg`}>
      <div className={`grid ${gridColsClass}`} style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            className={`flex flex-col items-center gap-1 py-3 transition-colors ${
              selectedCategoryId === category.id
                ? `${selectedBgColor} ${selectedTextColor}`
                : `${textColor} hover:bg-gray-100`
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

export default MobileFooter;

