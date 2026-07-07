import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, ChevronLeft, ChevronRight, X, Search, Menu, Sun, Moon, Settings, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL, getUploadUrl, resolveProfileImageUrl, WASABI_IMG_PROPS } from '../../config/api.config';
import { authAPI } from '../../services/api';
import { UserProfileModal } from './UserProfileModal';
import { AppSettingsModal } from './AppSettingsModal';
import { AppDownloadBadges } from './AppDownloadBadges';
import { InlineHeaderAds } from './InlineHeaderAds';
import { getLocationFromRegistration } from '../../utils/viewerLocation';

export interface TopIcon {
  id: number;
  icon: string;
  name: string;
  url: string;
  logo?: string;
  background_color?: string;
  apps_name?: string;
}

export interface MobileSearchResult {
  id: string | number;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  meta?: string;
  href?: string;
}

const normalizeAppKey = (name?: string) => (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const resolveAssetUrl = (path?: string) => {
  if (!path) return '';
  return getUploadUrl(path);
};

/** Resolve carousel ad image: signed Wasabi URL, public URL, local upload, or object key. */
const resolveAdImageUrl = (ad: {
  signed_url?: string;
  image?: string;
  file_path?: string;
  file_url?: string;
}) => {
  if (ad.signed_url?.startsWith('http')) return ad.signed_url;
  if (ad.image?.startsWith('http')) return ad.image;
  if (ad.file_url?.startsWith('http')) return ad.file_url;

  const localPath = ad.file_path?.startsWith('/uploads/')
    ? ad.file_path
    : ad.image?.startsWith('/uploads/')
      ? ad.image
      : null;
  if (localPath) return resolveAssetUrl(localPath);

  const remote = ad.signed_url || ad.image || ad.file_url || ad.file_path || '';
  return resolveAssetUrl(remote);
};

const MOBILE_ACTION_BTN =
  'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm hover:shadow-md transition-shadow';

const APP_ICON_SIZE = 'w-8 h-8';
const APP_ICON_IMG = 'w-5 h-5 object-contain';

interface Ad {
  id: number;
  image: string;
  title: string;
  url: string;
}

interface AppInfo {
  id: number;
  name: string;
  apps_name: string;
  icon: string;
  logo: string;
  name_image: string;
}

interface UserProfileData {
  set_country?: number;
  set_state?: number;
  set_district?: number;
  country?: number;
  state?: number;
  district?: number;
}

interface UserProfile {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  display_name?: string;
  alter_number?: string;
  phone?: string;
  profile_img?: string;
  profile_img_url?: string;
  identification_code?: string;
  profile?: UserProfileData;
}

/** Location FK ids from user_registration_form → country_tbl / state_tbl / district_tbl */
const getLocationFromProfile = (source?: UserProfileData | Record<string, unknown>): UserProfileData | undefined => {
  const ids = getLocationFromRegistration(source);
  if (!ids?.countryId) return undefined;
  return {
    set_country: ids.countryId,
    set_state: ids.stateId ?? undefined,
    set_district: ids.districtId ?? undefined,
    country: ids.countryId,
    state: ids.stateId ?? undefined,
    district: ids.districtId ?? undefined,
  };
};

const getStoredUserLocation = (): UserProfileData | undefined => {
  try {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return undefined;
    const userData = JSON.parse(storedUser) as Record<string, unknown>;
    return getLocationFromProfile(userData);
  } catch {
    return undefined;
  }
};

const resolveUserLocationProfile = (
  externalUser?: UserProfile | null,
  internalUser?: UserProfile | null,
): UserProfileData | undefined => {
  return (
    getLocationFromProfile(externalUser?.profile) ??
    getLocationFromProfile(internalUser?.profile) ??
    getStoredUserLocation()
  );
};

interface GroupedApps {
  [key: string]: TopIcon[];
}

interface MobileHeaderProps {
  appId?: number;
  appName?: string;
  /** When true, parent provides app info - header will not fetch /mymedia/app. Pass appInfo when loaded. */
  appInfoFromParent?: boolean;
  /** App info from parent (e.g. MobileAppPage). When provided, header uses it instead of fetching. */
  appInfo?: AppInfo | null;
  /** Selected footer category ID for carousel ad filtering (required by API). */
  selectedCategoryId?: number | null;
  darkMode?: boolean;
  onDarkModeToggle?: () => void;
  userProfile?: UserProfile | null;
  isLoggedIn?: boolean;
  onProfileClick?: () => void;
  onTopIconClick?: (icon: TopIcon) => void;
  onLogout?: () => void;
  onProfileUpdate?: (updates: Partial<UserProfile>) => void;
  /** Notified when search panel opens/closes or results update. */
  onSearchStateChange?: (state: {
    active: boolean;
    query: string;
    results: MobileSearchResult[];
  }) => void;
  /** Optional page-level location for carousel ad targeting (e.g. MyMedia filters). */
  adLocation?: {
    countryId?: number | string | null;
    stateId?: number | string | null;
    districtId?: number | string | null;
  };
  /** Show grid/list layout toggle in the profile bar (mobile). */
  showLayoutToggle?: boolean;
  channelLayout?: 'grid' | 'list';
  onChannelLayoutToggle?: () => void;
  // Customization options for different apps
  showTopIcons?: boolean;
  showAds?: boolean;
  showDarkModeToggle?: boolean;
  showProfileButton?: boolean;
  /** Desktop variant: gear icon and app-name settings entry. */
  showSettingsButton?: boolean;
  headerBgColor?: string;
  topIconsBgColor?: string;
  customLogo?: string;
  customIcon?: string;
  /** `desktop` uses a compact, professional navbar (no pink mobile styling). */
  variant?: 'mobile' | 'desktop';
  /** Desktop home: logo left, ads center, app-store badges right. */
  desktopLayout?: 'default' | 'home';
  showAppDownloadButtons?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  appId,
  appName,
  appInfoFromParent = false,
  appInfo: appInfoProp = undefined,
  selectedCategoryId = null,
  darkMode = false,
  onDarkModeToggle,
  userProfile: externalUserProfile,
  isLoggedIn: externalIsLoggedIn = false,
  onProfileClick: externalOnProfileClick,
  onTopIconClick,
  onLogout,
  onProfileUpdate: externalOnProfileUpdate,
  onSearchStateChange,
  adLocation,
  showLayoutToggle = false,
  channelLayout = 'grid',
  onChannelLayoutToggle,
  showTopIcons = true,
  showAds = true,
  showDarkModeToggle = true,
  showProfileButton = true,
  showSettingsButton = true,
  headerBgColor = 'bg-white',
  topIconsBgColor = 'bg-teal-600',
  customLogo,
  customIcon,
  variant = 'mobile',
  desktopLayout = 'default',
  showAppDownloadButtons = false,
}) => {
  const isDesktopVariant = variant === 'desktop';
  const isDesktopHomeLayout = isDesktopVariant && desktopLayout === 'home';
  // Internal state for modals and user profile
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAppSettingsModal, setShowAppSettingsModal] = useState(false);
  const [showMoreAppsModal, setShowMoreAppsModal] = useState(false);
  const [topIcons, setTopIcons] = useState<TopIcon[]>([]);
  const [allGroupedApps, setAllGroupedApps] = useState<GroupedApps>({});
  const [ads, setAds] = useState<Ad[]>([]);
  const [internalAppInfo, setInternalAppInfo] = useState<AppInfo | null>(null);
  const appInfo = appInfoFromParent ? (appInfoProp ?? internalAppInfo) : (appInfoProp ?? internalAppInfo);
  const [selectedApp, setSelectedApp] = useState<TopIcon | null>(null);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MobileSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [internalUserProfile, setInternalUserProfile] = useState<UserProfile | null>(null);
  const [internalIsLoggedIn, setInternalIsLoggedIn] = useState(false);

  // Use external props if provided, otherwise use internal state
  const userProfile = externalUserProfile || internalUserProfile;
  const isLoggedIn = externalIsLoggedIn || internalIsLoggedIn;

  // Fetch user profile if not provided (when parent provides app info it usually provides profile too)
  const fetchUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!showProfileButton && externalUserProfile == null) return null;
    if (externalUserProfile != null) return externalUserProfile;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setInternalIsLoggedIn(false);
        return null;
      }

      const response = await authAPI.getProfile();
      if (response.data.success) {
        const userData = response.data.data;
        const profile: UserProfile = {
          id: userData.id || 0,
          username: userData.username || '',
          email: userData.email,
          first_name: userData.first_name,
          display_name: userData.display_name,
          alter_number: userData.alter_number,
          phone: userData.phone,
          profile_img: userData.profile_img,
          profile_img_url: userData.profile_img_url,
          identification_code: userData.identification_code,
          profile: userData.profile
            ? {
                set_country: userData.profile.set_country,
                set_state: userData.profile.set_state,
                set_district: userData.profile.set_district,
                country: userData.profile.country,
                state: userData.profile.state,
                district: userData.profile.district,
              }
            : undefined,
        };
        setInternalUserProfile(profile);
        setInternalIsLoggedIn(true);
        try {
          localStorage.setItem('user', JSON.stringify(userData));
        } catch {
          // ignore storage errors
        }
        return profile;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setInternalIsLoggedIn(false);
    }
    return null;
  }, [externalUserProfile, appInfoFromParent, showProfileButton]);

  // Fetch app info (only when parent does not provide it)
  const fetchAppInfo = useCallback(async () => {
    if (appInfoFromParent) return null;
    try {
      let url = `${API_BASE_URL}/mymedia/app`;
      if (appName) {
        url += `?name=${encodeURIComponent(appName)}`;
      }
      const response = await axios.get(url);
      if (response.data.success) {
        const info = response.data.data;
        setInternalAppInfo(info);
        return info;
      }
    } catch (error) {
      console.error('Error fetching app info:', error);
    }
    return null;
  }, [appName, appInfoFromParent]);

  // Fetch top icons for "My Apps" category only (horizontal scroll)
  // Also fetch all grouped apps for the "More" modal
  const fetchTopIcons = useCallback(async (id?: number) => {
    try {
      // Fetch from home/mobile-data for all apps
      const response = await axios.get(`${API_BASE_URL}/home/mobile-data`);
      if (response.data.success) {
        const topIconData = response.data.data?.topIcon || {};

        // Get My Apps for the top horizontal scroll (Section A)
        const myApps = topIconData.myapps || [];
        const formattedIcons: TopIcon[] = myApps.map((app: any) => ({
          id: app.id,
          name: app.name,
          icon: app.icon || '',
          logo: app.logo || '',
          url: `/mobile/${app.name?.toLowerCase().replace(/\s+/g, '') || app.name}`,
          background_color: app.background_color || '#ffffff',
          apps_name: 'My Apps'
        }));
        setTopIcons(formattedIcons);

        // Set first app as selected if none selected and we have apps
        if (formattedIcons.length > 0 && !selectedApp) {
          // Find the app that matches appName or use first one
          const matchingApp = formattedIcons.find(
            app => app.name.toLowerCase().replace(/\s+/g, '') === appName?.toLowerCase()
          );
          setSelectedApp(matchingApp || formattedIcons[0]);
        }

        // Store all grouped apps for "More" modal
        const grouped: GroupedApps = {};

        // My Apps
        if (myApps.length > 0) {
          grouped['My Apps'] = myApps.map((app: any) => ({
            id: app.id,
            name: app.name,
            icon: app.icon || '',
            logo: app.logo || '',
            url: `/mobile/${app.name?.toLowerCase().replace(/\s+/g, '') || app.name}`,
            background_color: app.background_color || '#ffffff',
            apps_name: 'My Apps'
          }));
        }

        // My Company
        const myCompany = topIconData.myCompany || [];
        if (myCompany.length > 0) {
          grouped['My Company'] = myCompany.map((app: any) => ({
            id: app.id,
            name: app.name,
            icon: app.icon || '',
            logo: app.logo || '',
            url: `/mobile/${app.name?.toLowerCase().replace(/\s+/g, '') || app.name}`,
            background_color: app.background_color || '#ffffff',
            apps_name: 'My Company'
          }));
        }

        // Online Apps
        const online = topIconData.online || [];
        if (online.length > 0) {
          grouped['Online Apps'] = online.map((app: any) => ({
            id: app.id,
            name: app.name,
            icon: app.icon || '',
            logo: app.logo || '',
            url: `/mobile/${app.name?.toLowerCase().replace(/\s+/g, '') || app.name}`,
            background_color: app.background_color || '#ffffff',
            apps_name: 'Online Apps'
          }));
        }

        // Offline Apps
        const offline = topIconData.offline || [];
        if (offline.length > 0) {
          grouped['Offline Apps'] = offline.map((app: any) => ({
            id: app.id,
            name: app.name,
            icon: app.icon || '',
            logo: app.logo || '',
            url: `/mobile/${app.name?.toLowerCase().replace(/\s+/g, '') || app.name}`,
            background_color: app.background_color || '#ffffff',
            apps_name: 'Offline Apps'
          }));
        }

        setAllGroupedApps(grouped);
      }
    } catch (error) {
      console.error('Error fetching top icons:', error);
      setTopIcons([]);
      setAllGroupedApps({});
    }
  }, [appName, selectedApp]);

  const resolveAdLocation = useCallback(
    (profile?: UserProfileData): UserProfileData | undefined => {
      if (adLocation?.countryId) {
        return {
          set_country: Number(adLocation.countryId),
          set_state: adLocation.stateId ? Number(adLocation.stateId) : undefined,
          set_district: adLocation.districtId ? Number(adLocation.districtId) : undefined,
          country: Number(adLocation.countryId),
          state: adLocation.stateId ? Number(adLocation.stateId) : undefined,
          district: adLocation.districtId ? Number(adLocation.districtId) : undefined,
        };
      }
      return getLocationFromProfile(profile);
    },
    [adLocation?.countryId, adLocation?.stateId, adLocation?.districtId],
  );

  // Fetch carousel ads — app/category context + user location from registration profile
  const fetchAds = useCallback(async (id?: number, profile?: UserProfileData, categoryId?: number | null) => {
    if (!id) return;

    const requestCarouselAds = async (catId?: number | null) => {
      const params = new URLSearchParams();
      params.append('app_id', id.toString());
      if (catId != null) params.append('category_id', catId.toString());

      const location = resolveAdLocation(profile);
      if (location?.set_country) params.append('country_id', String(location.set_country));
      if (location?.set_state) params.append('state_id', String(location.set_state));
      if (location?.set_district) params.append('district_id', String(location.set_district));

      const url = `${API_BASE_URL}/advertisement/carousel?${params.toString()}`;
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.data.success || !Array.isArray(response.data.data)) {
        return [];
      }

      return response.data.data.map((ad: {
        id: number;
        title?: string;
        url?: string;
        signed_url?: string;
        image?: string;
        file_path?: string;
        file_url?: string;
      }) => ({
        id: ad.id,
        image: resolveAdImageUrl(ad),
        title: ad.title || 'Advertisement',
        url: ad.url || '#',
      }));
    };

    try {
      let formattedAds = await requestCarouselAds(categoryId);
      // TV/Radio and other categories may have no category-specific bookings — show app-level ads
      if (formattedAds.length === 0 && categoryId != null) {
        formattedAds = await requestCarouselAds(null);
      }
      setAds(formattedAds);
    } catch (error) {
      console.error('Error fetching carousel ads:', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [resolveAdLocation]);

  const initializingRef = React.useRef(false);
  const lastAppNameRef = React.useRef<string | undefined>(undefined);

  // Single init effect: run only when appName changes (not when appId gets set later by parent)
  useEffect(() => {
    if (lastAppNameRef.current === appName && initializingRef.current) return;
    lastAppNameRef.current = appName;
    initializingRef.current = true;

    if (!appInfoFromParent) setInternalAppInfo(null);
    setTopIcons([]);
    setAds([]);
    setCurrentAdIndex(0);

    const initializeHeader = async () => {
      const fetchedProfile = await fetchUserProfile();
      const effectiveAppId = appId ?? appInfoProp?.id;
      const info = effectiveAppId != null && appInfoFromParent && appInfoProp
        ? appInfoProp
        : await fetchAppInfo();
      const targetAppId = effectiveAppId ?? info?.id;
      fetchTopIcons(targetAppId);

      const profileData = resolveUserLocationProfile(
        externalUserProfile,
        fetchedProfile ?? internalUserProfile,
      );

      if (showAds && targetAppId != null) {
        fetchAds(targetAppId, profileData, selectedCategoryId ?? undefined);
      }
      initializingRef.current = false;
    };
    initializeHeader();
  }, [appName, appInfoFromParent]);

  // Refetch ads when app, category, or user location profile becomes available
  useEffect(() => {
    if (!showAds) return;
    const effectiveAppId = appId ?? appInfoProp?.id ?? appInfo?.id;
    if (effectiveAppId == null) return;
    const profileData = resolveUserLocationProfile(externalUserProfile, internalUserProfile);
    fetchAds(effectiveAppId, profileData, selectedCategoryId);
  }, [
    appId,
    appInfoProp?.id,
    appInfo?.id,
    showAds,
    selectedCategoryId,
    externalUserProfile,
    internalUserProfile,
    fetchAds,
    adLocation?.countryId,
    adLocation?.stateId,
    adLocation?.districtId,
  ]);

  // Auto-rotate carousel
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads.length]);

  const handlePrevAd = () => {
    setCurrentAdIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const handleNextAd = () => {
    setCurrentAdIndex((prev) => (prev + 1) % ads.length);
  };

  // Handle profile icon click
  const handleProfileClick = () => {
    if (externalOnProfileClick) {
      externalOnProfileClick();
    } else {
      setShowProfileModal(true);
    }
  };

  // Handle app name/icon click
  const handleAppNameClick = () => {
    setShowAppSettingsModal(true);
  };

  const activeSearchApp = selectedApp ?? (appInfo
    ? {
        id: appInfo.id,
        name: appInfo.name,
        icon: appInfo.icon,
        logo: appInfo.logo,
        url: `/mobile/${normalizeAppKey(appInfo.name)}`,
      }
    : null);

  const effectiveSearchAppId = activeSearchApp?.id ?? appId ?? appInfo?.id;

  // Keep selectedApp in sync when route appName or app info changes
  useEffect(() => {
    if (!appName && !appInfo?.name) return;
    const key = normalizeAppKey(appName || appInfo?.name);
    if (!key) return;
    const match = topIcons.find((icon) => normalizeAppKey(icon.name) === key);
    if (match) {
      setSelectedApp(match);
      return;
    }
    if (appInfo) {
      setSelectedApp({
        id: appInfo.id,
        name: appInfo.name,
        icon: appInfo.icon,
        logo: appInfo.logo,
        url: `/mobile/${key}`,
      });
    }
  }, [appName, appInfo?.id, appInfo?.name, appInfo?.icon, appInfo?.logo, topIcons]);

  const performSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const q = trimmed.toLowerCase();
    const appKey = normalizeAppKey(activeSearchApp?.name || appName || appInfo?.name);
    const results: MobileSearchResult[] = [];
    const seen = new Set<string>();

    const pushResult = (item: MobileSearchResult) => {
      const dedupeKey = `${item.id}-${item.title}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);
      results.push(item);
    };

    setSearchLoading(true);
    setHasSearched(true);

    try {
      // Apps within the selected app's group (More modal data)
      Object.entries(allGroupedApps).forEach(([groupName, apps]) => {
        if (activeSearchApp?.apps_name && groupName !== activeSearchApp.apps_name) return;
        apps.forEach((app) => {
          if (
            app.name.toLowerCase().includes(q) ||
            groupName.toLowerCase().includes(q)
          ) {
            pushResult({
              id: `app-${app.id}`,
              title: app.name,
              subtitle: groupName,
              imageUrl: resolveAssetUrl(app.icon || app.logo),
              meta: 'App',
              href: app.url,
            });
          }
        });
      });

      // Top bar: only the active app when one is selected
      topIcons.forEach((app) => {
        if (activeSearchApp?.id && app.id !== activeSearchApp.id) return;
        if (app.name.toLowerCase().includes(q)) {
          pushResult({
            id: `top-${app.id}`,
            title: app.name,
            subtitle: app.apps_name || 'My Apps',
            imageUrl: resolveAssetUrl(app.icon || app.logo),
            meta: 'App',
            href: app.url,
          });
        }
      });

      // Categories for the active app
      if (effectiveSearchAppId) {
        try {
          const catParams = new URLSearchParams({ appId: String(effectiveSearchAppId) });
          if (activeSearchApp?.name) {
            catParams.set('appName', activeSearchApp.name);
          }
          const catRes = await axios.get(`${API_BASE_URL}/mymedia/categories?${catParams}`);
          if (catRes.data.success) {
            const categories: { id: number; category_name: string; category_image?: string; children?: { id: number; category_name: string; category_image?: string }[] }[] =
              catRes.data.data || [];
            categories.forEach((parent) => {
              const parentMatch =
                parent.category_name.toLowerCase().includes(q);
              if (parentMatch) {
                pushResult({
                  id: `cat-${parent.id}`,
                  title: parent.category_name,
                  subtitle: 'Category',
                  imageUrl: resolveAssetUrl(parent.category_image),
                  meta: 'Category',
                });
              }
              (parent.children || []).forEach((child) => {
                if (child.category_name.toLowerCase().includes(q)) {
                  pushResult({
                    id: `subcat-${child.id}`,
                    title: child.category_name,
                    subtitle: parent.category_name,
                    imageUrl: resolveAssetUrl(child.category_image),
                    meta: 'Subcategory',
                  });
                }
              });
            });
          }
        } catch {
          // categories optional per app
        }
      }

      // MyMedia channels when the active app is media-related
      if (appKey.includes('mymedia')) {
        try {
          const channelRes = await axios.get(`${API_BASE_URL}/mymedia/channels?type=National`);
          if (channelRes.data.success) {
            const channels: {
              id: number;
              media_name_english: string;
              media_name_regional?: string;
              media_logo?: string;
              media_logo_url?: string;
              select_type?: string;
              category?: { category_name?: string };
            }[] = channelRes.data.data || [];
            channels.forEach((ch) => {
              const title = ch.media_name_english || '';
              const regional = ch.media_name_regional || '';
              if (
                title.toLowerCase().includes(q) ||
                regional.toLowerCase().includes(q)
              ) {
                pushResult({
                  id: `ch-${ch.id}`,
                  title,
                  subtitle: regional || ch.category?.category_name,
                  imageUrl: resolveAssetUrl(ch.media_logo_url || ch.media_logo),
                  meta: ch.select_type || 'Channel',
                  href: `/mobile/mymedia`,
                });
              }
            });
          }
        } catch {
          // channel search is best-effort
        }
      }

      // Home page editorial content when on home / no specific app body
      if (!appKey || appKey === 'home' || appKey === 'mygroup') {
        try {
          const homeRes = await axios.get(`${API_BASE_URL}/home/mobile-data`);
          if (homeRes.data.success) {
            const data = homeRes.data.data;
            (data.aboutUs || []).forEach((item: { id?: number; title?: string; content?: string; image?: string }) => {
              if (
                item.title?.toLowerCase().includes(q) ||
                item.content?.toLowerCase().includes(q)
              ) {
                pushResult({
                  id: `about-${item.id ?? item.title}`,
                  title: item.title || 'About',
                  subtitle: item.content?.slice(0, 80),
                  imageUrl: resolveAssetUrl(item.image),
                  meta: 'About Us',
                });
              }
            });
            (data.testimonials || []).forEach((t: { id?: number; name?: string; testimonial?: string; image?: string; designation?: string }) => {
              if (
                t.name?.toLowerCase().includes(q) ||
                t.testimonial?.toLowerCase().includes(q)
              ) {
                pushResult({
                  id: `testimonial-${t.id ?? t.name}`,
                  title: t.name || 'Testimonial',
                  subtitle: t.designation,
                  imageUrl: resolveAssetUrl(t.image),
                  meta: 'Testimonial',
                });
              }
            });
          }
        } catch {
          // home sections optional
        }
      }

      setSearchResults(results);
    } finally {
      setSearchLoading(false);
    }
  }, [
    activeSearchApp?.name,
    allGroupedApps,
    appInfo?.name,
    appName,
    effectiveSearchAppId,
    topIcons,
  ]);

  useEffect(() => {
    onSearchStateChange?.({
      active: showSearchInput && hasSearched,
      query: searchQuery,
      results: searchResults,
    });
  }, [showSearchInput, hasSearched, searchQuery, searchResults, onSearchStateChange]);

  useEffect(() => {
    if (!showSearchInput) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 350);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, showSearchInput, performSearch, activeSearchApp?.id]);

  const handleSearchToggle = () => {
    setShowSearchInput((prev) => {
      const next = !prev;
      if (!next) {
        setSearchQuery('');
        setSearchResults([]);
        setHasSearched(false);
      }
      return next;
    });
  };

  const handleSearchResultClick = (result: MobileSearchResult) => {
    if (result.href) {
      guardedNavigate(result.href);
    }
  };

  const fixedHeaderHeightPx = getMobileHeaderHeight(
    showTopIcons,
    false,
    false,
    variant,
    desktopLayout,
    showSearchInput,
  );

  const renderCircularAppIcon = (
    icon: TopIcon,
    isSelected: boolean,
    options?: { showLabel?: boolean; compact?: boolean },
  ) => {
    const showLabel = options?.showLabel !== false;
    return (
      <>
        <div
          className={`${APP_ICON_SIZE} rounded-full shadow-sm flex items-center justify-center overflow-hidden transition-all flex-shrink-0 ${
            isSelected ? 'bg-red-500 ring-2 ring-red-400/60' : 'bg-white'
          }`}
        >
          {icon.icon ? (
            <img src={resolveAssetUrl(icon.icon)} alt={icon.name} className={APP_ICON_IMG} />
          ) : icon.logo ? (
            <img src={resolveAssetUrl(icon.logo)} alt={icon.name} className={APP_ICON_IMG} />
          ) : (
            <span className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-gray-700'}`}>
              {icon.name?.charAt(0) || 'A'}
            </span>
          )}
        </div>
        {showLabel && (
          <span
            className={`text-[9px] mt-0.5 truncate max-w-[52px] font-medium leading-tight ${
              isSelected ? 'text-gray-900' : 'text-gray-700'
            }`}
          >
            {icon.name}
          </span>
        )}
      </>
    );
  };

  const requiresAuth = (url: string): boolean => {
    const publicPaths = ['/', '/register', '/forgot-password', '/reset-password', '/partner/register'];
    return !publicPaths.includes(url) && !url.startsWith('/auth/') && !url.startsWith('/client-login/') && !url.startsWith('/god-login/') && !url.startsWith('/media-login/') && !url.startsWith('/register-form/');
  };

  const guardedNavigate = (url: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token && requiresAuth(url)) {
      window.location.href = '/';
      return;
    }
    window.location.href = url;
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
      setInternalUserProfile(null);
      setInternalIsLoggedIn(false);
      setShowProfileModal(false);
      if (onLogout) {
        onLogout();
      }
      // Redirect to home
      window.location.href = '/';
    }
  };

  // Get the logo to display (custom or from app info)
  const displayLogo = customLogo || appInfo?.logo;
  const displayIcon = customIcon || appInfo?.icon;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* Section A: Top Navigation Bar with Icons - Updated with pink/rose background */}
        {showTopIcons && (
          isDesktopHomeLayout ? (
            /* ── Desktop-home top strip: teal background, icons aligned under header ads ── */
            <div style={{ background: '#057284', display: 'grid', gridTemplateColumns: 'auto 1fr' }}>
              {/* Spacer — same width as logo column in Row B so icons align under ads */}
              <div style={{ minWidth: 160 }} />
              {/* Non-clickable app icon pills, flush start under header ad columns */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 px-2 min-w-0">
                {topIcons.map((icon, index) => (
                  <div
                    key={`dtop-${icon.id}-${index}`}
                    title={icon.name}
                    className="flex-shrink-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden flex items-center justify-center">
                      {icon.icon ? (
                        <img src={resolveAssetUrl(icon.icon)} alt={icon.name} className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-white font-bold text-[11px]">
                          {icon.name.charAt(0)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── Mobile / regular desktop top strip: pink gradient ── */
            <div className="bg-gradient-to-r from-pink-200 via-pink-100 to-pink-200 px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2 min-h-[44px]">
                {/* Fixed Menu Icon on the Left */}
                <button
                  type="button"
                  onClick={() => setShowMoreAppsModal(true)}
                  aria-label="All apps"
                  className="flex-shrink-0 cursor-pointer"
                >
                  <div className={`${APP_ICON_SIZE} rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow`}>
                    <Menu size={18} className="text-gray-700" />
                  </div>
                </button>

                {/* Horizontally Scrollable Top Icons (My Apps) */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 min-w-0 py-0.5">
                  {topIcons.length > 0 ? (
                    topIcons.map((icon, index) => (
                      <a
                        key={`top-${icon.id}-${icon.name}-${index}`}
                        href={icon.url || `/mobile/${normalizeAppKey(icon.name)}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedApp(icon);
                          setSearchQuery('');
                          setSearchResults([]);
                          setHasSearched(false);
                          if (onTopIconClick) {
                            onTopIconClick(icon);
                          } else {
                            guardedNavigate(icon.url || `/mobile/${normalizeAppKey(icon.name)}`);
                          }
                        }}
                        className={`flex flex-col items-center min-w-[44px] flex-shrink-0 cursor-pointer transition-all ${
                          selectedApp?.id === icon.id ? 'scale-105' : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        {renderCircularAppIcon(icon, selectedApp?.id === icon.id)}
                      </a>
                    ))
                  ) : (
                    ['Home', 'My Chat', 'My Media', 'My Video', 'My Go'].map((name) => {
                      const fallbackUrl = `/mobile/${normalizeAppKey(name)}`;
                      const isSelected = normalizeAppKey(name) === normalizeAppKey(appName);
                      const fallbackIcon: TopIcon = { id: 0, name, icon: '', url: fallbackUrl };
                      return (
                        <a
                          key={name}
                          href={fallbackUrl}
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedApp(fallbackIcon);
                            if (onTopIconClick) {
                              onTopIconClick(fallbackIcon);
                            } else {
                              guardedNavigate(fallbackUrl);
                            }
                          }}
                          className={`flex flex-col items-center min-w-[44px] flex-shrink-0 cursor-pointer transition-all ${
                            isSelected ? 'scale-105' : 'opacity-90 hover:opacity-100'
                          }`}
                        >
                          {renderCircularAppIcon(fallbackIcon, isSelected)}
                        </a>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* Section B: Profile bar — desktop variant or mobile pink bar */}
        <div
          className={
            isDesktopVariant
              ? `border-b transition-colors duration-300 ${
                  darkMode
                    ? 'bg-gray-900 border-gray-800 shadow-lg shadow-black/20'
                    : 'bg-white border-gray-200 shadow-sm'
                }`
              : 'bg-gradient-to-r from-pink-200 via-pink-100 to-pink-200'
          }
        >
          {isDesktopHomeLayout ? (
            <>
              {/* ── Row B: Logo (left teal) | Header Ad 1 | Header Ad 2 ── */}
              <div
                className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', height: 120 }}
              >
                {/* Logo cell — teal background */}
                <div
                  className="flex items-center justify-center gap-2 px-5 flex-shrink-0"
                  style={{ background: '#057284', minWidth: 160 }}
                >
                  {displayLogo || displayIcon ? (
                    <img
                      src={
                        (displayLogo || displayIcon)!.startsWith('http')
                          ? (displayLogo || displayIcon)!
                          : `${BACKEND_URL}${displayLogo || displayIcon}`
                      }
                      alt={appInfo?.name || 'My Group'}
                      className="h-10 object-contain"
                    />
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {(appInfo?.name || appName || 'M').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-semibold text-sm hidden sm:block truncate max-w-[80px]">
                        {appInfo?.name || 'My Group'}
                      </span>
                    </>
                  )}
                </div>

                {/* Header Ad 1 */}
                <div
                  className={`overflow-hidden border-l ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  style={{ height: '100%' }}
                >
                  {ads[0] ? (
                    <a
                      href={ads[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'block', width: '100%', height: '100%' }}
                    >
                      <img
                        src={ads[0].image}
                        alt={ads[0].title}
                        className="w-full h-full"
                        style={{ objectFit: 'fill', display: 'block' }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    </a>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 gap-1">
                      <span className="text-[10px] font-semibold text-purple-400">Header Ad 1</span>
                      <span className="text-[9px] text-gray-400">Your ad here</span>
                    </div>
                  )}
                </div>

                {/* Header Ad 2 */}
                <div
                  className={`overflow-hidden border-l ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  style={{ height: '100%' }}
                >
                  {ads[1] ? (
                    <a
                      href={ads[1].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'block', width: '100%', height: '100%' }}
                    >
                      <img
                        src={ads[1].image}
                        alt={ads[1].title}
                        className="w-full h-full"
                        style={{ objectFit: 'fill', display: 'block' }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    </a>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 gap-1">
                      <span className="text-[10px] font-semibold text-indigo-400">Header Ad 2</span>
                      <span className="text-[9px] text-gray-400">Your ad here</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Row C: Brand bar (no user profile) ── */}
              <div
                className={`flex items-center justify-between px-4 relative ${
                  darkMode ? 'bg-gray-900' : 'bg-white'
                }`}
                style={{ height: 52 }}
              >
                {/* Left: spacer for layout balance */}
                <div className="w-8 flex-shrink-0" />

                {/* Center: Mygroup logo + name (absolute-centered) */}
                <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2 pointer-events-none select-none">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
                    {displayLogo || displayIcon ? (
                      <img
                        src={
                          (displayLogo || displayIcon)!.startsWith('http')
                            ? (displayLogo || displayIcon)!
                            : `${BACKEND_URL}${displayLogo || displayIcon}`
                        }
                        alt={appInfo?.name || 'Mygroup'}
                        className="w-5 h-5 object-contain"
                      />
                    ) : (
                      <span className="text-white font-bold text-xs">
                        {(appInfo?.name || appName || 'M').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {appInfo?.name || appInfo?.apps_name || appName || 'Mygroup'}
                  </span>
                </div>

                {/* Right: action icons — list view + dark-mode toggle only */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    aria-label="List view"
                  >
                    <List size={17} />
                  </button>
                  {showDarkModeToggle && onDarkModeToggle && (
                    <button
                      type="button"
                      onClick={onDarkModeToggle}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        darkMode
                          ? 'bg-gray-800 text-amber-400 hover:bg-gray-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                      {darkMode ? <Sun size={17} /> : <Moon size={17} />}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
          <div
            className={`flex items-center justify-between gap-3 ${
              isDesktopVariant ? 'relative max-w-7xl mx-auto px-6 lg:px-8 h-[72px]' : 'px-4 h-14'
            }`}
          >
            {showProfileButton && (
              <button
                type="button"
                onClick={handleProfileClick}
                className="flex-shrink-0 rounded-full ring-2 ring-transparent hover:ring-purple-500/30 transition-all duration-300"
                aria-label="Open profile"
              >
                {userProfile?.profile_img || userProfile?.profile_img_url ? (
                  <img
                    src={resolveProfileImageUrl(userProfile.profile_img, userProfile.profile_img_url)}
                    alt="Profile"
                    {...WASABI_IMG_PROPS}
                    className={`w-9 h-9 rounded-full object-cover ${
                      isDesktopVariant ? 'border-2 border-gray-200 dark:border-gray-700' : 'border-2 border-white shadow-sm'
                    }`}
                  />
                ) : (
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      isDesktopVariant
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                        : 'bg-gradient-to-br from-blue-400 to-blue-500 text-white border-2 border-white shadow-sm'
                    }`}
                  >
                    <User size={18} />
                  </div>
                )}
              </button>
            )}

            {isDesktopVariant ? (
              (() => {
                const branding = (
                  <>
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/25">
                      {displayLogo || displayIcon ? (
                        <img
                          src={(displayLogo || displayIcon)!.startsWith('http') ? (displayLogo || displayIcon) : `${BACKEND_URL}${displayLogo || displayIcon}`}
                          alt={appInfo?.name || 'My Group'}
                          className="w-7 h-7 object-contain"
                        />
                      ) : (
                        <span className="text-white font-bold text-lg">
                          {(appInfo?.name || appName || 'M').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className={`text-sm font-semibold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        My Group
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Enterprise Platform
                      </p>
                    </div>
                  </>
                );
                const brandingClass = 'flex items-center gap-3 absolute left-1/2 -translate-x-1/2';
                return showSettingsButton ? (
                  <button type="button" onClick={handleAppNameClick} className={brandingClass}>
                    {branding}
                  </button>
                ) : (
                  <div className={`${brandingClass} pointer-events-none select-none`}>{branding}</div>
                );
              })()
            ) : null}

            <div className={`flex items-center gap-2 ${isDesktopVariant ? 'ml-auto' : 'flex-shrink-0'}`}>
              {!isDesktopVariant && (
                <>
                  <button
                    type="button"
                    onClick={handleSearchToggle}
                    aria-label={showSearchInput ? 'Close search' : 'Open search'}
                    aria-expanded={showSearchInput}
                    className={`${MOBILE_ACTION_BTN} ${
                      showSearchInput ? 'bg-red-500 text-white' : 'bg-white text-gray-700'
                    }`}
                  >
                    {showSearchInput ? <X size={18} /> : <Search size={18} />}
                  </button>
                  {showLayoutToggle && onChannelLayoutToggle && (
                    <button
                      type="button"
                      onClick={onChannelLayoutToggle}
                      aria-label={channelLayout === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
                      className={`${MOBILE_ACTION_BTN} ${
                        channelLayout === 'list' ? 'bg-red-500 text-white' : 'bg-white text-gray-700'
                      }`}
                    >
                      {channelLayout === 'grid' ? <LayoutGrid size={18} /> : <List size={18} />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAppNameClick}
                    aria-label="App settings"
                    className={`${MOBILE_ACTION_BTN} bg-red-600 overflow-hidden`}
                  >
                    {displayLogo || displayIcon ? (
                      <img
                        src={resolveAssetUrl(displayLogo || displayIcon)}
                        alt={appInfo?.name || 'App'}
                        className="w-5 h-5 object-contain"
                      />
                    ) : (
                      <span className="text-white font-bold text-xs">
                        {(selectedApp?.name || appInfo?.name || appName || 'P').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>
                </>
              )}

              {isDesktopVariant && showDarkModeToggle && onDarkModeToggle && (
                <button
                  type="button"
                  onClick={onDarkModeToggle}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    darkMode
                      ? 'bg-gray-800 text-amber-400 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              )}

              {isDesktopVariant && showSettingsButton && (
                <button
                  type="button"
                  onClick={handleAppNameClick}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="App settings"
                >
                  <Settings size={20} />
                </button>
              )}
            </div>
          </div>
          )}

          {/* Mobile search field — toggled from Search icon */}
          {!isDesktopVariant && showSearchInput && (
            <div className="px-4 pb-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search in ${activeSearchApp?.name || appInfo?.name || appName || 'app'}…`}
                  className="w-full rounded-full border border-white/80 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setHasSearched(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
                    aria-label="Clear search"
                  >
                    <X size={14} className="text-gray-500" />
                  </button>
                )}
              </div>
              {activeSearchApp?.name && (
                <p className="text-[10px] text-gray-600 mt-1 px-1 truncate">
                  Searching within {activeSearchApp.name}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Carousel scrolls with page content — only the two header rows above stay fixed */}
      <div style={{ paddingTop: fixedHeaderHeightPx + 12 }}>
        {showAds && ads.length > 0 && !isDesktopHomeLayout && (
          <div className="bg-transparent px-4 pt-2 pb-3">
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-32 overflow-hidden">
                {ads.map((ad, index) => (
                  <a
                    key={`ad-${ad.id}-${index}`}
                    href={ad.url}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === currentAdIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <img
                      src={ad.image}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}

                {ads.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevAd}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 hover:bg-white rounded-full transition-all shadow-md hidden"
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      <ChevronLeft size={18} className="text-gray-700" />
                    </button>
                    <button
                      onClick={handleNextAd}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 hover:bg-white rounded-full transition-all shadow-md hidden"
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      <ChevronRight size={18} className="text-gray-700" />
                    </button>
                  </>
                )}
              </div>

              {ads.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {ads.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentAdIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentAdIndex ? 'bg-red-500 w-4' : 'bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      <AnimatePresence>
        {showProfileButton && showProfileModal && (
          <UserProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            userProfile={userProfile}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
            onProfileUpdate={(updates) => {
              if (!externalUserProfile) {
                setInternalUserProfile((prev) => (prev ? { ...prev, ...updates } : prev));
              }
              externalOnProfileUpdate?.(updates);
              try {
                const stored = localStorage.getItem('user');
                if (stored) {
                  const parsed = JSON.parse(stored);
                  localStorage.setItem('user', JSON.stringify({ ...parsed, ...updates }));
                }
              } catch {
                // ignore storage errors
              }
            }}
            appLogo={displayLogo}
            appName={appInfo?.apps_name || appInfo?.name || appName || 'My Group'}
          />
        )}
      </AnimatePresence>

      {/* App Settings Modal */}
      <AnimatePresence>
        {showSettingsButton && showAppSettingsModal && (
          <AppSettingsModal
            isOpen={showAppSettingsModal}
            onClose={() => setShowAppSettingsModal(false)}
            appLogo={displayLogo}
            appIcon={displayIcon}
            appName={appInfo?.apps_name || appInfo?.name || appName || 'App'}
          />
        )}
      </AnimatePresence>

      {/* More Apps Slide-in Modal (Right to Left) */}
      <AnimatePresence>
        {showMoreAppsModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[100] bg-black/50"
              onClick={() => setShowMoreAppsModal(false)}
            />

            {/* Slide-in Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed top-0 right-0 bottom-0 z-[101] w-[85%] max-w-sm ${
                darkMode ? 'bg-gray-900' : 'bg-white'
              } shadow-2xl overflow-y-auto`}
            >
              {/* Modal Header */}
              <div className={`sticky top-0 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-4 flex items-center justify-between`}>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>All Apps</h2>
                <button
                  onClick={() => setShowMoreAppsModal(false)}
                  className={`p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-full transition-colors`}
                >
                  <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>

              {/* Grouped Apps List */}
              <div className="p-4 space-y-6">
                {Object.entries(allGroupedApps).map(([groupName, apps]) => (
                  <div key={groupName}>
                    {/* Group Header */}
                    <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {groupName}
                    </h3>

                    {/* Apps Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {apps.map((app) => (
                        <a
                          key={`${groupName}-${app.id}-${app.name}`}
                          href={app.url}
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedApp(app);
                            setShowMoreAppsModal(false);
                            if (onTopIconClick) {
                              onTopIconClick(app);
                            } else {
                              guardedNavigate(app.url);
                            }
                          }}
                          className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                            selectedApp?.id === app.id
                              ? darkMode ? 'bg-teal-900/50' : 'bg-teal-50'
                              : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                          }`}
                        >
                          {app.icon ? (
                            <img
                              src={resolveAssetUrl(app.icon)}
                              alt={app.name}
                              className="w-10 h-10 rounded-full object-cover bg-white shadow-sm"
                            />
                          ) : app.logo ? (
                            <img
                              src={resolveAssetUrl(app.logo)}
                              alt={app.name}
                              className="w-10 h-10 rounded-full object-cover bg-white shadow-sm"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                              style={{ backgroundColor: app.background_color || '#14b8a6' }}
                            >
                              {app.name?.charAt(0) || 'A'}
                            </div>
                          )}
                          <span className={`text-xs mt-2 text-center truncate w-full ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {app.name}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {Object.keys(allGroupedApps).length === 0 && (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p>No apps available</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search results — thumbnail grid in main content area below header */}
      {!isDesktopVariant && showSearchInput && hasSearched && (
        <div
          className="fixed left-0 right-0 bottom-0 z-40 overflow-y-auto bg-gray-50"
          style={{ top: fixedHeaderHeightPx }}
        >
          <div className="p-4">
            {searchLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500" />
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                  {activeSearchApp?.name ? ` in ${activeSearchApp.name}` : ''}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {searchResults.map((result) => (
                    <button
                      key={String(result.id)}
                      type="button"
                      onClick={() => handleSearchResultClick(result)}
                      className="flex flex-col rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden text-left hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-square w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {result.imageUrl ? (
                          <img
                            src={result.imageUrl}
                            alt={result.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-gray-400">
                            {result.title.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="p-2.5 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{result.subtitle}</p>
                        )}
                        {result.meta && (
                          <span className="inline-block mt-1 text-[10px] font-medium uppercase tracking-wide text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            {result.meta}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <Search size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No results for &ldquo;{searchQuery}&rdquo;</p>
                <p className="text-xs mt-1 text-gray-400">
                  Try another term in {activeSearchApp?.name || 'this app'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

/** Fixed header height (top app bar + profile bar). Carousel is not included — it scrolls with content. */
export const getMobileHeaderHeight = (
  showTopIcons: boolean = true,
  _showAds: boolean = true,
  _hasAds: boolean = false,
  variant: 'mobile' | 'desktop' = 'mobile',
  desktopLayout: 'default' | 'home' = 'default',
  searchExpanded: boolean = false,
) => {
  if (variant === 'desktop' && desktopLayout === 'home') {
    // Row A (compact teal top-icons strip): 36px when visible
    // Row B (logo + two header ads):       80px
    // Row C (brand bar with icons):         52px
    const topIconsRow = showTopIcons ? 44 : 0; // Row A: w-10/h-10 icons + py-2 = ~44px
    return topIconsRow + 120 + 52; // Row A + Row B (120px) + Row C (52px)
  }
  if (variant === 'desktop' && !showTopIcons && !_showAds) {
    return 72;
  }
  let height = 0;
  if (showTopIcons) height += 60;
  height += variant === 'desktop' ? 72 : 56;
  if (searchExpanded && variant !== 'desktop') height += 52;
  return height;
};

export default MobileHeader;
