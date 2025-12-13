import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, User, Lock, Video, List, MessageSquare,
  Mail, LogOut, ChevronDown, ChevronRight, Menu, X, Shield,
  FileText, HelpCircle, MessageCircle
} from 'lucide-react';
import { EditProfile } from '../partner/EditProfile';
import { ChangePassword } from '../partner/ChangePassword';
import { CreateMedia } from '../partner/CreateMedia';
import { MyChannelList } from '../partner/MyChannelList';
import { Enquiry } from '../partner/Enquiry';
import { Feedback } from '../partner/Feedback';
import { LiveChat } from '../partner/LiveChat';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  children?: MenuItem[];
}

export const PartnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } else {
      navigate('/partner');
    }
  }, [navigate]);

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

  const renderDashboard = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Partner Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dashboard content will go here */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome</h3>
          <p className="text-gray-600">Welcome to your partner dashboard</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } hidden lg:block bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
                <Shield className="text-white" size={18} />
              </div>
              <span className="font-bold text-gray-900">Partner Dashboard</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4 px-2">
            {menuItems.map(item => renderMenuItem(item))}
          </div>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-200">
            {sidebarOpen && user && (
              <div className="mb-3 px-2">
                <p className="text-sm font-medium text-gray-900">{user.username}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white">
            <div className="h-full flex flex-col">
              {/* Logo */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
                    <Shield className="text-white" size={18} />
                  </div>
                  <span className="font-bold text-gray-900">Partner Dashboard</span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto py-4 px-2">
                {menuItems.map(item => renderMenuItem(item))}
              </div>

              {/* User Info & Logout */}
              <div className="p-4 border-t border-gray-200">
                {user && (
                  <div className="mb-3 px-2">
                    <p className="text-sm font-medium text-gray-900">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
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
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};



