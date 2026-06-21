import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  X, Camera, Home, MapPin, Settings, FileText, HelpCircle, Share2, Download,
  Phone, Star, LogOut, ChevronRight, ChevronDown, Lock, Globe, DollarSign,
  Key, MessageCircle, Mail, Users, Building2, Map, Eye, EyeOff, ArrowLeft,
  Pencil, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL, resolveProfileImageUrl, WASABI_IMG_PROPS } from '../../config/api.config';
import { authAPI } from '../../services/api';
import { ProfilePhotoCropModal } from './ProfilePhotoCropModal';

// Interfaces
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
}

interface UserRegistrationData {
  gender?: string;
  nationality?: string;
  marital_status?: string;
  dob_date?: number;
  dob_month?: string;
  dob_year?: number;
  country?: number;
  state?: number;
  district?: number;
  education?: number;
  profession?: number;
  set_country?: number;
  set_state?: number;
  set_district?: number;
}

interface Country { id: number; country: string; nationality?: string; }
interface State { id: number; state: string; }
interface District { id: number; district: string; }
interface Education { id: number; education: string; }
interface Profession { id: number; profession: string; }

interface SocialLink {
  id: number;
  platform: string;
  url: string;
  icon?: string;
}

interface UserStats {
  global: number;
  national: number;
  regional: number;
  local: number;
}

interface DownloadApp {
  name: string;
  icon: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
}

interface Language {
  id: number;
  lang_1: string;
  lang_2?: string;
}

interface CurrencyOption {
  code: string;
  name: string;
  country: string;
}

interface LocationDisplay {
  country?: string;
  state?: string;
  district?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  isLoggedIn: boolean;
  onLogout: () => void;
  onProfileUpdate?: (updates: Partial<UserProfile>) => void;
  appLogo?: string;
  appName?: string;
}

type ProfileTab = 'profile' | 'address' | 'billing';
type ExpandedSection = 'settings' | 'legal' | 'help' | 'contact' | 'reviews' | null;
type SettingsSubView = 'security' | 'language' | 'currency' | 'password' | null;

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  isLoggedIn,
  onLogout,
  onProfileUpdate,
  appLogo,
  appName = 'My Group'
}) => {
  // Tab state
  // No tab selected by default; user must pick one.
  const [activeTab, setActiveTab] = useState<ProfileTab | null>(null);
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  
  // Form data states
  const [registrationData, setRegistrationData] = useState<UserRegistrationData>({});
  const [profileFormData, setProfileFormData] = useState<Partial<UserProfile>>({});
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [localProfileImg, setLocalProfileImg] = useState<string | null>(null);
  const [localProfileImgUrl, setLocalProfileImgUrl] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  
  // Location modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationData, setLocationData] = useState({ country: '', state: '', district: '' });
  const [locationStates, setLocationStates] = useState<State[]>([]);
  const [locationDistricts, setLocationDistricts] = useState<District[]>([]);
  const [locationSaving, setLocationSaving] = useState(false);
  const [userLocationDisplay, setUserLocationDisplay] = useState<LocationDisplay | null>(null);
  const [settingsSubView, setSettingsSubView] = useState<SettingsSubView>(null);

  // Settings state
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null);
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [securityPin, setSecurityPin] = useState('');
  const [confirmSecurityPin, setConfirmSecurityPin] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordFields, setShowPasswordFields] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const panelScrollRef = useRef<HTMLDivElement>(null);
  const tabsSectionRef = useRef<HTMLDivElement>(null);

  /** Scroll sidebar so Profile / Address / Billing tabs sit below the app header. */
  const scrollTabsToTop = useCallback(() => {
    requestAnimationFrame(() => {
      const panel = panelScrollRef.current;
      const tabsSection = tabsSectionRef.current;
      if (!panel || !tabsSection) return;

      const APP_HEADER_HEIGHT = 72;
      const delta =
        tabsSection.getBoundingClientRect().top -
        panel.getBoundingClientRect().top -
        APP_HEADER_HEIGHT;

      if (Math.abs(delta) > 2) {
        panel.scrollBy({ top: delta, behavior: 'smooth' });
      }
    });
  }, []);

  useEffect(() => {
    if (activeTab) scrollTabsToTop();
  }, [activeTab, scrollTabsToTop]);

  // Dropdown data
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [educationList, setEducationList] = useState<Education[]>([]);
  const [professionList, setProfessionList] = useState<Profession[]>([]);
  const [nationalityList, setNationalityList] = useState<string[]>([]);
  
  // Social links and stats
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ global: 0, national: 0, regional: 0, local: 0 });
  const [downloadApps, setDownloadApps] = useState<DownloadApp[]>([]);
  
  // Address form state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    address_line1: '', address_line2: '', city: '', country: '', state: '', pincode: ''
  });
  
  // Billing form state
  const [billingAddresses, setBillingAddresses] = useState<any[]>([]);
  const [showAddBillingForm, setShowAddBillingForm] = useState(false);
  const [newBilling, setNewBilling] = useState({
    billing_name: '', tax_no: '', address_line1: '', address_line2: '', city: '',
    country: '', state: '', pincode: ''
  });
  
  // Alternate number inline edit
  const [editingAlterNumber, setEditingAlterNumber] = useState(false);
  const [alterNumberInput, setAlterNumberInput] = useState('');
  const [alterNumberSaving, setAlterNumberSaving] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      setActiveTab(null);
      setExpandedSection(null);
      setSettingsSubView(null);
      setShowLocationModal(false);
      setShowCropModal(false);
      setCropImageSrc(null);
      fetchFormFields();
      fetchUserRegistrationData();
      fetchSocialLinks();
      fetchUserStats();
      fetchDownloadApps();
      fetchLanguages();
      fetchCurrencyOptions();
    }
  }, [isOpen, isLoggedIn]);

  useEffect(() => {
    if (showLocationModal) {
      const countryId = registrationData.set_country
        ? String(registrationData.set_country)
        : '';
      const stateId = registrationData.set_state
        ? String(registrationData.set_state)
        : '';
      const districtId = registrationData.set_district
        ? String(registrationData.set_district)
        : '';

      setLocationData({ country: countryId, state: stateId, district: districtId });

      if (countryId) {
        fetchLocationStates(parseInt(countryId, 10)).then(() => {
          if (stateId) {
            fetchLocationDistricts(parseInt(stateId, 10));
          }
        });
      } else {
        setLocationStates([]);
        setLocationDistricts([]);
      }
    }
  }, [showLocationModal, registrationData.set_country, registrationData.set_state, registrationData.set_district]);

  // Initialize profile form data and server-side profile image
  useEffect(() => {
    if (userProfile) {
      setProfileFormData({
        first_name: userProfile.first_name || '',
        display_name: userProfile.display_name || '',
        email: userProfile.email || ''
      });
      setAlterNumberInput(userProfile.alter_number || '');
      setLocalProfileImg(userProfile.profile_img || null);
      setLocalProfileImgUrl(userProfile.profile_img_url || null);
    }
  }, [userProfile]);

  // Clear stale pending uploads when the modal is opened
  useEffect(() => {
    if (!isOpen) return;
    setProfileImage(null);
    setProfileImagePreview(null);
  }, [isOpen]);

  const getProfileImageSrc = (): string | null => {
    if (profileImagePreview) return profileImagePreview;
    const imgPath = localProfileImg || userProfile?.profile_img;
    const imgUrl = localProfileImgUrl || userProfile?.profile_img_url;
    if (!imgPath && !imgUrl) return null;
    return resolveProfileImageUrl(imgPath, imgUrl);
  };

  const displayName =
    userProfile?.display_name || userProfile?.first_name || userProfile?.username || 'User';
  const profileImageSrc = getProfileImageSrc();

  // Fetch form field options
  const fetchFormFields = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const [countriesRes, educationRes, professionRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/countries`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/admin/education`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/admin/professions`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (countriesRes.data.success) setCountries(countriesRes.data.data || []);
      if (educationRes.data.success) setEducationList(educationRes.data.data || []);
      if (professionRes.data.success) setProfessionList(professionRes.data.data || []);

      // Extract unique, non-empty nationality values from country records
      const seen = new Set<string>();
      const nationalities: string[] = [];
      (countriesRes.data.data || []).forEach((c: Country) => {
        if (c.nationality && c.nationality.trim() && !seen.has(c.nationality)) {
          seen.add(c.nationality);
          nationalities.push(c.nationality);
        }
      });
      setNationalityList(nationalities.sort());
    } catch (error) {
      console.error('Error fetching form fields:', error);
    }
  };

  // Fetch user registration data from auth profile
  const fetchUserRegistrationData = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.data.success) {
        const userData = response.data.data;
        const profile = userData.profile || {};
        setRegistrationData({
          gender: profile.gender,
          nationality: profile.nationality,
          marital_status: profile.marital_status,
          dob_date: profile.dob_date,
          dob_month: profile.dob_month,
          dob_year: profile.dob_year,
          country: profile.country,
          state: profile.state,
          district: profile.district,
          education: profile.education,
          profession: profile.profession,
          set_country: profile.set_country,
          set_state: profile.set_state,
          set_district: profile.set_district
        });

        if (profile.setCountryData || profile.setStateData || profile.setDistrictData) {
          setUserLocationDisplay({
            country: profile.setCountryData?.country,
            state: profile.setStateData?.state,
            district: profile.setDistrictData?.district
          });
        }

        const prefs = profile.preferences || {};
        if (prefs.language_id) setSelectedLanguageId(prefs.language_id);
        if (prefs.currency) setSelectedCurrency(prefs.currency);

        if (profile.country) fetchStates(profile.country);
        if (profile.state) fetchDistricts(profile.state);
      }
    } catch (error) {
      console.error('Error fetching registration data:', error);
    }
  };

  const fetchLanguages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/mymedia/languages`);
      if (response.data.success) {
        setLanguages(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const fetchCurrencyOptions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/countries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const seen = new Set<string>();
        const options: CurrencyOption[] = [];
        (response.data.data || []).forEach((c: { country: string; currency?: string; currency_name?: string }) => {
          if (!c.currency || seen.has(c.currency)) return;
          seen.add(c.currency);
          options.push({
            code: c.currency,
            name: c.currency_name || c.currency,
            country: c.country
          });
        });
        setCurrencyOptions(options.sort((a, b) => a.code.localeCompare(b.code)));
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const fetchLocationStates = async (countryId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/geo/states/${countryId}`);
      if (response.data.success) {
        setLocationStates(response.data.data || []);
      }
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching location states:', error);
      return [];
    }
  };

  const fetchLocationDistricts = async (stateId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/geo/districts/${stateId}`);
      if (response.data.success) {
        setLocationDistricts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching location districts:', error);
    }
  };

  // Fetch states by country
  const fetchStates = async (countryId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/states?country_id=${countryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) setStates(response.data.data || []);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  // Fetch districts by state
  const fetchDistricts = async (stateId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/districts?state_id=${stateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) setDistricts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  // Fetch social links
  const fetchSocialLinks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/footer/social-media`);
      if (response.data.success) setSocialLinks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching social links:', error);
    }
  };

  // Fetch user stats (API returns totalRegisteredUsers, activeUsers, newUsersThisMonth)
  const fetchUserStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/member/user-stats`);
      if (response.data.success && response.data.data) {
        const d = response.data.data;
        if (typeof d.totalRegisteredUsers !== 'undefined' || typeof d.activeUsers !== 'undefined' || typeof d.newUsersThisMonth !== 'undefined') {
          setUserStats({
            global: Number(d.totalRegisteredUsers) || 0,
            national: Number(d.activeUsers) || 0,
            regional: Number(d.newUsersThisMonth) || 0,
            local: 0
          });
        } else {
          setUserStats({ global: d.global ?? 0, national: d.national ?? 0, regional: d.regional ?? 0, local: d.local ?? 0 });
        }
      }
    } catch (error) {
      setUserStats({ global: 0, national: 0, regional: 0, local: 0 });
    }
  };

  // Fetch download apps (API may return { ios, android } or array)
  const fetchDownloadApps = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/home/download-apps`);
      if (response.data.success && response.data.data) {
        const d = response.data.data;
        if (Array.isArray(d)) {
          setDownloadApps(d);
        } else if (d.android != null || d.ios != null) {
          setDownloadApps([
            { name: 'Google Play', icon: '', playStoreUrl: d.android || '#' },
            { name: 'App Store', icon: '', appStoreUrl: d.ios || '#' }
          ]);
        } else {
          setDownloadApps([]);
        }
      }
    } catch (error) {
      setDownloadApps([
        { name: 'Google Play', icon: '/images/google-play.png', playStoreUrl: 'https://play.google.com/store/apps' },
        { name: 'App Store', icon: '/images/app-store.png', appStoreUrl: 'https://apps.apple.com' }
      ]);
    }
  };

  const uploadProfilePhotoToServer = async (file: File, previewUrl: string) => {
    // Show local preview immediately while uploading
    setProfileImage(file);
    setProfileImagePreview(previewUrl);

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('profile_img', file, file.name);
      const response = await authAPI.uploadProfilePhoto(formData);

      if (response.data.success) {
        const newKey = response.data.data.profile_img as string;
        const newUrl = response.data.data.profile_img_url as string | undefined;
        setLocalProfileImg(newKey);
        setLocalProfileImgUrl(newUrl || null);
        setProfileImage(null);
        setProfileImagePreview(null);
        onProfileUpdate?.({ profile_img: newKey, profile_img_url: newUrl });
      }
    } catch (error) {
      console.error('Auto profile photo upload failed:', error);
      // Keep profileImage set so user can retry by clicking "Update Profile"
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Open crop editor after file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = (file: File, previewUrl: string) => {
    setShowCropModal(false);
    setCropImageSrc(null);
    uploadProfilePhotoToServer(file, previewUrl);
  };

  const handleUseOriginalPhoto = (file: File, previewUrl: string) => {
    setShowCropModal(false);
    setCropImageSrc(null);
    uploadProfilePhotoToServer(file, previewUrl);
  };

  const closeCropModal = () => {
    setShowCropModal(false);
    setCropImageSrc(null);
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    if (!userProfile?.id) {
      alert('User profile not loaded');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();

      formData.append('user_id', String(userProfile.id));
      Object.entries(profileFormData).forEach(([key, value]) => {
        if (value != null && value !== '' && key !== 'id') formData.append(key, value as string);
      });

      const registrationFields: (keyof UserRegistrationData)[] = [
        'gender', 'nationality', 'marital_status', 'dob_date', 'dob_month', 'dob_year',
        'country', 'state', 'district', 'education', 'profession'
      ];
      registrationFields.forEach((key) => {
        const value = registrationData[key];
        if (value != null && value !== '') {
          formData.append(key, String(value));
        }
      });

      if (profileImage) {
        formData.append('profile_img', profileImage, profileImage.name);
      }

      const response = await axios.put(`${API_BASE_URL}/member/update-profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const updatedFields: Partial<UserProfile> = { ...profileFormData };
        const serverProfileImg = response.data.data?.profile_img as string | undefined;
        const serverProfileImgUrl = response.data.data?.profile_img_url as string | undefined;

        if (serverProfileImg) {
          setLocalProfileImg(serverProfileImg);
          setLocalProfileImgUrl(serverProfileImgUrl || null);
          setProfileImagePreview(null);
          setProfileImage(null);
          updatedFields.profile_img = serverProfileImg;
          if (serverProfileImgUrl) updatedFields.profile_img_url = serverProfileImgUrl;
        } else if (profileImagePreview) {
          updatedFields.profile_img = localProfileImg || userProfile.profile_img;
        }

        if (response.data.data?.identification_code) {
          updatedFields.identification_code = response.data.data.identification_code;
        }

        onProfileUpdate?.(updatedFields);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAlterNumber = async () => {
    if (!userProfile?.id) return;
    setAlterNumberSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('user_id', String(userProfile.id));
      formData.append('alter_number', alterNumberInput);
      const response = await axios.put(`${API_BASE_URL}/member/update-profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        onProfileUpdate?.({ alter_number: alterNumberInput });
        setEditingAlterNumber(false);
      }
    } catch (error) {
      console.error('Error saving alternate number:', error);
      alert('Failed to save alternate number');
    } finally {
      setAlterNumberSaving(false);
    }
  };

  const handleTabSelect = (tab: ProfileTab) => {
    if (activeTab === tab) {
      setActiveTab(null);
      setShowAddAddressForm(false);
      setShowAddBillingForm(false);
      return;
    }

    setActiveTab(tab);
    setExpandedSection(null);
    setSettingsSubView(null);
    closeCropModal();
    setShowLocationModal(false);
    setShowAddAddressForm(false);
    setShowAddBillingForm(false);
  };

  const openLocationModal = () => {
    setSettingsSubView(null);
    setExpandedSection(null);
    setShowLocationModal(true);
  };

  // Handle set location
  const handleSetLocation = async () => {
    if (!locationData.country || !locationData.state || !locationData.district) {
      alert('Please select country, state, and district');
      return;
    }

    setLocationSaving(true);
    try {
      const response = await authAPI.updateLocation({
        set_country: parseInt(locationData.country, 10),
        set_state: parseInt(locationData.state, 10),
        set_district: parseInt(locationData.district, 10)
      });

      if (response.data.success) {
        const data = response.data.data;
        setRegistrationData((prev) => ({
          ...prev,
          set_country: data.set_country,
          set_state: data.set_state,
          set_district: data.set_district
        }));
        setUserLocationDisplay({
          country: data.setCountryData?.country,
          state: data.setStateData?.state,
          district: data.setDistrictData?.district
        });

        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem('user', JSON.stringify({
              ...parsed,
              profile: {
                ...(parsed.profile || {}),
                set_country: data.set_country,
                set_state: data.set_state,
                set_district: data.set_district,
                setCountryData: data.setCountryData,
                setStateData: data.setStateData,
                setDistrictData: data.setDistrictData
              }
            }));
          }
        } catch {
          // ignore storage errors
        }

        setShowLocationModal(false);
        alert('Location set successfully!');
      }
    } catch (error) {
      console.error('Error setting location:', error);
      alert('Failed to set location');
    } finally {
      setLocationSaving(false);
    }
  };

  const handleSaveSecurityPin = async () => {
    if (!/^\d{6}$/.test(securityPin)) {
      alert('Security PIN must be exactly 6 digits');
      return;
    }
    if (securityPin !== confirmSecurityPin) {
      alert('PIN and confirmation do not match');
      return;
    }

    setSettingsSaving(true);
    try {
      const response = await authAPI.updateSettings({ security_pin: securityPin });
      if (response.data.success) {
        alert('Security PIN set successfully!');
        setSecurityPin('');
        setConfirmSecurityPin('');
        setSettingsSubView(null);
      }
    } catch (error: unknown) {
      console.error('Error setting security PIN:', error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Failed to set security PIN');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSaveLanguage = async (languageId: number | null) => {
    setSelectedLanguageId(languageId);
    setSettingsSaving(true);
    try {
      const response = await authAPI.updateSettings({ language_id: languageId });
      if (response.data.success) {
        setSettingsSubView(null);
      }
    } catch (error) {
      console.error('Error saving language:', error);
      alert('Failed to save language preference');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSaveCurrency = async (currency: string) => {
    setSelectedCurrency(currency);
    setSettingsSaving(true);
    try {
      const response = await authAPI.updateSettings({ currency });
      if (response.data.success) {
        setSettingsSubView(null);
      }
    } catch (error) {
      console.error('Error saving currency:', error);
      alert('Failed to save currency preference');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setSettingsSaving(true);
    try {
      const response = await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (response.data.success) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setSettingsSubView(null);
          setPasswordMessage(null);
        }, 1500);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password'
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  const openSettingsSubView = (view: SettingsSubView) => {
    setSettingsSubView(view);
    setShowLocationModal(false);
    closeCropModal();
  };

  // Toggle section expansion
  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(expandedSection === section ? null : section);
    if (section === 'settings') {
      setSettingsSubView(null);
    }
  };

  // Get social icon component
  const getSocialIcon = (platform: string) => {
    const iconClass = "w-6 h-6";
    if (!platform) return <Globe className={iconClass} />;
    switch (platform.toLowerCase()) {
      case 'facebook': return <div className={`${iconClass} bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold`}>f</div>;
      case 'instagram': return <div className={`${iconClass} bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center text-white text-xs`}>📷</div>;
      case 'twitter': return <div className={`${iconClass} bg-sky-500 rounded-full flex items-center justify-center text-white text-xs font-bold`}>𝕏</div>;
      case 'youtube': return <div className={`${iconClass} bg-red-600 rounded-lg flex items-center justify-center text-white text-xs`}>▶</div>;
      case 'linkedin': return <div className={`${iconClass} bg-blue-700 rounded flex items-center justify-center text-white text-xs font-bold`}>in</div>;
      default: return <Globe className={iconClass} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black/50"
            onClick={onClose}
          />

          {/* Slide-in Panel from Left */}
          <motion.div
            ref={panelScrollRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-[101] w-[90%] max-w-md bg-white shadow-2xl overflow-y-auto"
          >
        {/* Header with App Logo */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-500 px-4 py-4 flex items-center justify-between z-[100]">
          <div className="flex items-center gap-3">
            {appLogo ? (
              <img src={appLogo.startsWith('http') ? appLogo : `${BACKEND_URL}${appLogo}`} alt="App" className="w-10 h-10 rounded-full object-contain bg-white p-1" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-teal-600 font-bold">
                {appName?.charAt(0) || 'M'}
              </div>
            )}
            <span className="text-white font-semibold text-lg">{appName}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="bg-gradient-to-b from-teal-500 to-teal-400 px-4 pb-5 pt-3">
          {/* Top Row: profile picture (left) + display name (right) */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white">
                {profileImageSrc ? (
                  <img
                    src={profileImageSrc}
                    alt="Profile"
                    {...WASABI_IMG_PROPS}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-teal-100 flex items-center justify-center">
                    <Users size={36} className="text-teal-500" />
                  </div>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => profileFileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50"
                aria-label="Change profile photo"
              >
                <Camera size={14} className="text-teal-600" />
              </button>
              <input
                ref={profileFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-lg leading-tight truncate">
                {userProfile?.first_name || displayName}
              </h3>
              {userProfile?.identification_code && (
                <p className="text-white/80 text-sm mt-0.5 truncate">
                  {userProfile.identification_code}
                </p>
              )}
            </div>
          </div>

          {/* Information Block */}
          <div className="mt-4 space-y-2 rounded-lg bg-white/10 px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white/70 shrink-0">Mobile Number:</span>
              <span className="text-white font-medium truncate">
                {userProfile?.username || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white/70 shrink-0">Alternative Number:</span>
              {editingAlterNumber ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={alterNumberInput}
                    onChange={(e) => setAlterNumberInput(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 min-w-0 px-2 py-0.5 text-sm rounded border border-white/40 bg-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white"
                    placeholder="Enter number"
                    maxLength={15}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveAlterNumber}
                    disabled={alterNumberSaving}
                    className="p-1 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50"
                    title="Save"
                  >
                    <Check size={14} className="text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingAlterNumber(false); setAlterNumberInput(userProfile?.alter_number || ''); }}
                    className="p-1 rounded-full bg-white/20 hover:bg-white/30"
                    title="Cancel"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-white font-medium truncate">
                    {userProfile?.alter_number || alterNumberInput || '—'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setAlterNumberInput(userProfile?.alter_number || alterNumberInput || ''); setEditingAlterNumber(true); }}
                    className="p-1 rounded-full hover:bg-white/20 flex-shrink-0"
                    title="Edit alternative number"
                  >
                    <Pencil size={13} className="text-white/70" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs — scroll target when a tab is opened */}
        <div ref={tabsSectionRef}>
        <div className="flex border-b border-gray-200 bg-white sticky top-[72px] z-10">
          {(['profile', 'address', 'billing'] as ProfileTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabSelect(tab)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        </div>

        {/* Tab Content (render only after a tab is selected) */}
        {activeTab && (
        <div className="p-4">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {uploadingPhoto && (
                <div className="px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-800 flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Uploading profile photo to cloud storage…
                </div>
              )}
              {!uploadingPhoto && profileImage && (
                <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  Photo upload failed. Click <strong>Update Profile</strong> to retry.
                </div>
              )}

              {/* 1. Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={profileFormData.display_name || ''}
                  onChange={(e) => setProfileFormData({ ...profileFormData, display_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* 2. Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileFormData.first_name || ''}
                  onChange={(e) => setProfileFormData({ ...profileFormData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profileFormData.email || ''}
                  onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* 3. Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={registrationData.dob_date || ''}
                    onChange={(e) => setRegistrationData({ ...registrationData, dob_date: parseInt(e.target.value) })}
                    className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={registrationData.dob_month || ''}
                    onChange={(e) => setRegistrationData({ ...registrationData, dob_month: e.target.value })}
                    className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Month</option>
                    {[
                      { value: '01', label: 'January' },
                      { value: '02', label: 'February' },
                      { value: '03', label: 'March' },
                      { value: '04', label: 'April' },
                      { value: '05', label: 'May' },
                      { value: '06', label: 'June' },
                      { value: '07', label: 'July' },
                      { value: '08', label: 'August' },
                      { value: '09', label: 'September' },
                      { value: '10', label: 'October' },
                      { value: '11', label: 'November' },
                      { value: '12', label: 'December' },
                    ].map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    value={registrationData.dob_year || ''}
                    onChange={(e) => setRegistrationData({ ...registrationData, dob_year: parseInt(e.target.value) })}
                    className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={registrationData.gender || ''}
                  onChange={(e) => setRegistrationData({ ...registrationData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* 5. Marital Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                <select
                  value={registrationData.marital_status || ''}
                  onChange={(e) => setRegistrationData({ ...registrationData, marital_status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select Marital Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              {/* 6. Nationality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <select
                  value={registrationData.nationality || ''}
                  onChange={(e) => setRegistrationData({ ...registrationData, nationality: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select Nationality</option>
                  {nationalityList.map((nat) => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                </select>
              </div>

              {/* 7. Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={registrationData.country || ''}
                  onChange={(e) => {
                    const countryId = e.target.value ? parseInt(e.target.value) : undefined;
                    setRegistrationData({ ...registrationData, country: countryId, state: undefined, district: undefined });
                    setStates([]);
                    setDistricts([]);
                    if (countryId) fetchStates(countryId);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.country}</option>
                  ))}
                </select>
              </div>

              {/* 8. State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  value={registrationData.state || ''}
                  onChange={(e) => {
                    const stateId = e.target.value ? parseInt(e.target.value) : undefined;
                    setRegistrationData({ ...registrationData, state: stateId, district: undefined });
                    setDistricts([]);
                    if (stateId) fetchDistricts(stateId);
                  }}
                  disabled={!registrationData.country}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>{s.state}</option>
                  ))}
                </select>
              </div>

              {/* 9. District */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <select
                  value={registrationData.district || ''}
                  onChange={(e) => {
                    const districtId = e.target.value ? parseInt(e.target.value) : undefined;
                    setRegistrationData({ ...registrationData, district: districtId });
                  }}
                  disabled={!registrationData.state}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                >
                  <option value="">Select District</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.district}</option>
                  ))}
                </select>
              </div>

              {/* 10. Education */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                <select
                  value={registrationData.education || ''}
                  onChange={(e) => setRegistrationData({ ...registrationData, education: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select Education</option>
                  {educationList.map((edu) => (
                    <option key={edu.id} value={edu.id}>{edu.education}</option>
                  ))}
                </select>
              </div>

              {/* 11. Profession */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                <select
                  value={registrationData.profession || ''}
                  onChange={(e) => setRegistrationData({ ...registrationData, profession: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select Profession</option>
                  {professionList.map((prof) => (
                    <option key={prof.id} value={prof.id}>{prof.profession}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleProfileUpdate}
                disabled={saving}
                className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 mt-4"
              >
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          )}

          {/* Address Tab */}
          {activeTab === 'address' && (
            <div className="space-y-4">
              {addresses.length > 0 && (
                <div className="space-y-3">
                  {addresses.map((addr, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-800">{addr.address_line1}</p>
                      <p className="text-xs text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                  ))}
                </div>
              )}

              {!showAddAddressForm ? (
                <button
                  onClick={() => setShowAddAddressForm(true)}
                  className="w-full py-3 border-2 border-dashed border-teal-500 text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-colors"
                >
                  + Add New Address
                </button>
              ) : (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800">New Address</h4>
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={newAddress.address_line1}
                    onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 2"
                    value={newAddress.address_line2}
                    onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <select
                    value={newAddress.country}
                    onChange={(e) => {
                      setNewAddress({ ...newAddress, country: e.target.value, state: '' });
                      fetchStates(parseInt(e.target.value));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Country</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>{c.country}</option>
                    ))}
                  </select>
                  <select
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select State</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>{s.state}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddAddressForm(false)}
                      className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setAddresses([...addresses, newAddress]);
                        setNewAddress({ address_line1: '', address_line2: '', city: '', country: '', state: '', pincode: '' });
                        setShowAddAddressForm(false);
                      }}
                      className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      Save Address
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              {billingAddresses.length > 0 && (
                <div className="space-y-3">
                  {billingAddresses.map((bill, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-800">{bill.billing_name}</p>
                      <p className="text-xs text-gray-500">Tax No: {bill.tax_no}</p>
                      <p className="text-xs text-gray-500">{bill.address_line1}, {bill.city} - {bill.pincode}</p>
                    </div>
                  ))}
                </div>
              )}

              {!showAddBillingForm ? (
                <button
                  onClick={() => setShowAddBillingForm(true)}
                  className="w-full py-3 border-2 border-dashed border-teal-500 text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-colors"
                >
                  + Add New Billing Address
                </button>
              ) : (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800">New Billing Address</h4>
                  <input
                    type="text"
                    placeholder="Billing Name"
                    value={newBilling.billing_name}
                    onChange={(e) => setNewBilling({ ...newBilling, billing_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    placeholder="Tax Number"
                    value={newBilling.tax_no}
                    onChange={(e) => setNewBilling({ ...newBilling, tax_no: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={newBilling.address_line1}
                    onChange={(e) => setNewBilling({ ...newBilling, address_line1: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 2"
                    value={newBilling.address_line2}
                    onChange={(e) => setNewBilling({ ...newBilling, address_line2: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={newBilling.city}
                      onChange={(e) => setNewBilling({ ...newBilling, city: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={newBilling.pincode}
                      onChange={(e) => setNewBilling({ ...newBilling, pincode: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <select
                    value={newBilling.country}
                    onChange={(e) => {
                      setNewBilling({ ...newBilling, country: e.target.value, state: '' });
                      fetchStates(parseInt(e.target.value));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Country</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>{c.country}</option>
                    ))}
                  </select>
                  <select
                    value={newBilling.state}
                    onChange={(e) => setNewBilling({ ...newBilling, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select State</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>{s.state}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddBillingForm(false)}
                      className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setBillingAddresses([...billingAddresses, newBilling]);
                        setNewBilling({ billing_name: '', tax_no: '', address_line1: '', address_line2: '', city: '', country: '', state: '', pincode: '' });
                        setShowAddBillingForm(false);
                      }}
                      className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      Save Billing
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Menu Items */}
        <div className="border-t border-gray-200 px-4 py-4 space-y-1">
          {/* Home */}
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Home size={20} className="text-gray-600" />
            <span className="text-gray-800">Home</span>
          </Link>

          {/* Set Location */}
          <button
            type="button"
            onClick={openLocationModal}
            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
          >
            <MapPin size={20} className="text-gray-600" />
            <div className="flex-1 min-w-0">
              <span className="text-gray-800 block">Set Location</span>
              {userLocationDisplay?.country && (
                <span className="text-xs text-gray-500 truncate block">
                  {[userLocationDisplay.country, userLocationDisplay.state, userLocationDisplay.district].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
            <ChevronRight size={18} className="text-gray-400 ml-auto flex-shrink-0" />
          </button>

          {/* Settings - Expandable */}
          <div>
            <button
              onClick={() => toggleSection('settings')}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <Settings size={20} className="text-gray-600" />
              <span className="text-gray-800">Settings</span>
              {expandedSection === 'settings' ? (
                <ChevronDown size={18} className="text-gray-400 ml-auto" />
              ) : (
                <ChevronRight size={18} className="text-gray-400 ml-auto" />
              )}
            </button>
            <AnimatePresence>
              {expandedSection === 'settings' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pl-10 space-y-1"
                >
                  <button
                    type="button"
                    onClick={() => openSettingsSubView('security')}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left"
                  >
                    <Lock size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Set Security</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openSettingsSubView('language')}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left"
                  >
                    <Globe size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">
                      Change Language
                      {selectedLanguageId && languages.find((l) => l.id === selectedLanguageId) && (
                        <span className="text-gray-400 ml-1">
                          ({languages.find((l) => l.id === selectedLanguageId)?.lang_1})
                        </span>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openSettingsSubView('currency')}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left"
                  >
                    <DollarSign size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">
                      Change Currency
                      {selectedCurrency && (
                        <span className="text-gray-400 ml-1">({selectedCurrency})</span>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openSettingsSubView('password')}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left"
                  >
                    <Key size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Change Password</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Legal - Expandable */}
          <div>
            <button
              onClick={() => toggleSection('legal')}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <FileText size={20} className="text-gray-600" />
              <span className="text-gray-800">Legal</span>
              {expandedSection === 'legal' ? (
                <ChevronDown size={18} className="text-gray-400 ml-auto" />
              ) : (
                <ChevronRight size={18} className="text-gray-400 ml-auto" />
              )}
            </button>
            <AnimatePresence>
              {expandedSection === 'legal' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pl-10 space-y-1"
                >
                  <Link to="/terms" onClick={onClose} className="block px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700">
                    Terms and Conditions
                  </Link>
                  <Link to="/privacy" onClick={onClose} className="block px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700">
                    Privacy Policy
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Help & Support - Expandable */}
          <div>
            <button
              onClick={() => toggleSection('help')}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <HelpCircle size={20} className="text-gray-600" />
              <span className="text-gray-800">Help & Support</span>
              {expandedSection === 'help' ? (
                <ChevronDown size={18} className="text-gray-400 ml-auto" />
              ) : (
                <ChevronRight size={18} className="text-gray-400 ml-auto" />
              )}
            </button>
            <AnimatePresence>
              {expandedSection === 'help' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pl-10 space-y-1"
                >
                  <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left">
                    <MessageCircle size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Feedback & Suggestions</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left">
                    <MessageCircle size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Live Chat</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left">
                    <Mail size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Enquiry</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Share App */}
          <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left">
            <Share2 size={20} className="text-gray-600" />
            <span className="text-gray-800">Share App</span>
          </button>

          {/* Download Apps */}
          <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left">
            <Download size={20} className="text-gray-600" />
            <span className="text-gray-800">Download Apps</span>
          </button>

          {/* Contact Us */}
          <Link
            to="/contact"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Phone size={20} className="text-gray-600" />
            <span className="text-gray-800">Contact Us</span>
          </Link>

          {/* Review and Ratings */}
          <button className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left">
            <Star size={20} className="text-gray-600" />
            <span className="text-gray-800">Review and Ratings</span>
          </button>

          {/* Logout */}
          {isLoggedIn && (
            <button
              onClick={() => { onLogout(); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-red-50 rounded-lg transition-colors text-left mt-4"
            >
              <LogOut size={20} className="text-red-600" />
              <span className="text-red-600 font-medium">Logout</span>
            </button>
          )}
        </div>

        {/* Total Users Section */}
        <div className="border-t border-gray-200 px-4 py-4 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users size={18} className="text-teal-600" />
            Total Users
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Globe size={14} className="text-blue-500" />
                <span className="text-xs text-gray-500">Global</span>
              </div>
              <p className="text-lg font-bold text-gray-800">{(userStats.global ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Building2 size={14} className="text-green-500" />
                <span className="text-xs text-gray-500">National</span>
              </div>
              <p className="text-lg font-bold text-gray-800">{(userStats.national ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Map size={14} className="text-orange-500" />
                <span className="text-xs text-gray-500">Regional</span>
              </div>
              <p className="text-lg font-bold text-gray-800">{(userStats.regional ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MapPin size={14} className="text-purple-500" />
                <span className="text-xs text-gray-500">Local</span>
              </div>
              <p className="text-lg font-bold text-gray-800">{(userStats.local ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Follow Us Section */}
        <div className="border-t border-gray-200 px-4 py-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Follow Us</h4>
          <div className="flex gap-3 flex-wrap">
            {socialLinks.length > 0 ? (
              socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {getSocialIcon(link.platform)}
                </a>
              ))
            ) : (
              ['facebook', 'instagram', 'twitter', 'youtube', 'linkedin'].map((platform) => (
                <button
                  key={platform}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {getSocialIcon(platform)}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Download the App Section */}
        <div className="border-t border-gray-200 px-4 py-4 pb-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Download the App</h4>
          <div className="flex gap-3">
            <a
              href="#"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="text-2xl">▶</div>
              <div className="text-left">
                <p className="text-[10px] opacity-80">GET IT ON</p>
                <p className="text-sm font-medium">Google Play</p>
              </div>
            </a>
            <a
              href="#"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="text-2xl">🍎</div>
              <div className="text-left">
                <p className="text-[10px] opacity-80">Download on the</p>
                <p className="text-sm font-medium">App Store</p>
              </div>
            </a>
          </div>
        </div>
      </motion.div>

      {/* Set Location Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4"
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
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                <select
                  value={locationData.country}
                  onChange={(e) => {
                    const countryId = e.target.value;
                    setLocationData({ country: countryId, state: '', district: '' });
                    setLocationDistricts([]);
                    if (countryId) fetchLocationStates(parseInt(countryId, 10));
                    else setLocationStates([]);
                  }}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-teal-500 focus:outline-none transition-colors"
                >
                  <option value="">Select Country</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.country}</option>
                  ))}
                </select>
              </div>

              {locationData.country && (
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                  <select
                    value={locationData.state}
                    onChange={(e) => {
                      const stateId = e.target.value;
                      setLocationData((prev) => ({ ...prev, state: stateId, district: '' }));
                      if (stateId) fetchLocationDistricts(parseInt(stateId, 10));
                      else setLocationDistricts([]);
                    }}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-teal-500 focus:outline-none transition-colors"
                  >
                    <option value="">Select State</option>
                    {locationStates.map((s) => (
                      <option key={s.id} value={s.id}>{s.state}</option>
                    ))}
                  </select>
                </div>
              )}

              {locationData.state && (
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                  <select
                    value={locationData.district}
                    onChange={(e) => setLocationData((prev) => ({ ...prev, district: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-teal-500 focus:outline-none transition-colors"
                  >
                    <option value="">Select District</option>
                    {locationDistricts.map((d) => (
                      <option key={d.id} value={d.id}>{d.district}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSetLocation}
                  disabled={locationSaving || !locationData.country || !locationData.state || !locationData.district}
                  className="flex-1 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 font-semibold shadow-md transition-all"
                >
                  {locationSaving ? 'Saving...' : 'Apply'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Sub-views */}
      <AnimatePresence>
        {settingsSubView === 'security' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4"
            onClick={() => setSettingsSubView(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-5">
                <button type="button" onClick={() => setSettingsSubView(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <ArrowLeft size={18} className="text-gray-600" />
                </button>
                <h3 className="font-bold text-lg text-gray-900">Set Security PIN</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">Create a 6-digit PIN for additional account security.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={securityPin}
                    onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none tracking-widest text-center text-lg"
                    placeholder="••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={confirmSecurityPin}
                    onChange={(e) => setConfirmSecurityPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none tracking-widest text-center text-lg"
                    placeholder="••••••"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveSecurityPin}
                  disabled={settingsSaving || securityPin.length !== 6 || confirmSecurityPin.length !== 6}
                  className="w-full py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 font-semibold"
                >
                  {settingsSaving ? 'Saving...' : 'Save PIN'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {settingsSubView === 'language' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4"
            onClick={() => setSettingsSubView(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[70vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <button type="button" onClick={() => setSettingsSubView(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <ArrowLeft size={18} className="text-gray-600" />
                </button>
                <h3 className="font-bold text-lg text-gray-900">Select Language</h3>
              </div>
              <button
                type="button"
                onClick={() => handleSaveLanguage(null)}
                disabled={settingsSaving}
                className={`w-full text-left px-4 py-3 rounded-xl mb-2 font-medium transition-all ${
                  selectedLanguageId === null ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Default (System)
              </button>
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => handleSaveLanguage(lang.id)}
                  disabled={settingsSaving}
                  className={`w-full text-left px-4 py-3 rounded-xl mb-2 font-medium transition-all ${
                    selectedLanguageId === lang.id ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {lang.lang_1}{lang.lang_2 ? ` (${lang.lang_2})` : ''}
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}

        {settingsSubView === 'currency' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4"
            onClick={() => setSettingsSubView(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[70vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <button type="button" onClick={() => setSettingsSubView(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <ArrowLeft size={18} className="text-gray-600" />
                </button>
                <h3 className="font-bold text-lg text-gray-900">Select Currency</h3>
              </div>
              {currencyOptions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No currencies available</p>
              ) : (
                currencyOptions.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleSaveCurrency(item.code)}
                    disabled={settingsSaving}
                    className={`w-full text-left px-4 py-3 rounded-xl mb-2 font-medium transition-all ${
                      selectedCurrency === item.code ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="font-semibold">{item.code}</span>
                    <span className="block text-sm opacity-80">{item.name} — {item.country}</span>
                  </button>
                ))
              )}
            </motion.div>
          </motion.div>
        )}

        {settingsSubView === 'password' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4"
            onClick={() => setSettingsSubView(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-5">
                <button type="button" onClick={() => setSettingsSubView(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <ArrowLeft size={18} className="text-gray-600" />
                </button>
                <h3 className="font-bold text-lg text-gray-900">Change Password</h3>
              </div>

              {passwordMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {passwordMessage.text}
                </div>
              )}

              <div className="space-y-4">
                {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field, idx) => {
                  const labels = ['Old Password', 'New Password', 'Confirm Password'];
                  const visibilityKey = (['current', 'new', 'confirm'] as const)[idx];
                  return (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{labels[idx]}</label>
                      <div className="relative">
                        <input
                          type={showPasswordFields[visibilityKey] ? 'text' : 'password'}
                          value={passwordForm[field]}
                          onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                          className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordFields({ ...showPasswordFields, [visibilityKey]: !showPasswordFields[visibilityKey] })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswordFields[visibilityKey] ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={settingsSaving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="w-full py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 font-semibold"
                >
                  {settingsSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile photo crop editor */}
      {cropImageSrc && (
        <ProfilePhotoCropModal
          isOpen={showCropModal}
          imageSrc={cropImageSrc}
          onClose={closeCropModal}
          onConfirm={handleCropConfirm}
          onUseOriginal={handleUseOriginalPhoto}
        />
      )}
        </>
      )}
    </AnimatePresence>
  );
};
