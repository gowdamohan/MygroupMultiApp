import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, X, Eye, Heart, UserPlus, FileText, Play, MapPin } from 'lucide-react';
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
  media_logo_url?: string;
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
// 48 time slots: 24 hours × 30-minute intervals (00:00 … 23:30)
const TIME_SLOTS = ['00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30', '05:00', '05:30',
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'];

/** Convert 24h time string (e.g. "13:30" or "08:00:00") to 12h "H:MM AM/PM" */
function formatTime12h(time24: string): string {
  const part = time24.trim().substring(0, 5);
  const [hStr, mStr] = part.split(':');
  const h = parseInt(hStr || '0', 10);
  const m = parseInt(mStr || '0', 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const mm = m.toString().padStart(2, '0');
  return `${h12}:${mm} ${period}`;
}

/** 4 days for TV/Radio: Yesterday, Today, Tomorrow, Day after tomorrow (day_of_week 0–6 for API) */
const SCHEDULE_DAY_LABELS = ['Yesterday', 'Today', 'Tomorrow', 'Day after tomorrow'] as const;

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
  // selectedDay: 0=Yesterday, 1=Today, 2=Tomorrow, 3=Day after tomorrow
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const scheduleDayIndices = useMemo(() => {
    const today = new Date().getDay();
    return [
      (today + 6) % 7,  // Yesterday
      today,             // Today
      (today + 1) % 7,   // Tomorrow
      (today + 2) % 7    // Day after tomorrow
    ];
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
    return (
      name.includes('e-paper') ||
      name.includes('epaper') ||
      name.includes('e paper') ||
      name.includes('newspaper') ||
      name.includes('magazine')
    );
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
    if (selectedParentCategory) {
      fetchChannels();
    }
  }, [selectedType, selectedCountry, selectedState, selectedDistrict, selectedParentCategory, selectedCategory, selectedLanguage]);

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
            setSelectedCategory(null); // Default to "All" subcategories
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
      setSelectedCategory(null); // Default to "All" subcategories
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
      // category_id = parent category from footer (media_channel.category_id stores parent)
      if (selectedParentCategory) params.append('category_id', selectedParentCategory.toString());
      // parent_category_id = subcategory from dropdown (media_channel.parent_category_id stores subcategory)
      if (selectedCategory) params.append('parent_category_id', selectedCategory.toString());
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

  /** Monday of the week containing the given date (local time), as YYYY-MM-DD for API weekStart */
  const getWeekStartString = (date: Date): string => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + mondayOffset);
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dayNum = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayNum}`;
  };

  const fetchAllSchedules = async () => {
    const dayParam = scheduleDayIndices[selectedDay];
    const weekStartStr = getWeekStartString(new Date());
    const schedulePromises = channels.map(async (channel) => {
      try {
        const response = await axios.get(`${API_BASE_URL}/mymedia/schedules/${channel.id}?day=${dayParam}&weekStart=${weekStartStr}`);
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
    const result = getScheduleAndSlotForTimeSlot(channelId, timeSlot);
    return result ? result.schedule : null;
  };

  /** Returns schedule and matching slot for title + time range display; maps media_schedules_slot start/end to cells. */
  const getScheduleAndSlotForTimeSlot = (
    channelId: number,
    timeSlot: string
  ): { schedule: Schedule; slot: { start_time: string; end_time: string } } | null => {
    const schedules = channelSchedules[channelId] || [];
    for (const schedule of schedules) {
      for (const slot of schedule.slots) {
        const slotStart = slot.start_time.substring(0, 5);
        const slotEnd = slot.end_time.substring(0, 5);
        if (timeSlot >= slotStart && timeSlot < slotEnd) {
          return { schedule, slot };
        }
      }
    }
    return null;
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return 'All';
    const cat = subCategories.find((c: Category) => c.id === selectedCategory);
    return cat?.category_name || 'All';
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
        channelLogo={selectedChannel.media_logo_url || selectedChannel.media_logo}
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
        channelLogo={selectedChannel.media_logo_url || selectedChannel.media_logo}
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
        {/* Filter Row - Updated design with white background and rounded buttons */}
        <div className="sticky z-30 bg-white shadow-sm px-3 py-3 border-b border-gray-200" style={{ top: headerHeight }}>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {/* Category Dropdown */}
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-gray-50 transition-colors shadow-sm"
            >
              Category <ChevronDown size={16} />
            </button>

            {/* Location Button - show based on type */}
            {selectedType !== 'International' && (
              <button
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-gray-50 transition-colors shadow-sm"
              >
                Location <ChevronDown size={16} />
              </button>
            )}

            {/* Language Dropdown */}
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-gray-50 transition-colors shadow-sm"
            >
              Languages <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Days Row - Only for TV/Radio: Yesterday, Today, Tomorrow, Saturday - Updated design */}
        {isStreamCategory() && (
          <div className="sticky z-20 bg-white border-b border-gray-200 px-3 py-2.5" style={{ top: headerHeight + 60 }}>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {SCHEDULE_DAY_LABELS.map((label, idx) => (
                <button
                  key={label}
                  onClick={() => setSelectedDay(idx)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedDay === idx
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
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
          /* E-Paper / Magazine Card Grid - Updated design */
          <div className="p-4 grid grid-cols-2 gap-4 bg-gray-50">
            {channels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                {/* Channel Logo/Thumbnail */}
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 relative">
                  {(channel.media_logo_url || channel.media_logo) ? (
                    <img
                      src={channel.media_logo_url || (channel.media_logo?.startsWith('http') ? channel.media_logo : `${BACKEND_URL}${channel.media_logo}`)}
                      alt={channel.media_name_english}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200">
                      <FileText size={48} className="text-pink-400" />
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-2 right-2 px-2.5 py-1 bg-red-500 text-white text-xs font-semibold rounded-full shadow-md">
                    {channel.select_type}
                  </div>
                </div>
                {/* Channel Info */}
                <div className="p-3 bg-white">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{channel.media_name_english}</h3>
                  {channel.media_name_regional && (
                    <p className="text-xs text-gray-600 truncate mt-0.5">{channel.media_name_regional}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : isStreamCategory() ? (
          /* TV / Radio Schedule Grid: 48 time slots (30-min), 12h display, NOW marker on Today */
          (() => {
            const now = new Date();
            const currentSlot = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes() < 30 ? '00' : '30'}`;
            const currentSlotIndex = TIME_SLOTS.indexOf(currentSlot);
            const showNowMarker = selectedDay === 1 && currentSlotIndex >= 0;
            const slotWidthPx = 80;
            const channelColWidthPx = 96;
            const nowLineLeft = channelColWidthPx + currentSlotIndex * slotWidthPx;

            return (
              <div className="bg-white overflow-x-auto relative shadow-inner">
                {/* Time Headers - all 48 slots in 12h format - Updated styling */}
                <div className="flex border-b sticky top-0 bg-gradient-to-b from-gray-50 to-gray-100 z-10 min-w-max shadow-sm">
                  <div className="w-24 flex-shrink-0 p-3 font-bold text-gray-800 border-r bg-white">
                    CHANNELS
                  </div>
                  {TIME_SLOTS.map((time) => (
                    <div key={time} className="flex-shrink-0 p-2 text-center text-xs font-semibold text-gray-700 border-r" style={{ minWidth: slotWidthPx }}>
                      {formatTime12h(time)}
                    </div>
                  ))}
                </div>

                {/* Current time "NOW" arrow/line – only when Today is selected; shows which slot is "channel now running" */}
                {showNowMarker && (
                  <>
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                      style={{ left: nowLineLeft + slotWidthPx / 2 - 1 }}
                      aria-hidden
                    />
                    <div
                      className="absolute z-30 pointer-events-none flex flex-col items-center"
                      style={{ left: nowLineLeft + slotWidthPx / 2 - 20, top: 4 }}
                    >
                      <MapPin size={20} className="text-red-500 drop-shadow" fill="#ef4444" stroke="#b91c1c" />
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow mt-0.5">
                        NOW
                      </span>
                    </div>
                  </>
                )}

                {/* Channel Rows - each cell shows media_schedules.title + time range - Updated styling */}
                {channels.map((channel) => (
                  <div key={channel.id} className="flex border-b border-gray-200 cursor-pointer hover:bg-pink-50/30 min-w-max transition-colors" onClick={() => handleChannelClick(channel)}>
                    <div className="w-24 flex-shrink-0 p-2 border-r border-gray-200 bg-white flex items-center justify-center relative group">
                      {(channel.media_logo_url || channel.media_logo) ? (
                        <img
                          src={channel.media_logo_url || (channel.media_logo?.startsWith('http') ? channel.media_logo : `${BACKEND_URL}${channel.media_logo}`)}
                          alt={channel.media_name_english}
                          className="w-16 h-12 object-contain"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                          {channel.media_name_english.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={24} className="text-white drop-shadow-lg" fill="white" />
                      </div>
                    </div>
                    {TIME_SLOTS.map((time) => {
                      const result = getScheduleAndSlotForTimeSlot(channel.id, time);
                      const isCurrentSlot = selectedDay === 1 && time === currentSlot;
                      return (
                        <div key={time} className={`flex-shrink-0 p-1.5 border-r border-gray-200 text-xs ${isCurrentSlot ? 'bg-red-50' : ''}`} style={{ minWidth: slotWidthPx }}>
                          {result ? (
                            <div className={`p-1.5 rounded min-w-0 ${isCurrentSlot ? 'bg-red-100 border border-red-300' : 'bg-pink-50 border border-pink-200'}`}>
                              <div className="font-semibold break-words leading-tight text-gray-800" title={result.schedule.title}>
                                {result.schedule.title}
                              </div>
                              <div className={`text-[10px] mt-0.5 leading-tight font-medium ${isCurrentSlot ? 'text-red-600' : 'text-gray-600'}`}>
                                {formatTime12h(result.slot.start_time)} - {formatTime12h(result.slot.end_time)}
                              </div>
                              {/* LIVE indicator for current time slot */}
                              {isCurrentSlot && (
                                <div className="mt-1 inline-flex items-center gap-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                  LIVE
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-300 text-center">-</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })()
        ) : (
          /* Default Card Grid for other categories (Web, Youtube, etc.) - Updated design */
          <div className="p-4 grid grid-cols-2 gap-4 bg-gray-50">
            {channels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                {/* Channel Logo */}
                <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 relative flex items-center justify-center">
                  {(channel.media_logo_url || channel.media_logo) ? (
                    <img
                      src={channel.media_logo_url || (channel.media_logo?.startsWith('http') ? channel.media_logo : `${BACKEND_URL}${channel.media_logo}`)}
                      alt={channel.media_name_english}
                      className="w-full h-full object-contain p-3"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {channel.media_name_english?.charAt(0)}
                    </div>
                  )}
                </div>
                {/* Channel Info */}
                <div className="p-3 bg-white">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{channel.media_name_english}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{channel.select_type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Type Dropdown Modal - Updated design */}
      <AnimatePresence>
        {showTypeDropdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowTypeDropdown(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg mb-4 text-gray-900">Select Type</h3>
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
                  className={`w-full text-left px-4 py-3 rounded-xl mb-2 font-medium transition-all ${
                    selectedType === type ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Dropdown Modal - Updated design */}
      <AnimatePresence>
        {showCategoryDropdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCategoryDropdown(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[70vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg mb-4 text-gray-900">Select Category</h3>
              {/* "All" option - shows all channels under parent category */}
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowCategoryDropdown(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl mb-2 flex items-center gap-3 font-medium transition-all ${
                  selectedCategory === null ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <Eye size={18} />
                </div>
                All
              </button>
              {subCategories.length === 0 ? (
                <p className="text-gray-500 text-sm px-4 py-2">No subcategories available</p>
              ) : (
                subCategories.map((category: Category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl mb-2 flex items-center gap-3 font-medium transition-all ${
                      selectedCategory === category.id ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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

      {/* Language Dropdown Modal - Updated design */}
      <AnimatePresence>
        {showLanguageDropdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowLanguageDropdown(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[70vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg mb-4 text-gray-900">Select Language</h3>
              <button
                onClick={() => {
                  setSelectedLanguage(null);
                  setShowLanguageDropdown(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl mb-2 font-medium transition-all ${
                  selectedLanguage === null ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  className={`w-full text-left px-4 py-3 rounded-xl mb-2 font-medium transition-all ${
                    selectedLanguage === lang.id ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {lang.lang_1}
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Modal - Updated design */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowLocationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-gray-900">Select Location</h3>
                <button onClick={() => setShowLocationModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Country Selection */}
              {(selectedType === 'National' || selectedType === 'Regional' || selectedType === 'Local') && (
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-red-500 focus:outline-none transition-colors"
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
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-red-500 focus:outline-none transition-colors"
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
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-red-500 focus:outline-none transition-colors"
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
                className="w-full bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 font-semibold shadow-md transition-all"
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
