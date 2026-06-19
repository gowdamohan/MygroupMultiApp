import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, User, Lock, Video, List,
  LogOut, ChevronDown, ChevronRight, Menu, X,
  MessageCircle,
  Users, Star, TrendingUp, DollarSign, Megaphone, Wallet
} from 'lucide-react';
import { EditProfile } from '../partner/EditProfile';
import { ChangePassword } from '../partner/ChangePassword';
import { CreateMedia } from '../partner/CreateMedia';
import { MyChannelList } from '../partner/MyChannelList';
import { HeaderAdsBooking } from '../partner/HeaderAdsBooking';
import { SupportChat } from '../partner/SupportChat';
import { PartnerProfileCompletionForm } from '../../components/PartnerProfileCompletionForm';
import { PartnerHeader } from '../../components/dashboard/PartnerHeader';
import { API_BASE_URL, resolveProfileImageUrl, WASABI_IMG_PROPS } from '../../config/api.config';
import { ADMIN_SUPPORT_APP_ID } from '../../config/supportChat.config';

const SUPPORT_CHAT_LAST_SEEN_KEY = 'support_chat_last_seen_id';
const UNREAD_POLL_MS = 10000;

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  children?: MenuItem[];
}

interface UserProfile {
  id: number;
  profile_img: string | null;
  profile_img_url?: string | null;
  identification_code: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  username: string;
  company?: string | null;
  company_name?: string | null;
  registration_status?: string;
}

interface SelectedAppInfo {
  id: number;
  name: string;
  details?: {
    logo?: string;
    icon?: string;
  };
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
  const [registrationStatus, setRegistrationStatus] = useState<string>('pending');
  const [appName, setAppName] = useState<string>('');
  const [selectedAppInfo, setSelectedAppInfo] = useState<SelectedAppInfo | null>(null);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  const fetchUnreadSupportCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const response = await axios.get(`${API_BASE_URL}/admin/chat-messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { channel_type: 'admin', app_id: ADMIN_SUPPORT_APP_ID }
      });
      if (response.data.success) {
        const messages: { id: number; sender_type?: string; is_own?: boolean; direction?: string }[] =
          response.data.data?.messages || [];
        const lastSeenId = parseInt(localStorage.getItem(SUPPORT_CHAT_LAST_SEEN_KEY) || '0', 10);
        const count = messages.filter(
          m => m.id > lastSeenId && m.sender_type !== 'partner' && m.is_own !== true && m.direction !== 'out'
        ).length;
        setUnreadSupportCount(count);
      }
    } catch {
      // silently ignore polling errors
    }
  }, []);

  const markSupportChatRead = useCallback(() => {
    // Will be called when user opens Support Chat; needs latest messages fetched first
    const doMark = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const response = await axios.get(`${API_BASE_URL}/admin/chat-messages`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { channel_type: 'admin', app_id: ADMIN_SUPPORT_APP_ID }
        });
        if (response.data.success) {
          const messages: { id: number }[] = response.data.data?.messages || [];
          if (messages.length > 0) {
            const maxId = Math.max(...messages.map(m => m.id));
            localStorage.setItem(SUPPORT_CHAT_LAST_SEEN_KEY, String(maxId));
          }
        }
      } catch { /* ignore */ }
      setUnreadSupportCount(0);
    };
    doMark();
  }, []);

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

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchUserProfile();
    } else {
      navigate('/partner');
    }

    const selectedApp = localStorage.getItem('selectedApp');
    if (selectedApp) {
      try {
        const app = JSON.parse(selectedApp) as SelectedAppInfo;
        setSelectedAppInfo(app);
        setAppName((app.name || '').toLowerCase());
      } catch {
        setAppName('');
        setSelectedAppInfo(null);
      }
    }
  }, [navigate, fetchUserProfile]);

  // Poll for unread support chat messages
  useEffect(() => {
    fetchUnreadSupportCount();
    const interval = setInterval(fetchUnreadSupportCount, UNREAD_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchUnreadSupportCount]);

  // Mark support chat as read when the user is on that page
  useEffect(() => {
    if (location.pathname === '/partner/support-chat') {
      markSupportChatRead();
    }
  }, [location.pathname, markSupportChatRead]);

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
    const showBadge = item.id === 'support-chat' && unreadSupportCount > 0;

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
            <span className="font-medium">{item.label}</span>
          </div>
          {showBadge ? (
            <span className="ml-auto flex-shrink-0 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
              {unreadSupportCount > 99 ? '99+' : unreadSupportCount}
            </span>
          ) : hasChildren ? (
            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : null}
        </button>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getDisplayName = () => {
    if (userProfile) {
      const fullName = [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ').trim();
      if (fullName) return fullName;
      if (userProfile.company_name?.trim()) return userProfile.company_name.trim();
      if (userProfile.company?.trim()) return userProfile.company.trim();
      return userProfile.username || 'Partner';
    }
    if (user?.company?.trim()) return user.company.trim();
    return user?.username || 'Partner';
  };

  const registrationEmail = userProfile?.email || user?.email || '';
  const appLogo = selectedAppInfo?.details?.logo;

  const renderSidebarIdentity = (variant: 'desktop' | 'mobile') => {
    const isDesktop = variant === 'desktop';
    const logoSize = isDesktop ? 'w-14 h-14' : 'w-12 h-12';

    return (
      <div className={`relative overflow-hidden ${isDesktop ? 'mx-3 mt-2 mb-1' : 'mb-0'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-transparent to-indigo-500/10 rounded-2xl" />
        <div className="relative rounded-2xl border border-gray-600/80 bg-gray-900/60 backdrop-blur-sm p-4 shadow-inner">
          {variant === 'mobile' && (
            <div className="flex justify-end mb-2 -mt-1 -mr-1">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <div className={`flex ${isDesktop ? 'flex-col items-center text-center' : 'items-center gap-3'} gap-3`}>
            <div className={`${logoSize} rounded-xl overflow-hidden border-2 border-primary-400/70 bg-white shadow-lg flex-shrink-0 ring-2 ring-primary-500/20`}>
              {appLogo ? (
                <img src={appLogo} alt={selectedAppInfo?.name || 'App'} className="w-full h-full object-contain p-1.5" />
              ) : userProfile?.profile_img || userProfile?.profile_img_url ? (
                <img
                  src={resolveProfileImageUrl(userProfile.profile_img, userProfile.profile_img_url)}
                  alt="Profile"
                  {...WASABI_IMG_PROPS}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <User className="text-white" size={isDesktop ? 24 : 20} />
                </div>
              )}
            </div>

            {(isDesktop ? sidebarOpen : true) && (
              <div className={`min-w-0 ${isDesktop ? 'w-full' : 'flex-1'}`}>
                <p className="text-[10px] uppercase tracking-widest text-primary-300/80 font-semibold mb-0.5">
                  Partner Account
                </p>
                <p className="text-sm font-semibold text-white leading-snug truncate">
                  {getDisplayName()}
                </p>
                {userProfile?.identification_code && (
                  <p className="text-xl font-bold text-primary-300 mt-1.5 tracking-wide leading-none">
                    {userProfile.identification_code}
                  </p>
                )}
                {registrationEmail && (
                  <p className="text-[11px] text-gray-400 mt-2 break-all leading-relaxed">
                    {registrationEmail}
                  </p>
                )}
              </div>
            )}
          </div>
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
    <PartnerProfileCompletionForm
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
      case '/partner/header-ads-booking':
        return <HeaderAdsBooking />;
      case '/partner/wallet':
        return <div className="p-6"><h2 className="text-2xl font-bold">My Wallet</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>;
      case '/partner/support-chat':
        return <SupportChat registrationStatus={registrationStatus} />;
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
          {/* Partner Identity */}
          <div className="pb-3 border-b border-gray-700/80 flex-shrink-0">
            {renderSidebarIdentity('desktop')}
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <nav className="space-y-1">
              {menuItems.map(item => {
                const isExpanded = expandedMenus.includes(item.id);
                const isActive = activeMenu === item.id || location.pathname === item.path;
                const hasChildren = item.children && item.children.length > 0;
                const isSupportChat = item.id === 'support-chat';
                const showBadge = isSupportChat && unreadSupportCount > 0;

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
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <item.icon size={18} />
                          {showBadge && !sidebarOpen && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                              {unreadSupportCount > 99 ? '99+' : unreadSupportCount}
                            </span>
                          )}
                        </div>
                        {sidebarOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
                      </div>
                      {sidebarOpen && (
                        showBadge ? (
                          <span className="ml-auto flex-shrink-0 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                            {unreadSupportCount > 99 ? '99+' : unreadSupportCount}
                          </span>
                        ) : hasChildren ? (
                          isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                        ) : null
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
                  {registrationStatus === 'pending' ? 'Waiting for Submission' :
                   registrationStatus === 'submitted' ? 'Submitted' :
                   registrationStatus === 'verified' ? 'Profile Verified' :
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
              {/* Partner Identity */}
              <div className="p-3 border-b border-gray-700/80">
                {renderSidebarIdentity('mobile')}
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto py-4 px-3">
                {menuItems.map(item => renderMenuItem(item))}
                {isPending && (
                  <div className="mt-4 mx-2 p-3 bg-yellow-600/20 rounded-lg">
                    <p className="text-yellow-400 text-xs font-medium text-center">
                      {registrationStatus === 'pending' ? 'Waiting for Submission' :
                       registrationStatus === 'submitted' ? 'Submitted' :
                       registrationStatus === 'verified' ? 'Profile Verified' :
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

        {/* Partner Ads Header Section - consistent height across all views */}
        <div className="flex-shrink-0 h-48 md:h-56">
          <PartnerHeader />
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



