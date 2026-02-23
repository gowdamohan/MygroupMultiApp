import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, User, Lock, Video, List, MessageSquare,
  Mail, LogOut, ChevronDown, ChevronRight, Menu, X,
  HelpCircle, MessageCircle, ChevronLeft, ChevronRightIcon,
  Users, Star, TrendingUp, DollarSign, Megaphone, Wallet,
  Settings, BookOpen, Newspaper, Image, Award, Share2, Scale, ShieldCheck, FileCheck
} from 'lucide-react';
import { EditProfile } from '../partner/EditProfile';
import { ChangePassword } from '../partner/ChangePassword';
import { CreateMedia } from '../partner/CreateMedia';
import { MyChannelList } from '../partner/MyChannelList';
import { Enquiry } from '../partner/Enquiry';
import { Feedback } from '../partner/Feedback';
import { LiveChat } from '../partner/LiveChat';
import { HeaderAdsBooking } from '../partner/HeaderAdsBooking';
import { SupportChat } from '../partner/SupportChat';
import { FooterPageManager } from '../corporate/FooterPageManager';
import { FooterPageListManager } from '../corporate/FooterPageListManager';
import { SocialMediaLinks } from '../corporate/SocialMediaLinks';
import { Gallery } from '../corporate/Gallery';
import { FooterFaqManager } from '../corporate/FooterFaqManager';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  children?: MenuItem[];
}

interface PartnerAd {
  id: number;
  app_id: number;
  image_path: string | null;
  image_url: string | null;
  scrolling_text: string | null;
  type: 'ads1' | 'ads2' | null;
  slot: number | null;
  is_active: number;
  signed_url?: string | null;
}

interface UserProfile {
  id: number;
  profile_img: string | null;
  identification_code: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  username: string;
}

export const PartnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [partnerAds, setPartnerAds] = useState<PartnerAd[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isAccountActive, setIsAccountActive] = useState<boolean>(true);
  const [appName, setAppName] = useState<string>('');

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/partner/user-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUserProfile(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, []);

  const fetchPartnerAds = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const selectedApp = localStorage.getItem('selectedApp');
      const appId = selectedApp ? JSON.parse(selectedApp).id : 1;
      const response = await axios.get(`${API_BASE_URL}/partner-ads`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { app_id: appId, type: 'ads1', limit: 100 }
      });
      if (response.data.success) {
        setPartnerAds((response.data.data || []).filter((ad: PartnerAd) => ad.is_active === 1));
      }
    } catch (error) {
      console.error('Error fetching partner ads:', error);
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Check if user account is active (active === 1 means active)
      setIsAccountActive(parsedUser.active === 1 || parsedUser.active === true);
      fetchUserProfile();
      fetchPartnerAds();
    } else {
      navigate('/partner');
    }

    // Get app name from selectedApp
    const selectedApp = localStorage.getItem('selectedApp');
    if (selectedApp) {
      try {
        const app = JSON.parse(selectedApp);
        setAppName((app.name || '').toLowerCase());
      } catch (e) {
        setAppName('');
      }
    }
  }, [navigate, fetchUserProfile, fetchPartnerAds]);

  // Auto-rotate carousel
  useEffect(() => {
    if (partnerAds.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % partnerAds.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [partnerAds.length]);

  const nextAd = () => {
    setCurrentAdIndex((prev) => (prev + 1) % partnerAds.length);
  };

  const prevAd = () => {
    setCurrentAdIndex((prev) => (prev - 1 + partnerAds.length) % partnerAds.length);
  };

  // Common menu items for ALL partner dashboards
  const commonMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard/partner'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      children: [
        { id: 'edit-profile', label: 'Edit Profile', icon: User, path: '/partner/edit-profile' },
        { id: 'change-password', label: 'Change Password', icon: Lock, path: '/partner/change-password' }
      ]
    },
    {
      id: 'footer',
      label: 'Footer',
      icon: Settings,
      children: [
        { id: 'about-app', label: 'About the App', icon: BookOpen, path: '/partner/footer/about-app' },
        { id: 'newsletter', label: 'Newsletter', icon: Newspaper, path: '/partner/footer/newsletter' },
        { id: 'gallery', label: 'Gallery', icon: Image, path: '/partner/footer/gallery' },
        { id: 'awards', label: 'Awards', icon: Award, path: '/partner/footer/awards' },
        { id: 'social-media', label: 'Social Media Links', icon: Share2, path: '/partner/footer/social-media' },
        { id: 'tnc-partners', label: 'T&C of Partners', icon: Scale, path: '/partner/footer/tnc-partners' },
        { id: 'tnc', label: 'Terms & Conditions', icon: FileCheck, path: '/partner/footer/tnc' },
        { id: 'privacy-policy', label: 'Privacy Policies', icon: ShieldCheck, path: '/partner/footer/privacy' },
        { id: 'faq', label: 'FAQs', icon: HelpCircle, path: '/partner/footer/faq' }
      ]
    },
    {
      id: 'support-chat',
      label: 'Support Chat',
      icon: MessageCircle,
      path: '/partner/support-chat'
    }
  ];

  // App-specific menu items for Mymedia
  const mymediaMenuItems: MenuItem[] = [
    {
      id: 'create-media',
      label: 'Create Media',
      icon: Video,
      path: '/partner/create-media'
    },
    {
      id: 'my-channel-list',
      label: 'My Channel List',
      icon: List,
      path: '/partner/my-channel-list'
    },
    {
      id: 'advertisement',
      label: 'Advertisement',
      icon: Megaphone,
      children: [
        { id: 'header-ads-booking', label: 'Book Header Ads', icon: Megaphone, path: '/partner/header-ads-booking' },
        { id: 'my-wallet', label: 'My Wallet', icon: Wallet, path: '/partner/wallet' }
      ]
    },
    {
      id: 'support',
      label: 'Support',
      icon: HelpCircle,
      children: [
        { id: 'enquiry', label: 'Enquiry', icon: Mail, path: '/partner/enquiry' },
        { id: 'feedback', label: 'Feedback and Suggestions', icon: MessageSquare, path: '/partner/feedback' },
        { id: 'live-chat', label: 'Chat', icon: MessageCircle, path: '/partner/live-chat' }
      ]
    }
  ];

  // Build final menu: common items + app-specific items
  const getAppSpecificMenuItems = (): MenuItem[] => {
    if (appName === 'mymedia') return mymediaMenuItems;
    // Other apps can add their specific items here in the future
    return [];
  };

  const menuItems: MenuItem[] = [...commonMenuItems, ...getAppSpecificMenuItems()];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.children) {
      toggleMenu(item.id);
    } else if (item.path) {
      setActiveMenu(item.id);
      navigate(item.path);
      setMobileSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedApp');
    navigate('/partner');
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const isExpanded = expandedMenus.includes(item.id);
    const isActive = activeMenu === item.id || location.pathname === item.path;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        <button
          onClick={() => handleMenuClick(item)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
            isActive
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-100'
          } ${depth > 0 ? 'ml-4' : ''}`}
        >
          <div className="flex items-center gap-3">
            <item.icon size={20} />
            {sidebarOpen && <span className="font-medium">{item.label}</span>}
          </div>
          {sidebarOpen && hasChildren && (
            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          )}
        </button>

        {hasChildren && isExpanded && sidebarOpen && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get all scrolling texts from active partner ads
  const scrollingTexts = partnerAds
    .filter(ad => ad.scrolling_text && ad.scrolling_text.trim())
    .map(ad => ad.scrolling_text!.trim());

  // Get ads with images for the carousel
  const adsWithImages = partnerAds.filter(ad => ad.signed_url || ad.image_url);

  const renderHeaderAdsSection = () => (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
      {/* Partner Ads Image Carousel */}
      {adsWithImages.length > 0 ? (
        <div className="relative h-36 md:h-48 overflow-hidden">
          <img
            src={adsWithImages[currentAdIndex % adsWithImages.length]?.signed_url || adsWithImages[currentAdIndex % adsWithImages.length]?.image_url || ''}
            alt="Partner Ad"
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          {adsWithImages.length > 1 && (
            <>
              <button
                onClick={prevAd}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextAd}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
              >
                <ChevronRightIcon size={18} />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {adsWithImages.map((_ad: PartnerAd, idx: number) => (
                  <button
                    key={_ad.id}
                    onClick={() => setCurrentAdIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${idx === (currentAdIndex % adsWithImages.length) ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="h-24 md:h-32 flex items-center justify-center">
          <div className="text-center text-white">
            <Megaphone className="mx-auto mb-2" size={28} />
            <p className="text-sm font-medium opacity-90">Welcome to Partner Dashboard</p>
          </div>
        </div>
      )}

      {/* Scrolling Text Marquee */}
      {scrollingTexts.length > 0 && (
        <div className="bg-black/20 py-1.5 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap">
            <span className="text-white text-sm font-medium mx-8">
              {scrollingTexts.join('  •  ')}
            </span>
            <span className="text-white text-sm font-medium mx-8">
              {scrollingTexts.join('  •  ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Channels</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Video className="text-primary-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Followers</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">0.0</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₹0</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/partner/create-media')}
              className="flex flex-col items-center justify-center p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <Video className="text-primary-600 mb-2" size={24} />
              <span className="text-sm font-medium text-primary-700">Create Media</span>
            </button>
            <button
              onClick={() => navigate('/partner/my-channel-list')}
              className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <List className="text-blue-600 mb-2" size={24} />
              <span className="text-sm font-medium text-blue-700">My Channels</span>
            </button>
            <button
              onClick={() => navigate('/partner/edit-profile')}
              className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <User className="text-purple-600 mb-2" size={24} />
              <span className="text-sm font-medium text-purple-700">Edit Profile</span>
            </button>
            <button
              onClick={() => navigate('/partner/live-chat')}
              className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <MessageCircle className="text-green-600 mb-2" size={24} />
              <span className="text-sm font-medium text-green-700">Live Chat</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-primary-600" size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">No recent activity</p>
                <p className="text-xs text-gray-500">Start by creating your first media channel</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render inactive account message
  const renderInactiveMessage = () => (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Account Pending Activation</h2>
        <p className="text-gray-600 mb-6">
          Your account is currently <span className="font-semibold text-yellow-600">inactive</span>.
          Please contact the administrator to activate your account and access all features.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>What you can do:</strong><br />
            • Contact support for assistance<br />
            • Wait for admin approval<br />
            • Check back later
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    // If account is inactive, show the inactive message
    if (!isAccountActive) {
      return renderInactiveMessage();
    }

    const path = location.pathname;

    switch (path) {
      case '/dashboard/partner':
        return renderDashboard();
      case '/partner/edit-profile':
        return <EditProfile />;
      case '/partner/change-password':
        return <ChangePassword />;
      case '/partner/create-media':
        return <CreateMedia />;
      case '/partner/my-channel-list':
        return <MyChannelList />;
      case '/partner/enquiry':
        return <Enquiry />;
      case '/partner/feedback':
        return <Feedback />;
      case '/partner/live-chat':
        return <LiveChat />;
      case '/partner/header-ads-booking':
        return <HeaderAdsBooking />;
      case '/partner/wallet':
        return <div className="p-6"><h2 className="text-2xl font-bold">My Wallet</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      case '/partner/support-chat':
        return <SupportChat />;
      case '/partner/footer/about-app':
        return <FooterPageListManager pageType="about_app" pageTitle="About the App" />;
      case '/partner/footer/newsletter':
        return <FooterPageListManager pageType="newsletter" pageTitle="Newsletter" />;
      case '/partner/footer/gallery':
        return <Gallery />;
      case '/partner/footer/awards':
        return <FooterPageListManager pageType="awards" pageTitle="Awards" />;
      case '/partner/footer/social-media':
        return <SocialMediaLinks />;
      case '/partner/footer/tnc-partners':
        return <FooterPageManager pageType="tnc_partners" pageTitle="T&C of Partners" />;
      case '/partner/footer/tnc':
        return <FooterPageManager pageType="terms" pageTitle="Terms & Conditions" />;
      case '/partner/footer/privacy':
        return <FooterPageManager pageType="privacy_policy" pageTitle="Privacy Policies" />;
      case '/partner/footer/faq':
        return <FooterFaqManager />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } hidden lg:block bg-gray-800 transition-all duration-300 overflow-hidden shadow-lg`}
      >
        <div className="h-full flex flex-col">
          {/* User Profile */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-primary-500 shadow-lg mb-3">
                {userProfile?.profile_img ? (
                  <img
                    src={`${BACKEND_URL}${userProfile.profile_img}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <User className="text-white" size={28} />
                  </div>
                )}
              </div>
              {sidebarOpen && (
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">
                    {userProfile?.first_name || user?.username || 'Partner'}
                  </p>
                  {userProfile?.identification_code && (
                    <p className="text-xs text-gray-400 mt-1">ID: {userProfile.identification_code}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Menu Items - Hidden when account is inactive */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            {isAccountActive ? (
              <nav className="space-y-1">
                {menuItems.map(item => {
                  const isExpanded = expandedMenus.includes(item.id);
                  const isActive = activeMenu === item.id || location.pathname === item.path;
                  const hasChildren = item.children && item.children.length > 0;

                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => handleMenuClick(item)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={18} />
                          {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                        </div>
                        {sidebarOpen && hasChildren && (
                          isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                        )}
                      </button>

                      {hasChildren && isExpanded && sidebarOpen && (
                        <div className="mt-1 ml-4 space-y-1">
                          {item.children!.map(child => {
                            const childActive = location.pathname === child.path;
                            return (
                              <button
                                key={child.id}
                                onClick={() => handleMenuClick(child)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                                  childActive
                                    ? 'bg-primary-600/50 text-white'
                                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                }`}
                              >
                                <child.icon size={16} />
                                <span>{child.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            ) : (
              /* Inactive account - show disabled menu */
              <div className="text-center py-8 px-4">
                <div className="w-12 h-12 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V9a4 4 0 00-8 0v2m-2 0h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                  </svg>
                </div>
                <p className="text-yellow-400 text-sm font-medium">Account Inactive</p>
                <p className="text-gray-500 text-xs mt-1">Menu disabled</p>
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="p-3 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-gray-800">
            <div className="h-full flex flex-col">
              {/* User Profile */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-500">
                    {userProfile?.profile_img ? (
                      <img
                        src={`${BACKEND_URL}${userProfile.profile_img}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                        <User className="text-white" size={20} />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-sm font-semibold text-white">
                  {userProfile?.first_name || user?.username || 'Partner'}
                </p>
                {userProfile?.identification_code && (
                  <p className="text-xs text-gray-400 mt-1">ID: {userProfile.identification_code}</p>
                )}
              </div>

              {/* Menu Items - Hidden when account is inactive */}
              <div className="flex-1 overflow-y-auto py-4 px-3">
                {isAccountActive ? (
                  menuItems.map(item => renderMenuItem(item))
                ) : (
                  <div className="text-center py-8 px-4">
                    <div className="w-12 h-12 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V9a4 4 0 00-8 0v2m-2 0h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                      </svg>
                    </div>
                    <p className="text-yellow-400 text-sm font-medium">Account Inactive</p>
                    <p className="text-gray-500 text-xs mt-1">Menu disabled</p>
                  </div>
                )}
              </div>

              {/* Logout */}
              <div className="p-3 border-t border-gray-700">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navigation Bar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={18} />
            </button>
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-sm font-semibold text-gray-800">Partner Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-gray-700">{userProfile?.first_name || user?.username}</p>
              <p className="text-[10px] text-gray-500">{userProfile?.identification_code || 'Partner'}</p>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200">
              {userProfile?.profile_img ? (
                <img
                  src={`${BACKEND_URL}${userProfile.profile_img}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <User className="text-white" size={14} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Partner Ads Header Section */}
        <div className="flex-shrink-0">
          {renderHeaderAdsSection()}
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};



