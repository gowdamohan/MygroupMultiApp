import React, { useState, useEffect } from 'react';
import { Tv, Radio, Newspaper, BookOpen, Globe, Youtube, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { MediaRegistrationForm } from './MediaRegistrationForm';

const API_BASE_URL = 'http://localhost:5002/api/v1';

interface Category {
  id: number;
  category_name: string;
  category_type: string;
  category_image: string | null;
  registration_count: number;
  current_registrations: number;
  is_disabled: boolean;
}

const categoryIcons: Record<string, any> = {
  'TV': Tv,
  'Radio': Radio,
  'E Paper': Newspaper,
  'Magazine': BookOpen,
  'Web': Globe,
  'Youtube': Youtube
};

export const CreateMedia: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const appId = user.group_id; // app_id is stored in group_id field

      const response = await axios.get(
        `${API_BASE_URL}/partner/media-categories/${appId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    if (!category.is_disabled) {
      setSelectedCategory(category);
    }
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  const handleFormSuccess = () => {
    setSelectedCategory(null);
    fetchCategories(); // Refresh categories to update counts
  };

  if (selectedCategory) {
    return (
      <MediaRegistrationForm
        category={selectedCategory}
        onBack={handleBack}
        onSuccess={handleFormSuccess}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Media Channel</h1>
        <p className="text-gray-600">Select a media category to register your channel</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = categoryIcons[category.category_name] || Globe;
            const isDisabled = category.is_disabled;

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                disabled={isDisabled}
                className={`
                  relative p-6 rounded-xl border-2 transition-all duration-200
                  ${isDisabled
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                    : 'bg-white border-gray-200 hover:border-primary-500 hover:shadow-lg cursor-pointer'
                  }
                `}
              >
                {/* Disabled Overlay */}
                {isDisabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-10 rounded-xl">
                    <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold text-sm">
                      Limit Reached
                    </span>
                  </div>
                )}

                <div className="flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center mb-4
                    ${isDisabled ? 'bg-gray-200' : 'bg-primary-100'}
                  `}>
                    <Icon className={isDisabled ? 'text-gray-400' : 'text-primary-600'} size={32} />
                  </div>

                  {/* Category Name */}
                  <h3 className={`text-xl font-semibold mb-2 ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                    {category.category_name}
                  </h3>

                  {/* Registration Count */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className={isDisabled ? 'text-gray-500' : 'text-gray-600'}>
                      {category.current_registrations} / {category.registration_count}
                    </span>
                    <span className={isDisabled ? 'text-gray-500' : 'text-gray-500'}>
                      registered
                    </span>
                  </div>

                  {/* Category Image (if available) */}
                  {category.category_image && !isDisabled && (
                    <div className="mt-4 w-full h-32 rounded-lg overflow-hidden">
                      <img
                        src={category.category_image}
                        alt={category.category_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!loading && categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No media categories available</p>
        </div>
      )}
    </div>
  );
};

