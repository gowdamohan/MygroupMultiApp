import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  X, Camera, Home, MapPin, Settings, FileText, HelpCircle, Share2, Download,
  Phone, Star, LogOut, ChevronRight, ChevronDown, Lock, Globe, DollarSign,
  Key, MessageCircle, Mail, Users, Building2, Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

// Interfaces
interface UserProfile {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone?: string;
  profile_img?: string;
  identification_code?: string;
  alter_number?: string;
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

interface Country { id: number; country: string; }
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

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  isLoggedIn: boolean;
  onLogout: () => void;
  appLogo?: string;
  appName?: string;
}

type ProfileTab = 'profile' | 'address' | 'billing';
type ExpandedSection = 'settings' | 'legal' | 'help' | 'contact' | 'reviews' | null;

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  isLoggedIn,
  onLogout,
  appLogo,
  appName = 'My Group'
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  
  // Form data states
  const [registrationData, setRegistrationData] = useState<UserRegistrationData>({});
  const [profileFormData, setProfileFormData] = useState<Partial<UserProfile>>({});
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  
  // Location modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationData, setLocationData] = useState({ country: '', state: '', district: '' });
  
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
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      fetchFormFields();
      fetchUserRegistrationData();
      fetchSocialLinks();
      fetchUserStats();
      fetchDownloadApps();
    }
  }, [isOpen, isLoggedIn]);

  // Initialize profile form data
  useEffect(() => {
    if (userProfile) {
      setProfileFormData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        display_name: userProfile.display_name || '',
        email: userProfile.email || '',
        alter_number: userProfile.alter_number || ''
      });
    }
  }, [userProfile]);

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

      // Set nationality list from countries
      const nationalities = (countriesRes.data.data || []).map((c: Country) => c.country);
      setNationalityList(nationalities);
    } catch (error) {
      console.error('Error fetching form fields:', error);
    }
  };

  // Fetch user registration data
  const fetchUserRegistrationData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/member/registration-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setRegistrationData(response.data.data || {});
        // Fetch states if country is set
        if (response.data.data?.country) {
          fetchStates(response.data.data.country);
        }
        if (response.data.data?.state) {
          fetchDistricts(response.data.data.state);
        }
      }
    } catch (error) {
      console.error('Error fetching registration data:', error);
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

  // Handle profile image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfileImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
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

      if (profileImage) formData.append('profile_img', profileImage);

      await axios.put(`${API_BASE_URL}/member/update-profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle set location
  const handleSetLocation = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${API_BASE_URL}/member/set-location`, {
        set_country: locationData.country,
        set_state: locationData.state,
        set_district: locationData.district
      }, { headers: { Authorization: `Bearer ${token}` } });

      setShowLocationModal(false);
      alert('Location set successfully!');
    } catch (error) {
      console.error('Error setting location:', error);
      alert('Failed to set location');
    } finally {
      setSaving(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Get social icon component
  const getSocialIcon = (platform: string) => {
    const iconClass = "w-6 h-6";
    switch (platform.toLowerCase()) {
      case 'facebook': return <div className={`${iconClass} bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold`}>f</div>;
      case 'instagram': return <div className={`${iconClass} bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center text-white text-xs`}>📷</div>;
      case 'twitter': return <div className={`${iconClass} bg-sky-500 rounded-full flex items-center justify-center text-white text-xs font-bold`}>𝕏</div>;
      case 'youtube': return <div className={`${iconClass} bg-red-600 rounded-lg flex items-center justify-center text-white text-xs`}>▶</div>;
      case 'linkedin': return <div className={`${iconClass} bg-blue-700 rounded flex items-center justify-center text-white text-xs font-bold`}>in</div>;
      default: return <Globe className={iconClass} />;
    }
  };

  if (!isOpen) return null;

  return (
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
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-0 left-0 bottom-0 z-[101] w-[90%] max-w-md bg-white shadow-2xl overflow-y-auto"
      >
        {/* Header with App Logo */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-500 px-4 py-4 flex items-center justify-between z-10">
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
        <div className="bg-gradient-to-b from-teal-500 to-teal-400 px-4 pb-6 pt-2">
          <div className="flex flex-col items-center">
            {/* Profile Image with Upload */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white">
                {profileImagePreview || userProfile?.profile_img ? (
                  <img
                    src={profileImagePreview || (userProfile?.profile_img?.startsWith('http') ? userProfile.profile_img : `${BACKEND_URL}${userProfile?.profile_img}`)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-teal-100 flex items-center justify-center">
                    <Users size={40} className="text-teal-500" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Camera size={16} className="text-teal-600" />
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>

            {/* User Name */}
            <h3 className="text-white font-semibold text-xl mt-3">
              {userProfile?.display_name || userProfile?.first_name || userProfile?.username || 'User'}
            </h3>

            {/* ID */}
            {userProfile?.identification_code && (
              <p className="text-white/80 text-sm mt-1">ID: {userProfile.identification_code}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white sticky top-[72px] z-10">
          {(['profile', 'address', 'billing'] as ProfileTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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

        {/* Tab Content */}
        <div className="p-4">
          {/* Profile Tab - Combined Profile and Personal fields */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Basic Profile Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number (Username)</label>
                <input
                  type="text"
                  value={userProfile?.username || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Mobile number cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={profileFormData.display_name || ''}
                  onChange={(e) => setProfileFormData({ ...profileFormData, display_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={profileFormData.first_name || ''}
                    onChange={(e) => setProfileFormData({ ...profileFormData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profileFormData.last_name || ''}
                    onChange={(e) => setProfileFormData({ ...profileFormData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profileFormData.email || ''}
                  onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Number</label>
                <input
                  type="tel"
                  value={profileFormData.alter_number || ''}
                  onChange={(e) => setProfileFormData({ ...profileFormData, alter_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Personal Information Fields */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={registrationData.gender || ''}
                    onChange={(e) => setRegistrationData({ ...registrationData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                  <select
                    value={registrationData.marital_status || ''}
                    onChange={(e) => setRegistrationData({ ...registrationData, marital_status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>
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
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                      <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                  <select
                    value={registrationData.education || ''}
                    onChange={(e) => setRegistrationData({ ...registrationData, education: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select</option>
                    {educationList.map((edu) => (
                      <option key={edu.id} value={edu.id}>{edu.education}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                  <select
                    value={registrationData.profession || ''}
                    onChange={(e) => setRegistrationData({ ...registrationData, profession: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select</option>
                    {professionList.map((prof) => (
                      <option key={prof.id} value={prof.id}>{prof.profession}</option>
                    ))}
                  </select>
                </div>
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
            onClick={() => setShowLocationModal(true)}
            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
          >
            <MapPin size={20} className="text-gray-600" />
            <span className="text-gray-800">Set Location</span>
            <ChevronRight size={18} className="text-gray-400 ml-auto" />
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
                  <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left">
                    <Lock size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Set Security</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left">
                    <Globe size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Change Language</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left">
                    <DollarSign size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700">Change Currency</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left">
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
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[102] bg-black/50"
              onClick={() => setShowLocationModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[103] mx-auto max-w-sm bg-white rounded-xl shadow-2xl p-5"
              style={{ maxHeight: 'calc(100vh - 40px)' }}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-teal-600" />
                Set Your Location
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    value={locationData.country}
                    onChange={(e) => {
                      setLocationData({ ...locationData, country: e.target.value, state: '', district: '' });
                      fetchStates(parseInt(e.target.value));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Country</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>{c.country}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    value={locationData.state}
                    onChange={(e) => {
                      setLocationData({ ...locationData, state: e.target.value, district: '' });
                      fetchDistricts(parseInt(e.target.value));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select State</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>{s.state}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <select
                    value={locationData.district}
                    onChange={(e) => setLocationData({ ...locationData, district: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>{d.district}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowLocationModal(false)}
                    className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSetLocation}
                    disabled={saving}
                    className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Submit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default UserProfileModal;
