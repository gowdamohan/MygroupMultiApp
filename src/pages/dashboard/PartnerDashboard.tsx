import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, User, Lock, Video, List, MessageSquare,
  Mail, LogOut, ChevronDown, ChevronRight, Menu, X,
  HelpCircle, MessageCircle,
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
import { OwnerDetailsForm } from '../partner/OwnerDetailsForm';
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
  registration_status?: string;
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
  const [registrationStatus, setRegistrationStatus] = useState<string>('pending');
  const [appName, setAppName] = useState<string>('');

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/partner/user-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUserProfile(response.data.data);
        // Set registration status from API response
        if (response.data.data.registration_status) {
          setRegistrationStatus(response.data.data.registration_status);
        }
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

  const isPending = ['pending', 'submitted', 'verified', 'processed_for_approve'].includes(registrationStatus);

  // IDs allowed when registration is not yet active
  const pendingAllowedIds = ['dashboard', 'profile', 'edit-profile', 'change-password', 'support-chat'];

  // Filter menu items based on registration status
  const allMenuItems: MenuItem[] = [...commonMenuItems, ...getAppSpecificMenuItems()];
  const menuItems: MenuItem[] = isPending
    ? allMenuItems.filter(item => pendingAllowedIds.includes(item.id))
    : allMenuItems;

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

  const renderHeaderAdsSection = () => {
    const ad1 = adsWithImages[0] || null;
    const ad2 = adsWithImages[1] || null;

    return (
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 h-full flex flex-col">
        {/* Two Ad Images Side by Side */}
        <div className="flex-1 flex gap-1 min-h-0">
          {ad1 ? (
            <div className="flex-1 overflow-hidden">
              <img
                src={ad1.signed_url || ad1.image_url || ''}
                alt="Partner Ad 1"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white">
                <Megaphone className="mx-auto mb-1" size={24} />
                <p className="text-xs font-medium opacity-90">Ad Space 1</p>
              </div>
            </div>
          )}
          {ad2 ? (
            <div className="flex-1 overflow-hidden">
              <img
                src={ad2.signed_url || ad2.image_url || ''}
                alt="Partner Ad 2"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white">
                <Megaphone className="mx-auto mb-1" size={24} />
                <p className="text-xs font-medium opacity-90">Ad Space 2</p>
              </div>
            </div>
          )}
        </div>

        {/* Scrolling Text Marquee */}
        <div className="bg-black/20 py-1.5 overflow-hidden flex-shrink-0">
          {scrollingTexts.length > 0 ? (
            <div className="animate-marquee whitespace-nowrap">
              <span className="text-white text-sm font-medium mx-8">
                {scrollingTexts.join('  •  ')}
              </span>
              <span className="text-white text-sm font-medium mx-8">
                {scrollingTexts.join('  •  ')}
              </span>
            </div>
          ) : (
            <p className="text-white/60 text-sm text-center">Welcome to Partner Dashboard</p>
          )}
        </div>
      </div>
    );
  };

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

  // Render owner details / profile completion form for inactive accounts
  const renderInactiveMessage = () => (
    <OwnerDetailsForm
      registrationStatus={registrationStatus}
      onStatusChange={(newStatus) => {
        setRegistrationStatus(newStatus);
      }}
    />
  );

  const renderContent = () => {
    const path = location.pathname;

    // If not active, only allow profile, change-password, and support-chat routes
    if (isPending && path !== '/partner/edit-profile' && path !== '/partner/change-password' && path !== '/partner/support-chat') {
      return renderInactiveMessage();
    }

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
          {/* Sidebar Toggle */}
          <div className="flex justify-end px-2 pt-2 flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu size={16} />
            </button>
          </div>
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

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
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
            {isPending && (
              <div className="mt-4 mx-2 p-3 bg-yellow-600/20 rounded-lg">
                <p className="text-yellow-400 text-xs font-medium text-center">
                  {registrationStatus === 'pending' ? 'Complete Your Profile' :
                   registrationStatus === 'submitted' ? 'Profile Submitted' :
                   registrationStatus === 'verified' ? 'Profile Verified' :
                   registrationStatus === 'processed_for_approve' ? 'Processing Approval' :
                   'Account Pending Approval'}
                </p>
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

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto py-4 px-3">
                {menuItems.map(item => renderMenuItem(item))}
                {isPending && (
                  <div className="mt-4 mx-2 p-3 bg-yellow-600/20 rounded-lg">
                    <p className="text-yellow-400 text-xs font-medium text-center">
                      {registrationStatus === 'pending' ? 'Complete Your Profile' :
                       registrationStatus === 'submitted' ? 'Profile Submitted' :
                       registrationStatus === 'verified' ? 'Profile Verified' :
                       registrationStatus === 'processed_for_approve' ? 'Processing Approval' :
                       'Account Pending Approval'}
                    </p>
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
        {/* Mobile menu toggle - visible only on small screens */}
        <div className="lg:hidden h-10 bg-white border-b border-gray-200 flex items-center px-4 flex-shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Partner Ads Header Section - height matches sidebar */}
        <div className="flex-shrink-0 h-48 md:h-56">
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



