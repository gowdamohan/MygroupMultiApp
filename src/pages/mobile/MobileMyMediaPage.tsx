import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ChevronDown, X, Eye, Heart, UserPlus, FileText, Play, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { MobileHeader, getMobileHeaderHeight } from '../../components/mobile/MobileHeader';
import { MobileFooter, MOBILE_FOOTER_HEIGHT } from '../../components/mobile/MobileFooter';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';
import { ChannelDetailView } from '../../components/mobile/ChannelDetailView';
import { EPaperMagazineView } from '../../components/mobile/EPaperMagazineView';
import { TVChannelView } from '../../components/mobile/TVChannelView';
import { TVChannelDetailPage } from '../../components/mobile/TVChannelDetailPage';
import { YoutubeChannelView } from '../../components/mobile/YoutubeChannelView';
import { getCategoryIcon, DefaultCategoryIcon } from '../../components/mobile/CategoryIcons';
import {
  pickDefaultParentCategory,
  categoryNameIsDocument,
  categoryNameIncludesTV,
  categoryNameIncludesRadio,
  categoryNameIncludesYouTube,
  isYouTubeChannelUrl,
} from '../../utils/mediaCategoryUtils';
import {
  resolveViewerLocation,
  locationFromApiResponse,
  validateViewerLocationAgainstGeoLists,
  hasRegistrationLocationData,
  type CountryOption,
  type StateOption,
  type DistrictOption
} from '../../utils/viewerLocation';

const SLOT_WIDTH_PX = 80;
const CHANNEL_COL_WIDTH_PX = 96;

const formatDateYMD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

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

interface Country extends CountryOption {}

interface State extends StateOption {}

interface District extends DistrictOption {}

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
  media_url?: string | null;
  latest_document?: {
    id: number;
    title: string;
    file_url: string;
    year?: number;
    month?: number;
    date?: number;
  } | null;
}

interface Schedule {
  id: number;
  title: string;
  media_file: string;
  media_file_url?: string | null;
  schedule_date: string;
  day_of_week: number;
  slots: {
    id: number;
    start_time: string;
    end_time: string;
  }[];
}

interface TvPlaybackContext {
  mediaFile?: string | null;
  mediaFileUrl?: string | null;
  programTitle?: string;
}

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

type ViewMode = 'list' | 'channel-detail' | 'epaper-view' | 'tv-player' | 'youtube-channel';
type ChannelLayout = 'grid' | 'list';

const VIEW_MODES: ViewMode[] = ['list', 'channel-detail', 'epaper-view', 'tv-player', 'youtube-channel'];

export const MobileMyMediaPage: React.FC = () => {
  // Get app name from URL params (e.g., /mobile/mymedia or /mobile/mycompany)
  const { appName } = useParams<{ appName?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

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

  const [locationReady, setLocationReady] = useState(false);
  const [selectedParentCategory, setSelectedParentCategory] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null);
  // selectedDay: 0=Yesterday, 1=Today, 2=Tomorrow, 3=Day after tomorrow
  const [selectedDay, setSelectedDay] = useState<number>(1);

  // E-Paper / Magazine list filters (year/month)
  const [docFilterYear, setDocFilterYear] = useState<number>(new Date().getFullYear());
  const [docFilterMonth, setDocFilterMonth] = useState<number | ''>('');
  /** Calendar dates for Yesterday / Today / Tomorrow / Day after tomorrow */
  const scheduleDates = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return [-1, 0, 1, 2].map((offset) => {
      const d = new Date(base);
      d.setDate(d.getDate() + offset);
      return formatDateYMD(d);
    });
  }, []);

  const scheduleScrollRef = useRef<HTMLDivElement>(null);

  // Location filters - same pattern as MediaRegistrationForm
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  // Modals
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [channelLayout, setChannelLayout] = useState<ChannelLayout>('grid');

  const toggleChannelLayout = () => {
    setChannelLayout((prev) => (prev === 'grid' ? 'list' : 'grid'));
  };

  const adLocation = useMemo(
    () => ({
      countryId: selectedCountry || null,
      stateId: selectedState || null,
      districtId: selectedDistrict || null,
    }),
    [selectedCountry, selectedState, selectedDistrict]
  );

  const channelIdFromUrl = searchParams.get('id');
  const viewFromUrl = searchParams.get('view');

  const selectedChannel = useMemo((): Channel | null => {
    if (!channelIdFromUrl) return null;
    const id = parseInt(channelIdFromUrl, 10);
    if (Number.isNaN(id)) return null;
    return channels.find((c) => c.id === id) ?? null;
  }, [channelIdFromUrl, channels]);

  const viewMode = useMemo((): ViewMode => {
    if (!viewFromUrl || viewFromUrl === 'list' || !channelIdFromUrl || !selectedChannel) {
      return 'list';
    }
    if (VIEW_MODES.includes(viewFromUrl as ViewMode)) {
      return viewFromUrl as ViewMode;
    }
    return 'list';
  }, [viewFromUrl, channelIdFromUrl, selectedChannel]);

  const tvPlayback = useMemo((): TvPlaybackContext | null => {
    if (viewMode !== 'tv-player') return null;
    const programTitle = searchParams.get('program') || undefined;
    const mediaFile = searchParams.get('mediaFile') || undefined;
    const mediaFileUrl = searchParams.get('mediaFileUrl') || undefined;
    if (!programTitle && !mediaFile && !mediaFileUrl) return null;
    return { programTitle, mediaFile, mediaFileUrl };
  }, [viewMode, searchParams]);

  const updateViewSearchParams = (
    mode: ViewMode,
    channel: Channel | null,
    playback?: TvPlaybackContext | null
  ) => {
    const next = new URLSearchParams(searchParams);
    next.delete('view');
    next.delete('id');
    next.delete('program');
    next.delete('mediaFile');
    next.delete('mediaFileUrl');

    if (mode !== 'list' && channel) {
      next.set('view', mode);
      next.set('id', String(channel.id));
      if (playback?.programTitle) next.set('program', playback.programTitle);
      if (playback?.mediaFile) next.set('mediaFile', playback.mediaFile);
      if (playback?.mediaFileUrl) next.set('mediaFileUrl', playback.mediaFileUrl);
    }

    setSearchParams(next);
  };

  const getCurrentParentCategoryName = (): string => {
    const parent = parentCategories.find(p => p.id === selectedParentCategory);
    return parent?.category_name || '';
  };

  const isDocumentCategory = (): boolean => categoryNameIsDocument(getCurrentParentCategoryName());

  const isStreamCategory = (): boolean => {
    const name = getCurrentParentCategoryName();
    return categoryNameIncludesTV(name) || categoryNameIncludesRadio(name);
  };

  const isYouTubeCategory = (): boolean =>
    categoryNameIncludesYouTube(getCurrentParentCategoryName());

  const resolveChannelViewMode = (channel?: Channel | null): ViewMode => {
    if (isDocumentCategory()) return 'epaper-view';
    if (isStreamCategory()) return 'tv-player';
    // YouTube: either category is named "YouTube" or channel has a YouTube media_url
    if (isYouTubeCategory()) return 'youtube-channel';
    if (channel && isYouTubeChannelUrl(channel.media_url)) return 'youtube-channel';
    return 'channel-detail';
  };

  const handleChannelClick = (channel: Channel, playback?: TvPlaybackContext) => {
    updateViewSearchParams(resolveChannelViewMode(channel), channel, playback ?? null);
  };

  const handleScheduleSlotClick = (
    e: React.MouseEvent,
    channel: Channel,
    schedule: Schedule
  ) => {
    e.stopPropagation();
    if (schedule.media_file || schedule.media_file_url) {
      handleChannelClick(channel, {
        mediaFile: schedule.media_file || null,
        mediaFileUrl: schedule.media_file_url || null,
        programTitle: schedule.title
      });
    } else {
      handleChannelClick(channel);
    }
  };

  const handleBackToList = () => {
    updateViewSearchParams('list', null);
  };

  // Handle view channel details from player/document view
  const handleViewChannelDetails = () => {
    if (selectedChannel) {
      updateViewSearchParams('channel-detail', selectedChannel);
    }
  };

  const renderChannelLogo = (channel: Channel, className: string) => {
    const logoSrc =
      channel.media_logo_url ||
      (channel.media_logo?.startsWith('http') ? channel.media_logo : `${BACKEND_URL}${channel.media_logo}`);

    if (channel.media_logo_url || channel.media_logo) {
      return (
        <img
          src={logoSrc}
          alt={channel.media_name_english}
          className={className}
        />
      );
    }

    return (
      <div className={`${className} bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-600`}>
        {channel.media_name_english.substring(0, 2).toUpperCase()}
      </div>
    );
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

  const fetchCountriesList = async (): Promise<Country[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/geo/countries`);
      if (response.data.success) {
        const countriesData: Country[] = response.data.data;
        setCountries(countriesData);
        return countriesData;
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
    return [];
  };

  const fetchStatesList = async (countryId: number): Promise<State[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/geo/states/${countryId}`);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    }
    return [];
  };

  const fetchDistrictsList = async (stateId: number): Promise<District[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/geo/districts/${stateId}`);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
    return [];
  };

  /** Always refresh from API when logged in — login payload has no user_registration_form row */
  const loadRegistrationProfile = async (): Promise<Record<string, unknown> | null> => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const { authAPI } = await import('../../services/api');
        const res = await authAPI.getProfile();
        if (res.data?.success) {
          const userData = res.data.data as Record<string, unknown>;
          try {
            localStorage.setItem('user', JSON.stringify(userData));
          } catch {
            // ignore storage errors
          }
          return userData;
        }
      } catch (error) {
        console.error('Error loading registration profile:', error);
      }
    }
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        return JSON.parse(stored) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  };

  /**
   * Default filters from user_registration_form FKs (country_tbl / state_tbl / district_tbl).
   * Uses API validation when logged in; falls back to client profile parse.
   */
  const applyViewerLocation = async (countriesList: Country[]): Promise<boolean> => {
    try {
      let locationIds = null;
      const token = localStorage.getItem('accessToken');
      const userData = token ? await loadRegistrationProfile() : null;

      if (token) {
        try {
          const res = await axios.get(`${API_BASE_URL}/mymedia/viewer-location`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data?.success) {
            locationIds = locationFromApiResponse(res.data.data);
          }
        } catch (apiErr) {
          console.warn('viewer-location API failed:', apiErr);
        }
      }

      if (!locationIds && userData && hasRegistrationLocationData(userData)) {
        locationIds = resolveViewerLocation(userData, countriesList);
      }

      if (!locationIds?.countryId) {
        return false;
      }

      const statesList = await fetchStatesList(locationIds.countryId);
      let districtsList: District[] = [];
      if (locationIds.stateId) {
        districtsList = await fetchDistrictsList(locationIds.stateId);
      }

      const validated = validateViewerLocationAgainstGeoLists(
        locationIds,
        countriesList,
        statesList,
        districtsList
      );

      if (!validated.countryId) {
        return false;
      }

      setStates(statesList);
      setDistricts(districtsList);
      setSelectedCountry(String(validated.countryId));
      setSelectedState(validated.stateId ? String(validated.stateId) : '');
      setSelectedDistrict(validated.districtId ? String(validated.districtId) : '');
      return true;
    } catch (error) {
      console.error('Error applying viewer location:', error);
    }
    return false;
  };

  useEffect(() => {
    const initializeData = async () => {
      setLocationReady(false);
      const appId = await fetchAppInfo(appName || 'mymedia');
      const countriesList = await fetchCountriesList();
      const fromProfile = await applyViewerLocation(countriesList);
      if (!fromProfile) {
        setSelectedCountry('');
        setSelectedState('');
        setSelectedDistrict('');
        setStates([]);
        setDistricts([]);
      }
      setLocationReady(true);
      if (appId) {
        fetchCategories(appId);
      } else {
        fetchCategories();
      }
      fetchLanguages();
    };
    initializeData();
  }, [appName]);

  // After init, refetch state/district lists when user changes location in modal
  useEffect(() => {
    if (!locationReady) return;
    if (selectedCountry) {
      fetchStates(parseInt(selectedCountry, 10));
    } else {
      setStates([]);
      setSelectedState('');
    }
  }, [selectedCountry, locationReady]);

  useEffect(() => {
    if (!locationReady) return;
    if (selectedState) {
      fetchDistricts(parseInt(selectedState, 10));
    } else {
      setDistricts([]);
    }
  }, [selectedState, locationReady]);

  useEffect(() => {
    if (selectedParentCategory && locationReady && selectedCountry) {
      fetchChannels();
    }
  }, [
    selectedCountry,
    selectedState,
    selectedDistrict,
    selectedParentCategory,
    selectedCategory,
    selectedLanguage,
    docFilterYear,
    docFilterMonth,
    appInfo?.id,
    locationReady
  ]);

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
        const defaultParent = pickDefaultParentCategory(parents);
        if (defaultParent) {
          setSelectedParentCategory(defaultParent.id);
          if (defaultParent.children && defaultParent.children.length > 0) {
            setSubCategories(defaultParent.children);
            setSelectedCategory(null);
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
      if (appInfo?.id) params.append('appId', String(appInfo.id));
      else if (appName) params.append('appName', appName);
      if (selectedCountry) params.append('country_id', selectedCountry);
      if (selectedState) params.append('state_id', selectedState);
      if (selectedDistrict) params.append('district_id', selectedDistrict);
      if (selectedParentCategory) params.append('category_id', selectedParentCategory.toString());
      if (selectedCategory) params.append('parent_category_id', selectedCategory.toString());
      if (selectedLanguage) params.append('language_id', selectedLanguage.toString());

      if (isDocumentCategory()) {
        params.append('include_latest_document', '1');
        params.append('year', String(docFilterYear));
        if (docFilterMonth !== '') params.append('month', String(docFilterMonth));
      }

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

  const fetchAllSchedules = useCallback(async () => {
    const scheduleDate = scheduleDates[selectedDay];
    const schedulePromises = channels.map(async (channel) => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/mymedia/schedules/${channel.id}?scheduleDate=${scheduleDate}`
        );
        if (response.data.success) {
          return { channelId: channel.id, schedules: response.data.data.schedules as Schedule[] };
        }
      } catch (error) {
        console.error(`Error fetching schedules for channel ${channel.id}:`, error);
      }
      return { channelId: channel.id, schedules: [] as Schedule[] };
    });

    const results = await Promise.all(schedulePromises);
    const schedulesMap: { [channelId: number]: Schedule[] } = {};
    results.forEach((result) => {
      schedulesMap[result.channelId] = result.schedules;
    });
    setChannelSchedules(schedulesMap);
  }, [channels, selectedDay, scheduleDates]);

  const scrollScheduleToCurrentTime = useCallback(() => {
    const el = scheduleScrollRef.current;
    if (!el) return;
    const now = new Date();
    const currentSlot = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes() < 30 ? '00' : '30'}`;
    const currentSlotIndex = TIME_SLOTS.indexOf(currentSlot);
    if (currentSlotIndex < 0) return;
    el.scrollLeft = currentSlotIndex * SLOT_WIDTH_PX;
  }, []);

  useEffect(() => {
    const el = scheduleScrollRef.current;
    if (!el) return;
    if (selectedDay === 1) {
      scrollScheduleToCurrentTime();
    } else {
      el.scrollLeft = 0;
    }
  }, [selectedDay, channels.length, channelSchedules, scrollScheduleToCurrentTime]);

  useEffect(() => {
    if (channels.length > 0 && isStreamCategory()) {
      fetchAllSchedules();
    } else {
      setChannelSchedules({});
    }
  }, [channels, selectedDay, selectedParentCategory, fetchAllSchedules]);

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
    if (!selectedCountry) return 'Select location';
    const district = districts.find((d) => d.id.toString() === selectedDistrict);
    if (district) return district.district;
    const state = states.find((s) => s.id.toString() === selectedState);
    if (state) return state.state;
    const country = countries.find((c) => c.id.toString() === selectedCountry);
    return country?.country || 'Select location';
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

  const headerHeight = getMobileHeaderHeight(true);

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <MobileHeader
          appName={appName || 'mymedia'}
          appId={appInfo?.id}
          appInfoFromParent={!!appInfo}
          appInfo={appInfo ?? null}
          selectedCategoryId={selectedParentCategory}
          adLocation={adLocation}
          showLayoutToggle={true}
          channelLayout={channelLayout}
          onChannelLayoutToggle={toggleChannelLayout}
          darkMode={darkMode}
          onDarkModeToggle={toggleDarkMode}
          showTopIcons={true}
          showAds={true}
          showDarkModeToggle={true}
          showProfileButton={true}
        />
        <div style={{ minHeight: `calc(100vh - ${MOBILE_FOOTER_HEIGHT}px)` }} className="flex items-center justify-center">
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
        filterYear={docFilterYear}
        filterMonth={docFilterMonth === '' ? undefined : docFilterMonth}
        onBack={handleBackToList}
        onViewDetails={handleViewChannelDetails}
      />
    );
  }

  // Render TV/Radio player view — unified single-page (player + details)
  if (viewMode === 'tv-player' && selectedChannel) {
    return (
      <TVChannelDetailPage
        channelId={selectedChannel.id}
        channelName={selectedChannel.media_name_english}
        channelLogo={selectedChannel.media_logo_url || selectedChannel.media_logo}
        isRadio={categoryNameIncludesRadio(getCurrentParentCategoryName())}
        scheduleMediaFile={tvPlayback?.mediaFile}
        scheduleMediaUrl={tvPlayback?.mediaFileUrl}
        programTitle={tvPlayback?.programTitle}
        onBack={handleBackToList}
      />
    );
  }

  // Render YouTube channel view
  if (viewMode === 'youtube-channel' && selectedChannel && selectedChannel.media_url) {
    return (
      <YoutubeChannelView
        channelId={selectedChannel.id}
        channelName={selectedChannel.media_name_english}
        channelLogo={selectedChannel.media_logo_url || selectedChannel.media_logo}
        mediaUrl={selectedChannel.media_url}
        onBack={handleBackToList}
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
        adLocation={adLocation}
        showLayoutToggle={true}
        channelLayout={channelLayout}
        onChannelLayoutToggle={toggleChannelLayout}
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
        showTopIcons={true}
        showAds={true}
        showDarkModeToggle={true}
        showProfileButton={true}
      />
      <div className="pb-20" style={{ paddingBottom: MOBILE_FOOTER_HEIGHT + 16 }}>
        {/* Filter Row - Updated design with white background and rounded buttons */}
        <div className="sticky z-30 bg-white shadow-sm px-3 py-3 border-b border-gray-200" style={{ top: headerHeight }}>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {/* Location */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-gray-50 transition-colors shadow-sm max-w-[140px]"
            >
              <span className="truncate">{getLocationLabel()}</span>
              <ChevronDown size={16} className="flex-shrink-0" />
            </button>

            {/* Category Dropdown */}
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-gray-50 transition-colors shadow-sm"
            >
              {getSelectedCategoryName()} <ChevronDown size={16} />
            </button>

            {/* Language Dropdown */}
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap hover:bg-gray-50 transition-colors shadow-sm"
            >
              {getSelectedLanguageName()} <ChevronDown size={16} />
            </button>

            {/* Year / month for E-Paper & Magazine */}
            {isDocumentCategory() && (
              <>
                <select
                  value={docFilterYear}
                  onChange={(e) => setDocFilterYear(parseInt(e.target.value, 10))}
                  className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium shadow-sm"
                >
                  {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  value={docFilterMonth}
                  onChange={(e) => setDocFilterMonth(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium shadow-sm"
                >
                  <option value="">All months</option>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </>
            )}
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
        {!selectedCountry ? (
          <div className="p-8 text-center text-gray-500 bg-white">
            <MapPin size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-medium text-gray-700">Select location</p>
            <p className="text-sm mt-2">Choose country, state, and district to load media for your area.</p>
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="mt-4 px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700"
            >
              Select location
            </button>
          </div>
        ) : channels.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>No channels found for the selected filters</p>
          </div>
        ) : isDocumentCategory() ? (
          channelLayout === 'grid' ? (
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
                  {channel.latest_document?.title && (
                    <p className="text-xs text-teal-700 truncate mt-0.5 font-medium">
                      {channel.latest_document.title}
                    </p>
                  )}
                  {channel.media_name_regional && (
                    <p className="text-xs text-gray-600 truncate mt-0.5">{channel.media_name_regional}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          ) : (
          <div className="bg-white divide-y divide-gray-200">
            {channels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 relative">
                  {(channel.media_logo_url || channel.media_logo) ? (
                    <img
                      src={channel.media_logo_url || (channel.media_logo?.startsWith('http') ? channel.media_logo : `${BACKEND_URL}${channel.media_logo}`)}
                      alt={channel.media_name_english}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200">
                      <FileText size={28} className="text-pink-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{channel.media_name_english}</h3>
                  {channel.latest_document?.title && (
                    <p className="text-xs text-teal-700 truncate mt-0.5 font-medium">
                      {channel.latest_document.title}
                    </p>
                  )}
                  {channel.media_name_regional && (
                    <p className="text-xs text-gray-600 truncate mt-0.5">{channel.media_name_regional}</p>
                  )}
                  <span className="inline-block mt-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    {channel.select_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
          )
        ) : isStreamCategory() ? (
          channelLayout === 'grid' ? (
          /* TV / Radio Schedule Grid: 48 time slots (30-min), 12h display, NOW marker on Today */
          (() => {
            const now = new Date();
            const currentSlot = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes() < 30 ? '00' : '30'}`;
            const currentSlotIndex = TIME_SLOTS.indexOf(currentSlot);
            const showNowMarker = selectedDay === 1 && currentSlotIndex >= 0;
            const nowLineLeft = CHANNEL_COL_WIDTH_PX + currentSlotIndex * SLOT_WIDTH_PX;

            return (
              <div
                ref={scheduleScrollRef}
                className="bg-white overflow-x-auto relative shadow-inner"
              >
                <div className="min-w-max relative">
                <div className="flex border-b sticky top-0 bg-gradient-to-b from-gray-50 to-gray-100 z-10 shadow-sm">
                  <div
                    className="sticky left-0 z-20 flex-shrink-0 p-3 font-bold text-gray-800 border-r bg-white shadow-[2px_0_4px_rgba(0,0,0,0.06)]"
                    style={{ width: CHANNEL_COL_WIDTH_PX, minWidth: CHANNEL_COL_WIDTH_PX }}
                  >
                    CHANNELS
                  </div>
                  {TIME_SLOTS.map((time) => (
                    <div key={time} className="flex-shrink-0 p-2 text-center text-xs font-semibold text-gray-700 border-r" style={{ minWidth: SLOT_WIDTH_PX }}>
                      {formatTime12h(time)}
                    </div>
                  ))}
                </div>

                {showNowMarker && (
                  <>
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-[15] pointer-events-none"
                      style={{ left: nowLineLeft + SLOT_WIDTH_PX / 2 - 1 }}
                      aria-hidden
                    />
                    <div
                      className="absolute z-[25] pointer-events-none flex flex-col items-center"
                      style={{ left: nowLineLeft + SLOT_WIDTH_PX / 2 - 20, top: 4 }}
                    >
                      <MapPin size={20} className="text-red-500 drop-shadow" fill="#ef4444" stroke="#b91c1c" />
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow mt-0.5">
                        NOW
                      </span>
                    </div>
                  </>
                )}

                {channels.map((channel) => (
                  <div key={channel.id} className="flex border-b border-gray-200 cursor-pointer hover:bg-pink-50/30 transition-colors" onClick={() => handleChannelClick(channel)}>
                    <div
                      className="sticky left-0 z-10 flex-shrink-0 p-2 border-r border-gray-200 bg-white flex items-center justify-center relative group shadow-[2px_0_4px_rgba(0,0,0,0.06)]"
                      style={{ width: CHANNEL_COL_WIDTH_PX, minWidth: CHANNEL_COL_WIDTH_PX }}
                    >
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
                        <div
                          key={time}
                          className={`flex-shrink-0 p-1.5 border-r border-gray-200 text-xs ${isCurrentSlot ? 'bg-red-50' : ''}`}
                          style={{ minWidth: SLOT_WIDTH_PX }}
                          onClick={(e) => result && handleScheduleSlotClick(e, channel, result.schedule)}
                        >
                          {result ? (
                            <div className={`p-1.5 rounded min-w-0 cursor-pointer hover:ring-2 hover:ring-teal-400 ${isCurrentSlot ? 'bg-red-100 border border-red-300' : 'bg-pink-50 border border-pink-200'}`}>
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
              </div>
            );
          })()
          ) : (
          <div className="bg-white divide-y divide-gray-200">
            {channels.map((channel) => {
              const schedules = channelSchedules[channel.id] || [];
              const currentProgram = schedules[0]?.title;
              return (
                <div
                  key={channel.id}
                  onClick={() => handleChannelClick(channel)}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-pink-50/40 transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    {renderChannelLogo(channel, 'w-16 h-12 object-contain')}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                        <Play size={16} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{channel.media_name_english}</h3>
                    {channel.media_name_regional && (
                      <p className="text-xs text-gray-600 truncate mt-0.5">{channel.media_name_regional}</p>
                    )}
                    {currentProgram && (
                      <p className="text-xs text-teal-700 truncate mt-1 font-medium">{currentProgram}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                    {channel.select_type}
                  </span>
                </div>
              );
            })}
          </div>
          )
        ) : channelLayout === 'grid' ? (
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
        ) : (
          <div className="bg-white divide-y divide-gray-200">
            {channels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  {(channel.media_logo_url || channel.media_logo) ? (
                    <img
                      src={channel.media_logo_url || (channel.media_logo?.startsWith('http') ? channel.media_logo : `${BACKEND_URL}${channel.media_logo}`)}
                      alt={channel.media_name_english}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                      {channel.media_name_english?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{channel.media_name_english}</h3>
                  {channel.media_name_regional && (
                    <p className="text-xs text-gray-600 truncate mt-0.5">{channel.media_name_regional}</p>
                  )}
                  <span className="inline-block mt-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    {channel.select_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

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

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedState('');
                    setSelectedDistrict('');
                  }}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-red-500 focus:outline-none transition-colors"
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>{country.country}</option>
                  ))}
                </select>
              </div>

              {selectedCountry && (
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setSelectedDistrict('');
                    }}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-red-500 focus:outline-none transition-colors"
                  >
                    <option value="">All states</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>{state.state}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedState && (
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-red-500 focus:outline-none transition-colors"
                  >
                    <option value="">All districts</option>
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
