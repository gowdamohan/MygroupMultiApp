import React, { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { MobileLayout } from '../../layouts/MobileLayout';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

// Default SVG icon for categories
const DefaultCategoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
    <polyline points="17 2 12 7 7 2"></polyline>
  </svg>
);

interface Category {
  id: number;
  category_name: string;
  category_type: string;
  category_image: string | null;
  parent_id: number | null;
  children?: Category[];
}

interface Language {
  id: number;
  lang_1: string;
  lang_2: string;
}

interface Country {
  id: number;
  country: string;
}

interface State {
  id: number;
  state: string;
}

interface District {
  id: number;
  district: string;
}

interface Channel {
  id: number;
  media_logo: string;
  media_name_english: string;
  media_name_regional: string;
  select_type: string;
  category_id: number;
  parent_category_id: number;
  language_id: number;
}

interface Schedule {
  id: number;
  title: string;
  media_file: string;
  schedule_date: string;
  day_of_week: number;
  slots: {
    id: number;
    start_time: string;
    end_time: string;
  }[];
}

type SelectType = 'International' | 'National' | 'Regional' | 'Local';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30',
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'];

export const MobileMyMediaPage: React.FC = () => {
  // Parent categories for footer (6 fixed items)
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  // Subcategories for dropdown (children of selected parent)
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelSchedules, setChannelSchedules] = useState<{ [channelId: number]: Schedule[] }>({});
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Filters - same as MediaRegistrationForm
  const [selectedType, setSelectedType] = useState<SelectType>('National');
  const [selectedParentCategory, setSelectedParentCategory] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

  // Location filters - same pattern as MediaRegistrationForm
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  // Modals
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Fetch data on mount - same pattern as MediaRegistrationForm
  useEffect(() => {
    fetchCategories();
    fetchLanguages();
    fetchCountriesAndSetDefault();
  }, []);

  // Fetch countries and set default country
  const fetchCountriesAndSetDefault = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/geo/countries`);
      if (response.data.success) {
        const countriesData = response.data.data;
        setCountries(countriesData);
        // Set first country as default if available
        if (countriesData.length > 0) {
          setSelectedCountry(countriesData[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  // Fetch states based on select type and selected country
  useEffect(() => {
    if (selectedType === 'International') {
      setStates([]);
      setSelectedState('');
      setDistricts([]);
      setSelectedDistrict('');
    } else if (selectedCountry) {
      // For National, Regional, Local - use selectedCountry
      fetchStates(parseInt(selectedCountry));
    }
  }, [selectedType, selectedCountry]);

  // Fetch districts when state changes
  useEffect(() => {
    if (selectedState) {
      fetchDistricts(parseInt(selectedState));
    } else {
      setDistricts([]);
    }
  }, [selectedState]);

  // Fetch channels when filters change
  useEffect(() => {
    if (selectedCategory) {
      fetchChannels();
    }
  }, [selectedType, selectedCountry, selectedState, selectedDistrict, selectedCategory, selectedLanguage]);

  // Fetch schedules when channels or day changes
  useEffect(() => {
    if (channels.length > 0) {
      fetchAllSchedules();
    }
  }, [channels, selectedDay]);

  // Fetch categories - API returns parent categories with children
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/mymedia/categories`);
      if (response.data.success) {
        const allParentCategories: Category[] = response.data.data;
        // Limit to 6 parent categories for footer
        const parents = allParentCategories.slice(0, 6);
        setParentCategories(parents);
        // Set first parent category as default and populate subcategories
        if (parents.length > 0) {
          setSelectedParentCategory(parents[0].id);
          // Set subcategories from first parent's children
          const firstParent = parents[0];
          if (firstParent.children && firstParent.children.length > 0) {
            setSubCategories(firstParent.children);
            setSelectedCategory(firstParent.children[0].id);
          } else {
            setSubCategories([]);
            setSelectedCategory(null);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle parent category selection from footer
  const handleParentCategorySelect = (parentId: number) => {
    setSelectedParentCategory(parentId);
    // Find the parent category and set its children as subcategories
    const parent = parentCategories.find(p => p.id === parentId);
    if (parent && parent.children && parent.children.length > 0) {
      setSubCategories(parent.children);
      setSelectedCategory(parent.children[0].id);
    } else {
      setSubCategories([]);
      setSelectedCategory(null);
    }
  };

  // Fetch languages - same pattern as MediaRegistrationForm (/partner/languages)
  const fetchLanguages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/mymedia/languages`);
      if (response.data.success) {
        setLanguages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch states - use public geo endpoint
  const fetchStates = async (countryId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/geo/states/${countryId}`);
      if (response.data.success) {
        setStates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  // Fetch districts - use public geo endpoint
  const fetchDistricts = async (stateId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/geo/districts/${stateId}`);
      if (response.data.success) {
        setDistricts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchChannels = async () => {
    try {
      const params = new URLSearchParams();
      params.append('type', selectedType);
      if (selectedCountry) params.append('country_id', selectedCountry);
      if (selectedState) params.append('state_id', selectedState);
      if (selectedDistrict) params.append('district_id', selectedDistrict);
      if (selectedCategory) params.append('category_id', selectedCategory.toString());
      if (selectedLanguage) params.append('language_id', selectedLanguage.toString());

      const response = await axios.get(`${API_BASE_URL}/mymedia/channels?${params.toString()}`);
      if (response.data.success) {
        setChannels(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      setChannels([]);
    }
  };

  const fetchAllSchedules = async () => {
    const schedulePromises = channels.map(async (channel) => {
      try {
        const response = await axios.get(`${API_BASE_URL}/mymedia/schedules/${channel.id}?day=${selectedDay}`);
        if (response.data.success) {
          return { channelId: channel.id, schedules: response.data.data.schedules };
        }
      } catch (error) {
        console.error(`Error fetching schedules for channel ${channel.id}:`, error);
      }
      return { channelId: channel.id, schedules: [] };
    });

    const results = await Promise.all(schedulePromises);
    const schedulesMap: { [channelId: number]: Schedule[] } = {};
    results.forEach(result => {
      schedulesMap[result.channelId] = result.schedules;
    });
    setChannelSchedules(schedulesMap);
  };

  const getScheduleForTimeSlot = (channelId: number, timeSlot: string): Schedule | null => {
    const schedules = channelSchedules[channelId] || [];
    for (const schedule of schedules) {
      for (const slot of schedule.slots) {
        const slotStart = slot.start_time.substring(0, 5);
        const slotEnd = slot.end_time.substring(0, 5);
        if (timeSlot >= slotStart && timeSlot < slotEnd) {
          return schedule;
        }
      }
    }
    return null;
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const getSelectedCategoryName = () => {
    const cat = subCategories.find((c: Category) => c.id === selectedCategory);
    return cat?.category_name || 'Category';
  };

  const getSelectedLanguageName = () => {
    const lang = languages.find(l => l.id === selectedLanguage);
    return lang?.lang_1 || 'Language';
  };

  const getLocationLabel = () => {
    if (selectedType === 'International') return 'World';
    if (selectedType === 'National') {
      const country = countries.find(c => c.id.toString() === selectedCountry);
      return country?.country || 'Select Country';
    }
    if (selectedType === 'Regional') {
      const state = states.find(s => s.id.toString() === selectedState);
      return state?.state || 'Select State';
    }
    if (selectedType === 'Local') {
      const district = districts.find(d => d.id.toString() === selectedDistrict);
      return district?.district || 'Select District';
    }
    return 'Location';
  };

  // Render category icon from category_image or default SVG
  const renderCategoryIcon = (category: Category) => {
    if (category.category_image) {
      return (
        <img
          src={`${BACKEND_URL}${category.category_image}`}
          alt={category.category_name}
          className="w-6 h-6 object-contain"
        />
      );
    }
    return <DefaultCategoryIcon />;
  };

  if (loading) {
    return (
      <MobileLayout
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
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
    >
      <div className="pb-20">
        {/* Filter Row */}
        <div className="sticky top-0 z-30 bg-teal-700 px-2 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {/* Type Dropdown */}
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="flex items-center gap-1 bg-teal-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap"
            >
              {selectedType} <ChevronDown size={16} />
            </button>

            {/* Location Button - show based on type */}
            {selectedType !== 'International' && (
              <button
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-1 bg-white text-teal-700 px-3 py-2 rounded-lg text-sm whitespace-nowrap"
              >
                {getLocationLabel()}
              </button>
            )}

            {/* Category Dropdown */}
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center gap-1 bg-teal-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap"
            >
              {getSelectedCategoryName()} <ChevronDown size={16} />
            </button>

            {/* Language Dropdown */}
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-1 bg-teal-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap"
            >
              {getSelectedLanguageName()} <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Days Row */}
        <div className="sticky top-[158px] z-20 bg-gray-200 px-2 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {DAYS_OF_WEEK.map((day, idx) => (
              <button
                key={day}
                onClick={() => setSelectedDay(idx)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  selectedDay === idx ? 'bg-teal-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="bg-white overflow-x-auto">
          {/* Time Headers */}
          <div className="flex border-b sticky top-0 bg-gray-100 z-10">
            <div className="w-24 flex-shrink-0 p-2 font-semibold text-gray-700 border-r bg-gray-200">
              Channel
            </div>
            {TIME_SLOTS.slice(0, 6).map((time) => (
              <div key={time} className="w-24 flex-shrink-0 p-2 text-center text-sm font-medium text-gray-600 border-r">
                {time}
              </div>
            ))}
          </div>

          {/* Channel Rows */}
          {channels.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No channels found for the selected filters
            </div>
          ) : (
            channels.map((channel) => (
              <div key={channel.id} className="flex border-b">
                {/* Channel Logo */}
                <div className="w-24 flex-shrink-0 p-2 border-r bg-gray-50 flex items-center justify-center">
                  {channel.media_logo ? (
                    <img
                      src={`${BACKEND_URL}${channel.media_logo}`}
                      alt={channel.media_name_english}
                      className="w-16 h-12 object-contain"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                      {channel.media_name_english.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Time Slots */}
                {TIME_SLOTS.slice(0, 6).map((time) => {
                  const schedule = getScheduleForTimeSlot(channel.id, time);
                  return (
                    <div key={time} className="w-24 flex-shrink-0 p-2 border-r text-xs">
                      {schedule ? (
                        <div className="bg-teal-50 p-1 rounded text-teal-700 truncate" title={schedule.title}>
                          {schedule.title}
                        </div>
                      ) : (
                        <div className="text-gray-300">-</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer - Category Navigation (6 fixed parent categories) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
          <div className="grid grid-cols-6">
            {parentCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleParentCategorySelect(category.id)}
                className={`flex flex-col items-center gap-1 py-3 transition-colors ${
                  selectedParentCategory === category.id
                    ? 'bg-teal-700 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  {renderCategoryIcon(category)}
                </div>
                <span className="text-[10px] whitespace-nowrap truncate max-w-[50px]">{category.category_name}</span>
              </button>
            ))}
          </div>
        </div>

      {/* Type Dropdown Modal */}
      <AnimatePresence>
        {showTypeDropdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={() => setShowTypeDropdown(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-4 w-64"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold mb-3">Select Type</h3>
              {(['International', 'National', 'Regional', 'Local'] as SelectType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setShowTypeDropdown(false);
                    if (type !== 'International') {
                      setShowLocationModal(true);
                    }
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 ${
                    selectedType === type ? 'bg-teal-600 text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Dropdown Modal */}
      <AnimatePresence>
        {showCategoryDropdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={() => setShowCategoryDropdown(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-4 w-64 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold mb-3">Select Category</h3>
              {subCategories.length === 0 ? (
                <p className="text-gray-500 text-sm">No subcategories available</p>
              ) : (
                subCategories.map((category: Category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center gap-2 ${
                      selectedCategory === category.id ? 'bg-teal-600 text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      {renderCategoryIcon(category)}
                    </div>
                    {category.category_name}
                  </button>
                ))
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Dropdown Modal */}
      <AnimatePresence>
        {showLanguageDropdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={() => setShowLanguageDropdown(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-4 w-64 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold mb-3">Select Language</h3>
              <button
                onClick={() => {
                  setSelectedLanguage(null);
                  setShowLanguageDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 ${
                  selectedLanguage === null ? 'bg-teal-600 text-white' : 'hover:bg-gray-100'
                }`}
              >
                All Languages
              </button>
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    setSelectedLanguage(lang.id);
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 ${
                    selectedLanguage === lang.id ? 'bg-teal-600 text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  {lang.lang_1}
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={() => setShowLocationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-4 w-80 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Select Location</h3>
                <button onClick={() => setShowLocationModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X size={20} />
                </button>
              </div>

              {/* Country Selection */}
              {(selectedType === 'National' || selectedType === 'Regional' || selectedType === 'Local') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>{country.country}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* State Selection */}
              {(selectedType === 'Regional' || selectedType === 'Local') && selectedCountry && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>{state.state}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* District Selection */}
              {selectedType === 'Local' && selectedState && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select District</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>{district.district}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => setShowLocationModal(false)}
                className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700"
              >
                Apply
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </MobileLayout>
  );
};

export default MobileMyMediaPage;
