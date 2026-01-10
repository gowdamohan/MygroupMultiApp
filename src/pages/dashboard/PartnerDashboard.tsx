import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, User, Lock, Video, List, MessageSquare,
  Mail, LogOut, ChevronDown, ChevronRight, Menu, X,
  HelpCircle, MessageCircle, ChevronLeft, ChevronRightIcon,
  Users, Star, TrendingUp, DollarSign
} from 'lucide-react';
import { EditProfile } from '../partner/EditProfile';
import { ChangePassword } from '../partner/ChangePassword';
import { CreateMedia } from '../partner/CreateMedia';
import { MyChannelList } from '../partner/MyChannelList';
import { Enquiry } from '../partner/Enquiry';
import { Feedback } from '../partner/Feedback';
import { LiveChat } from '../partner/LiveChat';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  children?: MenuItem[];
}

interface HeaderAd {
  id: number;
  header_ads_file_path: string;
  header_ads_url: string;
  headers_type: string;
  file_type: string;
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
  const [headerAds, setHeaderAds] = useState<HeaderAd[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isAccountActive, setIsAccountActive] = useState<boolean>(true);

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

  const fetchHeaderAds = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const selectedApp = localStorage.getItem('selectedApp');
      const appId = selectedApp ? JSON.parse(selectedApp).id : 1;
      const response = await axios.get(`${API_BASE_URL}/partner/header-ads?app_id=${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setHeaderAds(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching header ads:', error);
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
      fetchHeaderAds();
    } else {
      navigate('/partner');
    }
  }, [navigate, fetchUserProfile, fetchHeaderAds]);

  // Auto-rotate carousel
  useEffect(() => {
    if (headerAds.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % headerAds.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [headerAds.length]);

  const nextAd = () => {
    setCurrentAdIndex((prev) => (prev + 1) % headerAds.length);
  };

  const prevAd = () => {
    setCurrentAdIndex((prev) => (prev - 1 + headerAds.length) % headerAds.length);
  };

  const menuItems: MenuItem[] = [
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
      id: 'support',
      label: 'Support',
      icon: HelpCircle,
      children: [
        { id: 'enquiry', label: 'Enquiry', icon: Mail, path: '/partner/enquiry' },
        { id: 'feedback', label: 'Feedback and Suggestions', icon: MessageSquare, path: '/partner/feedback' },
        { id: 'live-chat', label: 'Live Chat', icon: MessageCircle, path: '/partner/live-chat' }
      ]
    }
  ];

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

  const renderHeaderAdsCarousel = () => {
    if (headerAds.length === 0) {
      return (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl h-32 flex items-center justify-center text-white">
          <p className="text-lg font-medium">Welcome to Partner Dashboard</p>
        </div>
      );
    }

    const currentAd = headerAds[currentAdIndex];
    return (
      <div className="relative rounded-xl overflow-hidden h-32 md:h-40 bg-gray-100">
        {currentAd.file_type === 'video' ? (
          <video
            src={`${BACKEND_URL}${currentAd.header_ads_file_path}`}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
          />
        ) : (
          <img
            src={`${BACKEND_URL}${currentAd.header_ads_file_path}`}
            alt="Header Ad"
            className="w-full h-full object-cover"
          />
        )}
        {headerAds.length > 1 && (
          <>
            <button
              onClick={prevAd}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextAd}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
            >
              <ChevronRightIcon size={20} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {headerAds.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentAdIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${idx === currentAdIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header Ads Carousel */}
      {renderHeaderAdsCarousel()}

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
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Partner Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-700">{userProfile?.first_name || user?.username}</p>
              <p className="text-xs text-gray-500">{userProfile?.identification_code || 'Partner'}</p>
            </div>
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200">
              {userProfile?.profile_img ? (
                <img
                  src={`${BACKEND_URL}${userProfile.profile_img}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <User className="text-white" size={16} />
                </div>
              )}
            </div>
          </div>
        </header>

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



