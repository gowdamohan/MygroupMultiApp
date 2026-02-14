import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, X, Eye, Heart, UserPlus, FileText, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { MobileHeader, getMobileHeaderHeight } from '../../components/mobile/MobileHeader';
import { MobileFooter, MOBILE_FOOTER_HEIGHT } from '../../components/mobile/MobileFooter';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';
import { ChannelDetailView } from '../../components/mobile/ChannelDetailView';
import { EPaperMagazineView } from '../../components/mobile/EPaperMagazineView';
import { TVChannelView } from '../../components/mobile/TVChannelView';
import { getCategoryIcon, DefaultCategoryIcon } from '../../components/mobile/CategoryIcons';

interface AppInfo {
  id: number;
  name: string;
  apps_name: string;
  icon: string;
  logo: string;
  name_image: string;
}

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
const DAYS_ABBREV = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30',
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'];

export const MobileMyMediaPage: React.FC = () => {
  // Get app name from URL params (e.g., /mobile/mymedia or /mobile/mycompany)
  const { appName } = useParams<{ appName?: string }>();

  // App info state
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

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
  // selectedDay is index in "current-day-first" order (0 = today)
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const orderedDayIndices = useMemo(() => {
    const today = new Date().getDay();
    return Array.from({ length: 7 }, (_, i) => (today + i) % 7);
  }, []);

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

  // View state for channel details
  type ViewMode = 'list' | 'channel-detail' | 'epaper-view' | 'tv-player';
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // Get current parent category type (TV, Radio, E-Paper, Magazine, etc.)
  const getCurrentParentCategoryName = (): string => {
    const parent = parentCategories.find(p => p.id === selectedParentCategory);
    return parent?.category_name?.toLowerCase() || '';
  };

  // Check if current category is E-Paper or Magazine type
  const isDocumentCategory = (): boolean => {
    const name = getCurrentParentCategoryName();
    return name.includes('e-paper') || name.includes('epaper') || name.includes('magazine');
  };

  // Check if current category is TV or Radio type
  const isStreamCategory = (): boolean => {
    const name = getCurrentParentCategoryName();
    return name.includes('tv') || name.includes('radio');
  };

  // Handle channel click based on category type
  const handleChannelClick = (channel: Channel) => {
    setSelectedChannel(channel);
    if (isDocumentCategory()) {
      setViewMode('epaper-view');
    } else if (isStreamCategory()) {
      setViewMode('tv-player');
    } else {
      setViewMode('channel-detail');
    }
  };

  // Handle back from detail views
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedChannel(null);
  };

  // Handle view channel details from player/document view
  const handleViewChannelDetails = () => {
    setViewMode('channel-detail');
  };

  // Fetch app info first, then categories
  const fetchAppInfo = async (name?: string) => {
    try {
      let url = `${API_BASE_URL}/mymedia/app`;
      if (name) {
        url += `?name=${encodeURIComponent(name)}`;
      }
      const response = await axios.get(url);
      if (response.data.success) {
        setAppInfo(response.data.data);
        return response.data.data.id;
      }
    } catch (error) {
      console.error('Error fetching app info:', error);
    }
    return null;
  };

  // Fetch data on mount - same pattern as MediaRegistrationForm
  useEffect(() => {
    const initializeData = async () => {
      // Use appName from URL if available, otherwise default to 'mymedia'
      const appId = await fetchAppInfo(appName || 'mymedia');
      if (appId) {
        fetchCategories(appId);
      } else {
        fetchCategories();
      }
      fetchLanguages();
      fetchCountriesAndSetDefault();
    };
    initializeData();
  }, [appName]);

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

  // Fetch schedules when channels or day changes (day = 0-6 for API)
  useEffect(() => {
    if (channels.length > 0) {
      fetchAllSchedules();
    }
  }, [channels, selectedDay]);

  // Fetch categories - API returns parent categories with children
  const fetchCategories = async (appId?: number) => {
    try {
      const url = appId
        ? `${API_BASE_URL}/mymedia/categories?appId=${appId}`
        : `${API_BASE_URL}/mymedia/categories`;
      const response = await axios.get(url);
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

      const url = `${API_BASE_URL}/mymedia/channels?${params.toString()}`;
      const response = await axios.get(url);
      if (response.data.success) {
        const data = response.data.data;
        setChannels(Array.isArray(data) ? data : []);
        if (process.env.NODE_ENV === 'development') {
          console.log('[MyMedia] channels API response:', { url, count: Array.isArray(data) ? data.length : 0, data });
        }
      } else {
        console.warn('[MyMedia] channels API success=false:', response.data);
        setChannels([]);
      }
    } catch (error) {
      console.error('[MyMedia] Error fetching channels:', error);
      setChannels([]);
    }
  };

  const fetchAllSchedules = async () => {
    const dayParam = orderedDayIndices[selectedDay];
    const schedulePromises = channels.map(async (channel) => {
      try {
        const response = await axios.get(`${API_BASE_URL}/mymedia/schedules/${channel.id}?day=${dayParam}`);
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

  // Render category icon from category_image or use SVG based on category name
  const renderCategoryIcon = (category: Category) => {
    // If category has a custom image, use that
    if (category.category_image) {
      return (
        <img
          src={`${BACKEND_URL}${category.category_image}`}
          alt={category.category_name}
          className="w-6 h-6 object-contain"
        />
      );
    }
    // Otherwise, use an SVG icon based on category name
    const IconComponent = getCategoryIcon(category.category_name);
    return <IconComponent size={24} />;
  };

  const headerHeight = getMobileHeaderHeight(true, true, true);

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <MobileHeader
          appName={appName || 'mymedia'}
          appId={appInfo?.id}
          appInfoFromParent={!!appInfo}
          appInfo={appInfo ?? null}
          selectedCategoryId={selectedParentCategory}
          darkMode={darkMode}
          onDarkModeToggle={toggleDarkMode}
          showTopIcons={true}
          showAds={true}
          showDarkModeToggle={true}
          showProfileButton={true}
        />
        <div style={{ paddingTop: headerHeight, minHeight: `calc(100vh - ${MOBILE_FOOTER_HEIGHT}px)` }} className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  // Render channel detail view
  if (viewMode === 'channel-detail' && selectedChannel) {
    return (
      <ChannelDetailView
        channelId={selectedChannel.id}
        onBack={handleBackToList}
      />
    );
  }

  // Render E-Paper/Magazine document view
  if (viewMode === 'epaper-view' && selectedChannel) {
    return (
      <EPaperMagazineView
        channelId={selectedChannel.id}
        channelName={selectedChannel.media_name_english}
        channelLogo={selectedChannel.media_logo}
        onBack={handleBackToList}
        onViewDetails={handleViewChannelDetails}
      />
    );
  }

  // Render TV/Radio player view
  if (viewMode === 'tv-player' && selectedChannel) {
    return (
      <TVChannelView
        channelId={selectedChannel.id}
        channelName={selectedChannel.media_name_english}
        channelLogo={selectedChannel.media_logo}
        onBack={handleBackToList}
        onViewDetails={handleViewChannelDetails}
      />
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <MobileHeader
        appName={appName || 'mymedia'}
        appId={appInfo?.id}
        appInfoFromParent={!!appInfo}
        appInfo={appInfo ?? null}
        selectedCategoryId={selectedParentCategory}
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
        showTopIcons={true}
        showAds={true}
        showDarkModeToggle={true}
        showProfileButton={true}
      />
      <div className="pb-20" style={{ paddingTop: headerHeight, paddingBottom: MOBILE_FOOTER_HEIGHT + 16 }}>
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

        {/* Days Row - Only show for TV/Radio categories; order starts with today, 3-letter labels */}
        {isStreamCategory() && (
          <div className="sticky top-[158px] z-20 bg-gray-200 px-2 py-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {orderedDayIndices.map((dayIdx, idx) => (
                <button
                  key={dayIdx}
                  onClick={() => setSelectedDay(idx)}
                  className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    selectedDay === idx ? 'bg-teal-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {DAYS_ABBREV[dayIdx]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Area - Different layouts based on category type */}
        {channels.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>No channels found for the selected filters</p>
          </div>
        ) : isDocumentCategory() ? (
          /* E-Paper / Magazine Card Grid */
          <div className="p-4 grid grid-cols-2 gap-3">
            {channels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* Channel Logo/Thumbnail */}
                <div className="aspect-[3/4] bg-gray-100 relative">
                  {channel.media_logo ? (
                    <img
                      src={`${BACKEND_URL}${channel.media_logo}`}
                      alt={channel.media_name_english}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-100 to-red-200">
                      <FileText size={48} className="text-red-400" />
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-teal-600 text-white text-xs rounded-full">
                    {channel.select_type}
                  </div>
                </div>
                {/* Channel Info */}
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{channel.media_name_english}</h3>
                  {channel.media_name_regional && (
                    <p className="text-xs text-gray-500 truncate">{channel.media_name_regional}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : isStreamCategory() ? (
          /* TV / Radio Schedule Grid */
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
            {channels.map((channel) => (
              <div key={channel.id} className="flex border-b cursor-pointer hover:bg-gray-50" onClick={() => handleChannelClick(channel)}>
                {/* Channel Logo */}
                <div className="w-24 flex-shrink-0 p-2 border-r bg-gray-50 flex items-center justify-center relative">
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
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                    <Play size={24} className="text-white" fill="white" />
                  </div>
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
            ))}
          </div>
        ) : (
          /* Default Card Grid for other categories (Web, Youtube, etc.) */
          <div className="p-4 grid grid-cols-2 gap-3">
            {channels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* Channel Logo */}
                <div className="aspect-video bg-gray-100 relative flex items-center justify-center">
                  {channel.media_logo ? (
                    <img
                      src={`${BACKEND_URL}${channel.media_logo}`}
                      alt={channel.media_name_english}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                      {channel.media_name_english?.charAt(0)}
                    </div>
                  )}
                </div>
                {/* Channel Info */}
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{channel.media_name_english}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{channel.select_type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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

      <MobileFooter
        appName={appName || 'mymedia'}
        appId={appInfo?.id}
        selectedCategoryId={selectedParentCategory}
        onCategorySelect={(categoryId) => handleParentCategorySelect(categoryId)}
        maxCategories={6}
        darkMode={darkMode}
      />
    </div>
  );
};

export default MobileMyMediaPage;
