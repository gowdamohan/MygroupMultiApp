import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Sun, Moon, Settings, MoreHorizontal, X, Camera,
  Lock, Globe, DollarSign, Key, FileText, Shield,
  HelpCircle, MessageCircle, Phone, Share2, Download,
  Star, LogOut, Users, MapPin, Building2, Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { HomeData } from '../../types/home.types';
import { AuthModal } from '../../components/AuthModal';
import { authAPI } from '../../services/api';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';
import { MobileHeader, TopIcon, getMobileHeaderHeight } from '../../components/mobile/MobileHeader';

interface App {
  id: number;
  name: string;
  apps_name: string;
  details?: {
    icon?: string;
    logo?: string;
    name_image?: string;
  };
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name?: string;
  display_name?: string;
  phone: string;
  profile_img?: string;
  identification_code?: string;
}

export const MobileHomePage: React.FC = () => {
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMoreAppsModal, setShowMoreAppsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [allApps, setAllApps] = useState<App[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileTab, setProfileTab] = useState<'profile' | 'personal' | 'address'>('profile');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    if (!token) {
      setShowAuthModal(true);
      setIsLoggedIn(false);
    } else {
      setIsLoggedIn(true);
      if (user) {
        setUserProfile(JSON.parse(user));
      }
      fetchUserProfile();
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
    fetchTestimonials();
    if (isLoggedIn) {
      fetchAllApps();
    }
  }, [isLoggedIn]);

  const fetchHomeData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/home/mobile-data`);
      if (response.data.success) {
        setHomeData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllApps = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/groups`);
      if (response.data.success) {
        setAllApps(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching all apps:', error);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/testimonials`);
      if (response.data.success) {
        setTestimonials(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      console.log('User profile:', response.data.data);
      if (response.data.success) {
        const userData = response.data.data;
        setUserProfile(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Set user location if available
        if (userData.profile) {
          setUserLocation(userData.profile);
          if (userData.profile.set_country) {
            setSelectedCountry(userData.profile.set_country.toString());
          }
          if (userData.profile.set_state) {
            setSelectedState(userData.profile.set_state.toString());
          }
          if (userData.profile.set_district) {
            setSelectedDistrict(userData.profile.set_district.toString());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  // Handle top icon click from MobileHeader
  const handleTopIconClick = (icon: TopIcon) => {
    // Navigate to the app page
    if (icon.url) {
      window.location.href = icon.url;
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API if available
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage and state regardless of API call result
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      setUserProfile(null);
      setUserLocation(null);
      setShowProfileModal(false);
      setShowLocationModal(false);
      setShowAuthModal(true);
      
      // Reset location state
      setSelectedCountry('');
      setSelectedState('');
      setSelectedDistrict('');
      setCountries([]);
      setStates([]);
      setDistricts([]);
    }
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
      // TODO: Upload to server
    }
  };

  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/countries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCountries(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchStates = async (countryId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/states?countryId=${countryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchDistricts = async (stateId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/admin/districts?stateId=${stateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setDistricts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const handleLocationUpdate = async () => {
    if (!selectedCountry || !selectedState || !selectedDistrict) {
      alert('Please select all location fields');
      return;
    }

    setLocationLoading(true);
    try {
      const response = await authAPI.updateLocation({
        set_country: parseInt(selectedCountry),
        set_state: parseInt(selectedState),
        set_district: parseInt(selectedDistrict)
      });

      if (response.data.success) {
        alert('Location updated successfully!');
        setUserLocation(response.data.data);
        setShowLocationModal(false);
        // Refresh profile to get updated location data with associations
        await fetchUserProfile();
      }
    } catch (error: any) {
      console.error('Error updating location:', error);
      if (error?.response?.status === 429) {
        alert('Too many requests. Please wait a moment and try again.');
      } else {
        alert('Failed to update location');
      }
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    if (profileTab === 'profile' && showProfileModal) {
        fetchCountries();
      }
  }, [profileTab, showProfileModal]);

  useEffect(() => {
    if (showLocationModal) {
      fetchCountries();
    }
  }, [showLocationModal]);

  useEffect(() => {
    if (selectedCountry) {
      fetchStates(selectedCountry);
      setSelectedState('');
      setSelectedDistrict('');
      setDistricts([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState) {
      fetchDistricts(selectedState);
      setSelectedDistrict('');
    }
  }, [selectedState]);

  // Auto-rotate testimonials
  useEffect(() => {
    if (testimonials.length > 1) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [testimonials.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!homeData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <>
      {/* Auth Modal - Cannot be closed until user logs in */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        allowClose={false}
      />

      <div className={`mobile-home ${darkMode ? 'dark-mode' : ''}`}>
        {/* Redesigned Mobile Header */}
        <MobileHeader
          appName="mymedia"
          darkMode={darkMode}
          onDarkModeToggle={toggleDarkMode}
          userProfile={userProfile}
          isLoggedIn={isLoggedIn}
          onTopIconClick={handleTopIconClick}
          onLogout={handleLogout}
          showTopIcons={true}
          showAds={true}
          showDarkModeToggle={true}
          showProfileButton={true}
        />

      {/* Main Content - Add padding-top to account for fixed header */}
      <div style={{ paddingTop: `${getMobileHeaderHeight(true, true, true)}px` }}>

        {/* Section 1: My Apps (Vertical, one per row) */}
        <section className="py-8 px-4"
          style={{ background: 'linear-gradient(-45deg, #ac32e4, #7918f2, #4801ff)' }}>
          <h2 className="text-2xl font-bold text-white text-center mb-6">My Apps</h2>
          <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
            {homeData.topIcon.myapps.map((app) => (
              <Link
                key={app.id}
                to={app.url || `/mobile/${app.name?.toLowerCase().replace(/\s+/g, '')}`}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl py-4 px-5 text-white hover:bg-white/20 transition-all duration-300"
              >
                <img
                  src={app.icon?.startsWith('http') ? app.icon : `${BACKEND_URL}${app.icon}`}
                  alt={app.name}
                  className="w-10 h-10 object-contain rounded-lg"
                />
                <span className="font-medium">{app.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 2: About Us Slider */}
        {homeData.aboutUs && homeData.aboutUs.length > 0 && (
          <section className={`py-8 px-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>About Us</h2>
            <div className="relative overflow-hidden">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                {homeData.aboutUs.map((item, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-72 rounded-xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    {item.image && (
                      <img
                        src={item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`}
                        alt={item.title}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                      <p className={`text-sm line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Section 3: My Company (2-column grid) */}
        {homeData.topIcon.myCompany && homeData.topIcon.myCompany.length > 0 && (
          <section className={`py-8 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <h2 className={`text-xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Company</h2>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {homeData.topIcon.myCompany.map((app) => (
                <Link
                  key={app.id}
                  to={app.url || `/mobile/${app.name?.toLowerCase().replace(/\s+/g, '')}`}
                  className={`flex flex-col items-center p-4 rounded-xl transition-all duration-300 ${
                    darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100 shadow-md'
                  }`}
                >
                  <img
                    src={app.icon?.startsWith('http') ? app.icon : `${BACKEND_URL}${app.icon}`}
                    alt={app.name}
                    className="w-14 h-14 object-contain rounded-xl mb-2"
                  />
                  <span className={`text-sm font-medium text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>{app.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Main Ads Carousel */}
        {homeData.mainAds && (homeData.mainAds.ads1 || homeData.mainAds.ads2 || homeData.mainAds.ads3) && (
          <section className={`py-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold text-center mb-6 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Featured</h2>
            <div className="relative overflow-hidden">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-4">
                {homeData.mainAds.ads1 && (
                  <a
                    href={homeData.mainAds.ads1_url || '#'}
                    className="flex-shrink-0 w-80 rounded-xl overflow-hidden shadow-lg"
                  >
                    <img
                      src={homeData.mainAds.ads1.startsWith('http') ? homeData.mainAds.ads1 : `${BACKEND_URL}${homeData.mainAds.ads1}`}
                      alt="Advertisement 1"
                      className="w-full h-44 object-cover"
                    />
                  </a>
                )}
                {homeData.mainAds.ads2 && (
                  <a
                    href={homeData.mainAds.ads2_url || '#'}
                    className="flex-shrink-0 w-80 rounded-xl overflow-hidden shadow-lg"
                  >
                    <img
                      src={homeData.mainAds.ads2.startsWith('http') ? homeData.mainAds.ads2 : `${BACKEND_URL}${homeData.mainAds.ads2}`}
                      alt="Advertisement 2"
                      className="w-full h-44 object-cover"
                    />
                  </a>
                )}
                {homeData.mainAds.ads3 && (
                  <a
                    href={homeData.mainAds.ads3_url || '#'}
                    className="flex-shrink-0 w-80 rounded-xl overflow-hidden shadow-lg"
                  >
                    <img
                      src={homeData.mainAds.ads3.startsWith('http') ? homeData.mainAds.ads3 : `${BACKEND_URL}${homeData.mainAds.ads3}`}
                      alt="Advertisement 3"
                      className="w-full h-44 object-cover"
                    />
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Section 5: Online Apps (2-column grid) */}
        {homeData.topIcon.online && homeData.topIcon.online.length > 0 && (
          <section className={`py-8 px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <h2 className={`text-xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Online Apps</h2>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {homeData.topIcon.online.map((app) => (
                <Link
                  key={app.id}
                  to={app.url || `/mobile/${app.name?.toLowerCase().replace(/\s+/g, '')}`}
                  className={`flex flex-col items-center p-4 rounded-xl transition-all duration-300 ${
                    darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100 shadow-md'
                  }`}
                >
                  <img
                    src={app.icon?.startsWith('http') ? app.icon : `${BACKEND_URL}${app.icon}`}
                    alt={app.name}
                    className="w-14 h-14 object-contain rounded-xl mb-2"
                  />
                  <span className={`text-sm font-medium text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>{app.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section 6: Offline Apps (2-column grid) */}
        {homeData.topIcon.offline && homeData.topIcon.offline.length > 0 && (
          <section className={`py-8 px-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Offline Apps</h2>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {homeData.topIcon.offline.map((app) => (
                <Link
                  key={app.id}
                  to={app.url || `/mobile/${app.name?.toLowerCase().replace(/\s+/g, '')}`}
                  className={`flex flex-col items-center p-4 rounded-xl transition-all duration-300 ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100 shadow-md'
                  }`}
                >
                  <img
                    src={app.icon?.startsWith('http') ? app.icon : `${BACKEND_URL}${app.icon}`}
                    alt={app.name}
                    className="w-14 h-14 object-contain rounded-xl mb-2"
                  />
                  <span className={`text-sm font-medium text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>{app.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section 7: Testimonials Carousel */}
        <section className="py-16 bg-gray-50">
          <div className="px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What Our Clients Say</h2>
            {testimonials.length > 0 && (
              <div className="relative max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={24} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                  <blockquote className="text-lg text-gray-700 mb-6 italic">
                    "{testimonials[currentTestimonial]?.message || 'Great service and amazing platform!'}"
                  </blockquote>
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {testimonials[currentTestimonial]?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{testimonials[currentTestimonial]?.name || 'Anonymous'}</p>
                      <p className="text-gray-600 text-sm">{testimonials[currentTestimonial]?.designation || 'Client'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-8 gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentTestimonial ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 8: Footer with 6 columns + Social Media */}
        <footer className="bg-gray-900 text-white py-10">
          <div className="px-4">
            {/* 6-Column Grid for Mobile (2 cols) and Desktop (6 cols) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {/* Column 1: Know Us */}
              <div>
                <h3 className="font-bold text-sm mb-3 text-teal-400">Know Us</h3>
                <ul className="space-y-1.5 text-xs">
                  <li><Link to="/" className="hover:text-teal-400 transition-colors">Home</Link></li>
                  <li><Link to="/about" className="hover:text-teal-400 transition-colors">About Us</Link></li>
                  <li><Link to="/clients" className="hover:text-teal-400 transition-colors">Clients</Link></li>
                  <li><Link to="/milestones" className="hover:text-teal-400 transition-colors">Milestones</Link></li>
                  <li><Link to="/testimonials" className="hover:text-teal-400 transition-colors">Testimonials</Link></li>
                  <li><Link to="/sitemap" className="hover:text-teal-400 transition-colors">Sitemap</Link></li>
                </ul>
              </div>

              {/* Column 2: Media */}
              <div>
                <h3 className="font-bold text-sm mb-3 text-teal-400">Media</h3>
                <ul className="space-y-1.5 text-xs">
                  <li><Link to="/newsroom" className="hover:text-teal-400 transition-colors">Newsroom</Link></li>
                  <li><Link to="/gallery" className="hover:text-teal-400 transition-colors">Gallery</Link></li>
                  <li><Link to="/awards" className="hover:text-teal-400 transition-colors">Awards</Link></li>
                  <li><Link to="/events" className="hover:text-teal-400 transition-colors">Events</Link></li>
                </ul>
              </div>

              {/* Column 3: Opportunity */}
              <div>
                <h3 className="font-bold text-sm mb-3 text-teal-400">Opportunity</h3>
                <ul className="space-y-1.5 text-xs">
                  <li><Link to="/careers" className="hover:text-teal-400 transition-colors">Careers</Link></li>
                  <li><Link to="/jobs" className="hover:text-teal-400 transition-colors">My Jobs</Link></li>
                  <li><Link to="/franchise" className="hover:text-teal-400 transition-colors">Franchise</Link></li>
                  <li><Link to="/advertise" className="hover:text-teal-400 transition-colors">Advertise</Link></li>
                </ul>
              </div>

              {/* Column 4: Our Policy */}
              <div>
                <h3 className="font-bold text-sm mb-3 text-teal-400">Our Policy</h3>
                <ul className="space-y-1.5 text-xs">
                  <li><Link to="/privacy" className="hover:text-teal-400 transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="hover:text-teal-400 transition-colors">Terms</Link></li>
                  <li><Link to="/faq" className="hover:text-teal-400 transition-colors">FAQ's</Link></li>
                  <li><Link to="/refund" className="hover:text-teal-400 transition-colors">Refund Policy</Link></li>
                </ul>
              </div>

              {/* Column 5: Support */}
              <div>
                <h3 className="font-bold text-sm mb-3 text-teal-400">Support</h3>
                <ul className="space-y-1.5 text-xs">
                  <li><Link to="/contact" className="hover:text-teal-400 transition-colors">Contact Us</Link></li>
                  <li><Link to="/enquiry" className="hover:text-teal-400 transition-colors">Enquiry</Link></li>
                  <li><Link to="/support" className="hover:text-teal-400 transition-colors">Tech Support</Link></li>
                  <li><Link to="/feedback" className="hover:text-teal-400 transition-colors">Feedback</Link></li>
                </ul>
              </div>

              {/* Column 6: Logins */}
              <div>
                <h3 className="font-bold text-sm mb-3 text-teal-400">Logins</h3>
                <ul className="space-y-1.5 text-xs">
                  <li><Link to="/client-login" className="hover:text-teal-400 transition-colors">Client Login</Link></li>
                  <li><Link to="/franchise-login" className="hover:text-teal-400 transition-colors">Franchise</Link></li>
                  <li><Link to="/reporter-login" className="hover:text-teal-400 transition-colors">Reporters</Link></li>
                  <li><Link to="/labor-login" className="hover:text-teal-400 transition-colors">My Labor</Link></li>
                </ul>
              </div>
            </div>

            {/* Social Media Row */}
            <div className="border-t border-gray-700 mt-8 pt-6">
              <div className="flex justify-center gap-4 mb-4">
                {homeData.socialLink && homeData.socialLink.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-800 hover:bg-teal-600 flex items-center justify-center transition-colors"
                  >
                    {social.icon ? (
                      <img
                        src={social.icon.startsWith('http') ? social.icon : `${BACKEND_URL}${social.icon}`}
                        alt={social.platform}
                        className="w-5 h-5"
                      />
                    ) : (
                      <span className="text-xs font-bold">{social.platform?.charAt(0).toUpperCase()}</span>
                    )}
                  </a>
                ))}
              </div>
              <p className="text-center text-xs text-gray-400">
                &copy; {new Date().getFullYear()} {homeData.copyRight?.company_name || 'Multi-Tenant Platform'}. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
        </div>

        {/* More Apps Modal */}
        <AnimatePresence>
          {showMoreAppsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4a4a4a 0%, #2d2d2d 100%)' }}
              onClick={() => setShowMoreAppsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full h-full overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 sticky top-0 z-10" style={{ background: 'linear-gradient(135deg, #4a4a4a 0%, #2d2d2d 100%)' }}>
                  <h2 className="text-2xl font-bold text-white">My Apps</h2>
                  <button
                    onClick={() => setShowMoreAppsModal(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={28} className="text-white" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="px-6 pb-8">
                  {/* Group apps by apps_name */}
                  {['My Apps', 'My Company', 'My Online Apps', 'My Offline Apps'].map((category) => {
                    const categoryApps = allApps.filter(app => app.apps_name === category);
                    if (categoryApps.length === 0) return null;

                    return (
                      <div key={category} className="mb-8">
                        <h3 className="text-xl font-bold text-white mb-6">{category}</h3>
                        <div className="grid grid-cols-4 gap-6">
                          {categoryApps.map((app) => (
                            <Link
                              key={app.id}
                              to="#"
                              className="flex flex-col items-center gap-2 group"
                              onClick={() => setShowMoreAppsModal(false)}
                            >
                              <div className="relative">
                                {app.details?.icon ? (
                                  <div className="w-16 h-16 rounded-full bg-white p-2 shadow-lg group-hover:scale-110 transition-transform">
                                    <img
                                      src={`${BACKEND_URL}${app.details.icon}`}
                                      alt={app.name}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                                    {app.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <span className="text-white text-xs text-center font-medium leading-tight">
                                {app.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Profile Modal - Slide from Right */}
        <AnimatePresence>
          {showProfileModal && userProfile && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[100]"
                onClick={() => setShowProfileModal(false)}
              />

              {/* Sliding Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-white z-[101] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                  {/* Profile Header */}
                  <div className="relative" style={{ background: 'linear-gradient(135deg, #057284 0%, #0a9fb5 100%)' }}>
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => setShowProfileModal(false)}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                      >
                        <X size={24} className="text-white" />
                      </button>
                    </div>

                    <div className="flex flex-col items-center pt-8 pb-6 px-4">
                      {/* Profile Picture */}
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-white p-1">
                          {userProfile.profile_img ? (
                            <img
                              src={`${BACKEND_URL}${userProfile.profile_img}`}
                              alt="Profile"
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                              {userProfile.first_name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-100 transition-colors">
                          <Camera size={16} className="text-gray-700" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleProfileImageUpload}
                          />
                        </label>
                      </div>

                      {/* User Info */}
                      <h2 className="text-2xl font-bold text-white mt-4">
                        {userProfile.display_name || userProfile.first_name}
                      </h2>
                      {userProfile.identification_code && (
                        <p className="text-white/90 text-sm mt-1 font-mono bg-white/20 px-3 py-1 rounded-full">
                          ID: {userProfile.identification_code}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Profile Tabs */}
                  <div className="border-b">
                    <div className="flex">
                      <button
                        onClick={() => setProfileTab('profile')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                          profileTab === 'profile'
                            ? 'text-[#057284] border-b-2 border-[#057284]'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => setProfileTab('personal')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                          profileTab === 'personal'
                            ? 'text-[#057284] border-b-2 border-[#057284]'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Personal
                      </button>
                      <button
                        onClick={() => setProfileTab('address')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                          profileTab === 'address'
                            ? 'text-[#057284] border-b-2 border-[#057284]'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Address
                      </button>
                    </div>
                  </div>

                  {/* Profile Content */}
                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {profileTab === 'profile' && (
                      <div className="space-y-4">
                        {/* Settings Section */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Settings</h3>
                          <div className="space-y-2">
                            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                              <Lock size={20} className="text-gray-600" />
                              <span className="text-gray-700">Security</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                              <Globe size={20} className="text-gray-600" />
                              <span className="text-gray-700">Language</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                              <DollarSign size={20} className="text-gray-600" />
                              <span className="text-gray-700">Currency</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                              <Key size={20} className="text-gray-600" />
                              <span className="text-gray-700">Change Password</span>
                            </button>
                          </div>
                        </div>

                        {/* Location Setting */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Location</h3>
                          <button
                            onClick={() => setShowLocationModal(true)}
                            className="w-full bg-blue-50 p-4 rounded-lg mb-4 hover:bg-blue-100 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin size={16} className="text-blue-600" />
                              <span className="text-sm font-medium text-blue-700">Set Your Location</span>
                            </div>
                            {userLocation && userLocation.setCountryData ? (
                              <p className="text-xs text-blue-600 text-left">
                                {userLocation.setCountryData?.country}, {userLocation.setStateData?.state}, {userLocation.setDistrictData?.district}
                              </p>
                            ) : (
                              <p className="text-xs text-blue-600 text-left">Select your country, state, and district</p>
                            )}
                          </button>
                        </div>



                        {/* Legal Section */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Legal</h3>
                          <div className="space-y-2">
                            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                              <FileText size={20} className="text-gray-600" />
                              <span className="text-gray-700">Terms & Conditions</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                              <Shield size={20} className="text-gray-600" />
                              <span className="text-gray-700">Privacy Policy</span>
                            </button>
                          </div>
                        </div>

                        {/* Help & Support Section */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Help & Support</h3>
                          <div className="space-y-2">
                            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                              <HelpCircle size={20} className="text-gray-600" />
                              <span className="text-gray-700">Feedback</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                              <MessageCircle size={20} className="text-gray-600" />
                              <span className="text-gray-700">Live Chat</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                              <Phone size={20} className="text-gray-600" />
                              <span className="text-gray-700">Contact</span>
                            </button>
                          </div>
                        </div>

                        {/* Share & Download Section */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Share</h3>
                          <div className="space-y-2">
                            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                              <Share2 size={20} className="text-gray-600" />
                              <span className="text-gray-700">Share App</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                              <Download size={20} className="text-gray-600" />
                              <span className="text-gray-700">Download Apps</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                              <Star size={20} className="text-gray-600" />
                              <span className="text-gray-700">Reviews and Ratings</span>
                            </button>
                          </div>
                        </div>

                        {/* Total Users Section */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Total Users</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Users size={16} className="text-blue-600" />
                                <span className="text-xs text-blue-600 font-medium">Global</span>
                              </div>
                              <p className="text-2xl font-bold text-blue-700">1.2M</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin size={16} className="text-green-600" />
                                <span className="text-xs text-green-600 font-medium">National</span>
                              </div>
                              <p className="text-2xl font-bold text-green-700">450K</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Building2 size={16} className="text-purple-600" />
                                <span className="text-xs text-purple-600 font-medium">Regional</span>
                              </div>
                              <p className="text-2xl font-bold text-purple-700">85K</p>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Map size={16} className="text-orange-600" />
                                <span className="text-xs text-orange-600 font-medium">Local</span>
                              </div>
                              <p className="text-2xl font-bold text-orange-700">12K</p>
                            </div>
                          </div>
                        </div>

                        {/* Logout Button */}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium"
                        >
                          <LogOut size={20} />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}

                    {profileTab === 'personal' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-500">First Name</label>
                          <p className="text-gray-900 font-medium mt-1">{userProfile.first_name}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Last Name</label>
                          <p className="text-gray-900 font-medium mt-1">{userProfile.last_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Email</label>
                          <p className="text-gray-900 font-medium mt-1">{userProfile.email}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Phone</label>
                          <p className="text-gray-900 font-medium mt-1">{userProfile.phone}</p>
                        </div>
                      </div>
                    )}

                    {profileTab === 'address' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-500">Address</label>
                          <p className="text-gray-900 font-medium mt-1">Address information will be displayed here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
          )}
        </AnimatePresence>

        {/* Location Modal */}
        <AnimatePresence>
          {showLocationModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[110]"
                onClick={() => setShowLocationModal(false)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="fixed inset-4 bg-white rounded-lg z-[111] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Set Your Location</h2>
                    <button
                      onClick={() => setShowLocationModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X size={20} className="text-gray-600" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Country</option>
                        {countries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.country}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!selectedCountry}
                      >
                        <option value="">Select State</option>
                        {states.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.state}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!selectedState}
                      >
                        <option value="">Select District</option>
                        {districts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.district}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowLocationModal(false)}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleLocationUpdate}
                        disabled={locationLoading || !selectedCountry || !selectedState || !selectedDistrict}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {locationLoading ? 'Updating...' : 'Update Location'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

