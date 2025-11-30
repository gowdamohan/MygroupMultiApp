import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, User, Lock, Image, Calendar, Bell, MessageSquare,
  Mail, LogOut, ChevronDown, ChevronRight, Menu, X, Search,
  Settings, Shield, Camera, MapPin, Clock, FileText, Users,
  Award, Newspaper, Video, Heart, Building2, CreditCard, Medal,
  Eye, Phone, Share2, Link as LinkIcon, Upload, CheckCircle,
  AlertCircle, Package, DollarSign, Briefcase, FileCheck
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  children?: MenuItem[];
  requiresProfileComplete?: boolean;
}

export const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [clientType, setClientType] = useState<'god' | 'media' | 'union'>('god');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Determine client type based on user data
      if (parsedUser.role === 'client_god') {
        setClientType('god');
      } else if (parsedUser.groupDetails?.name?.toLowerCase().includes('media')) {
        setClientType('media');
      } else if (parsedUser.groupDetails?.name?.toLowerCase().includes('union')) {
        setClientType('union');
      }
      
      // Check profile completion
      setProfileComplete(parsedUser.profileComplete || false);
    } else {
      navigate('/auth/login');
    }
  }, [navigate]);

  // God/Temple Dashboard Menu
  const godMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard/client'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      children: [
        { id: 'details', label: 'Details', icon: FileText, path: '/client/mygod-profile-details' },
        { id: 'social-media', label: 'Social Media Links', icon: Share2, path: '/client/mygod-social-link' },
        { id: 'live-link', label: 'Live Link', icon: Video, path: '/client/mygod-livelink' },
        { id: 'admin-details', label: 'Admin Details', icon: Shield, path: '/client/mygod-admin-details' },
        { id: 'change-password', label: 'Change Password', icon: Lock, path: '/client/change-password' }
      ]
    },
    {
      id: 'god-gallery',
      label: 'God Gallery',
      icon: Image,
      children: [
        { id: 'create-gallery', label: 'Create Gallery', icon: Upload, path: '/client/god-gallery', requiresProfileComplete: true },
        { id: 'view-gallery', label: 'View Gallery', icon: Eye, path: '/client/god-gallery-view', requiresProfileComplete: true }
      ]
    },
    {
      id: 'god-photos',
      label: 'God Photos',
      icon: Camera,
      children: [
        { id: 'upload-photos', label: 'Upload Photos', icon: Upload, path: '/client/god-photo', requiresProfileComplete: true },
        { id: 'today-photo', label: "Today's Photo", icon: Calendar, path: '/client/god-today-photo', requiresProfileComplete: true }
      ]
    },
    {
      id: 'temple-info',
      label: 'Temple Information',
      icon: Building2,
      children: [
        { id: 'description', label: 'Description', icon: FileText, path: '/client/god-description', requiresProfileComplete: true },
        { id: 'pooja-timings', label: 'Pooja Timings', icon: Clock, path: '/client/god-pooja-timings', requiresProfileComplete: true },
        { id: 'temple-timings', label: 'Temple Timings', icon: Clock, path: '/client/god-timings', requiresProfileComplete: true },
        { id: 'how-to-reach', label: 'How to Reach', icon: MapPin, path: '/client/god-how-to-reach', requiresProfileComplete: true },
        { id: 'must-visit', label: 'Must Visit', icon: MapPin, path: '/client/god-must-visit', requiresProfileComplete: true },
        { id: 'nearest-places', label: 'Nearest Places', icon: MapPin, path: '/client/god-nearest-places', requiresProfileComplete: true }
      ]
    },
    {
      id: 'events-notices',
      label: 'Events & Notices',
      icon: Calendar,
      children: [
        { id: 'events', label: 'Events', icon: Calendar, path: '/client/god-event', requiresProfileComplete: true },
        { id: 'notices', label: 'Notices', icon: Bell, path: '/client/god-notice', requiresProfileComplete: true }
      ]
    },
    {
      id: 'support',
      label: 'Support',
      icon: MessageSquare,
      children: [
        { id: 'enquiry', label: 'Enquiry', icon: Mail, path: '/client/enquiry' },
        { id: 'feedback', label: 'Feedback and Suggestions', icon: MessageSquare, path: '/client/feedback' },
        { id: 'chat', label: 'Chat Box', icon: MessageSquare, path: '/client/chat' }
      ]
    }
  ];

  // Media Dashboard Menu
  const mediaMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard/client'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      children: [
        { id: 'edit-profile', label: 'Edit Profile', icon: User, path: '/client/edit-profile' },
        { id: 'change-password', label: 'Change Password', icon: Lock, path: '/client/change-password' }
      ]
    },
    {
      id: 'create-media',
      label: 'Create Media',
      icon: Video,
      path: '/client/media-dashboard',
      requiresProfileComplete: true
    },
    {
      id: 'needy-services',
      label: 'Needy Services',
      icon: Heart,
      children: [
        { id: 'create-service', label: 'Create Service', icon: Upload, path: '/client/needy-create-form', requiresProfileComplete: true },
        { id: 'view-services', label: 'View Services', icon: Eye, path: '/client/needy-view', requiresProfileComplete: true }
      ]
    },
    {
      id: 'support',
      label: 'Support',
      icon: MessageSquare,
      children: [
        { id: 'enquiry', label: 'Enquiry', icon: Mail, path: '/client/enquiry' },
        { id: 'feedback', label: 'Feedback and Suggestions', icon: MessageSquare, path: '/client/feedback' },
        { id: 'live-chat', label: 'Live Chat', icon: MessageSquare, path: '/client/live-chat' }
      ]
    }
  ];

  // Union Dashboard Menu
  const unionMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard/client'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      children: [
        { id: 'logo-name', label: 'Logo and Name', icon: Image, path: '/client/unions-details' },
        { id: 'about-us', label: 'About Us', icon: FileText, path: '/client/client-about-us' },
        { id: 'documents', label: 'Documents', icon: FileCheck, path: '/client/client-document' },
        { id: 'admin-details', label: 'Admin Details', icon: Shield, path: '/client/client-admin-details' },
        { id: 'awards', label: 'Awards', icon: Award, path: '/client/client-awards' },
        { id: 'objectives', label: 'Objectives', icon: FileText, path: '/client/client-objectives' },
        { id: 'newsletter', label: 'News Letter', icon: Newspaper, path: '/client/client-news-letter' },
        { id: 'change-password', label: 'Change Password', icon: Lock, path: '/client/change-password' }
      ]
    },
    {
      id: 'app-settings',
      label: 'Application Settings',
      icon: Settings,
      children: [
        { id: 'create-app', label: 'Create Application', icon: Upload, path: '/client/member-create-form', requiresProfileComplete: true },
        { id: 'enabled-public', label: 'Enabled for Public', icon: Eye, path: '/client/enabled-for-public', requiresProfileComplete: true },
        { id: 'member-validity', label: 'Members Validity', icon: CheckCircle, path: '/client/member-validity', requiresProfileComplete: true },
        { id: 'member-fees', label: 'Members Fees', icon: DollarSign, path: '/client/member-fees', requiresProfileComplete: true }
      ]
    },
    {
      id: 'member-mgmt',
      label: 'Member Management',
      icon: Users,
      children: [
        { id: 'member-reg', label: 'Member Registration', icon: User, path: '/client/member-registration', requiresProfileComplete: true },
        { id: 'director-reg', label: 'Director Registration', icon: Briefcase, path: '/client/director-registration', requiresProfileComplete: true },
        { id: 'header-reg', label: 'Header/Leader Registration', icon: Shield, path: '/client/header-leader-registration', requiresProfileComplete: true },
        { id: 'staff-reg', label: 'Staff Registration', icon: Users, path: '/client/staff-registration', requiresProfileComplete: true }
      ]
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: FileText,
      children: [
        { id: 'member-app', label: 'Member Applications', icon: FileText, path: '/client/member-application-form', requiresProfileComplete: true },
        { id: 'director-app', label: 'Director Applications', icon: FileText, path: '/client/director-application-form', requiresProfileComplete: true },
        { id: 'header-app', label: 'Header/Leader Applications', icon: FileText, path: '/client/header-leader-application-form', requiresProfileComplete: true },
        { id: 'staff-app', label: 'Staff Applications', icon: FileText, path: '/client/staff-application-form', requiresProfileComplete: true }
      ]
    },
    {
      id: 'union-features',
      label: 'Union Features',
      icon: Building2,
      children: [
        { id: 'news', label: 'News', icon: Newspaper, path: '/client/union-news', requiresProfileComplete: true },
        { id: 'notice', label: 'Notice', icon: Bell, path: '/client/union-notice', requiresProfileComplete: true },
        { id: 'meetings', label: 'Meetings', icon: Calendar, path: '/client/union-meetings', requiresProfileComplete: true },
        { id: 'invitations', label: 'Invitations', icon: Mail, path: '/client/union-invitations', requiresProfileComplete: true }
      ]
    },
    {
      id: 'design',
      label: 'Design',
      icon: Image,
      children: [
        { id: 'id-card', label: 'ID Card', icon: CreditCard, path: '/client/id-card', requiresProfileComplete: true },
        { id: 'certificate', label: 'Certificate', icon: Award, path: '/client/certificate', requiresProfileComplete: true },
        { id: 'letterhead', label: 'Letterhead', icon: FileText, path: '/client/letterhead', requiresProfileComplete: true },
        { id: 'visiting-card', label: 'Visiting Card', icon: CreditCard, path: '/client/visiting-card', requiresProfileComplete: true },
        { id: 'invoice', label: 'Invoice', icon: FileCheck, path: '/client/invoice', requiresProfileComplete: true },
        { id: 'medals', label: 'Medals', icon: Medal, path: '/client/medals', requiresProfileComplete: true }
      ]
    },
    {
      id: 'medal',
      label: 'Medal',
      icon: Medal,
      path: '/client/medal',
      requiresProfileComplete: true
    },
    {
      id: 'certificates',
      label: 'Certificates',
      icon: Award,
      path: '/client/certificates',
      requiresProfileComplete: true
    },
    {
      id: 'visibility',
      label: 'Visibility',
      icon: Eye,
      path: '/client/visibility',
      requiresProfileComplete: true
    },
    {
      id: 'footer',
      label: 'Footer',
      icon: FileText,
      children: [
        { id: 'about-union', label: 'About Union', icon: FileText, path: '/client/client-about', requiresProfileComplete: true },
        { id: 'contact', label: 'Contact', icon: Phone, path: '/client/client-contact', requiresProfileComplete: true }
      ]
    },
    {
      id: 'support',
      label: 'Support',
      icon: MessageSquare,
      children: [
        { id: 'enquiry', label: 'Enquiry', icon: Mail, path: '/client/enquiry' },
        { id: 'feedback', label: 'Feedback and Suggestions', icon: MessageSquare, path: '/client/feedback' },
        { id: 'live-chat', label: 'Live Chat', icon: MessageSquare, path: '/client/live-chat' }
      ]
    }
  ];

  const getMenuItems = () => {
    switch (clientType) {
      case 'god':
        return godMenuItems;
      case 'media':
        return mediaMenuItems;
      case 'union':
        return unionMenuItems;
      default:
        return godMenuItems;
    }
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.requiresProfileComplete && !profileComplete) {
      alert('Please complete your profile first to access this feature.');
      return;
    }

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
    navigate('/auth/login');
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedMenus.includes(item.id);
    const isActive = activeMenu === item.id;
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isDisabled = item.requiresProfileComplete && !profileComplete;

    return (
      <div key={item.id}>
        <button
          onClick={() => handleMenuClick(item)}
          disabled={isDisabled}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
            isActive
              ? 'bg-primary-50 text-primary-700 border-r-3 border-primary-700'
              : isDisabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          } ${level > 0 ? 'pl-' + (4 + level * 4) : ''}`}
        >
          <Icon size={18} />
          <span className="flex-1 text-left">{item.label}</span>
          {isDisabled && <Lock size={14} className="text-gray-400" />}
          {hasChildren && !isDisabled && (
            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="bg-gray-50">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const menuItems = getMenuItems();

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
              <span className="font-bold text-gray-900">
                {clientType === 'god' ? 'Temple' : clientType === 'media' ? 'Media' : 'Union'} Dashboard
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Profile Completion Alert */}
          {!profileComplete && (
            <div className="m-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-yellow-800">
                  <p className="font-medium mb-1">Complete Your Profile</p>
                  <p>Some features are disabled until you complete your profile.</p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-4">
            {menuItems.map(item => renderMenuItem(item))}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 lg:hidden shadow-xl"
            >
              <div className="h-full flex flex-col">
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
                      <Shield className="text-white" size={18} />
                    </div>
                    <span className="font-bold text-gray-900">
                      {clientType === 'god' ? 'Temple' : clientType === 'media' ? 'Media' : 'Union'} Dashboard
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Profile Completion Alert */}
                {!profileComplete && (
                  <div className="m-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                      <div className="text-xs text-yellow-800">
                        <p className="font-medium mb-1">Complete Your Profile</p>
                        <p>Some features are disabled until you complete your profile.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto py-4">
                  {menuItems.map(item => renderMenuItem(item))}
                </div>

                {/* Logout */}
                <div className="border-t border-gray-200 p-4">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden lg:block"
              >
                <Menu size={20} />
              </button>
            )}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {clientType === 'god' ? 'Temple' : clientType === 'media' ? 'Media' : 'Union'} Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-64"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-xs text-gray-500 capitalize">{clientType} Client</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-medium">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Dashboard Overview */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

              {/* Profile Status */}
              {!profileComplete && (
                <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="text-yellow-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Your Profile</h3>
                      <p className="text-gray-700 mb-4">
                        Your profile is incomplete. Please complete your profile to unlock all features and start using the platform.
                      </p>
                      <button
                        onClick={() => navigate('/client/edit-profile')}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Complete Profile Now
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {clientType === 'god' && (
                  <>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Image className="text-blue-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">245</div>
                      <div className="text-sm text-gray-600">Gallery Photos</div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Calendar className="text-purple-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">12</div>
                      <div className="text-sm text-gray-600">Upcoming Events</div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                          <Bell className="text-green-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">8</div>
                      <div className="text-sm text-gray-600">Active Notices</div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Users className="text-orange-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">1,234</div>
                      <div className="text-sm text-gray-600">Total Visitors</div>
                    </div>
                  </>
                )}

                {clientType === 'media' && (
                  <>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Video className="text-blue-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">56</div>
                      <div className="text-sm text-gray-600">Media Posts</div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Heart className="text-purple-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">23</div>
                      <div className="text-sm text-gray-600">Needy Services</div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                          <Eye className="text-green-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">8,432</div>
                      <div className="text-sm text-gray-600">Total Views</div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                          <MessageSquare className="text-orange-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">145</div>
                      <div className="text-sm text-gray-600">Comments</div>
                    </div>
                  </>
                )}

                {clientType === 'union' && (
                  <>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Users className="text-blue-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">342</div>
                      <div className="text-sm text-gray-600">Total Members</div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                          <FileText className="text-purple-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">28</div>
                      <div className="text-sm text-gray-600">Pending Applications</div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                          <Calendar className="text-green-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">5</div>
                      <div className="text-sm text-gray-600">Upcoming Meetings</div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Award className="text-orange-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">67</div>
                      <div className="text-sm text-gray-600">Certificates Issued</div>
                    </div>
                  </>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {clientType === 'god' && (
                    <>
                      <button
                        onClick={() => navigate('/client/god-gallery')}
                        disabled={!profileComplete}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                          <Image className="text-primary-600" size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Upload Photos</span>
                      </button>

                      <button
                        onClick={() => navigate('/client/god-event')}
                        disabled={!profileComplete}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Calendar className="text-blue-600" size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Create Event</span>
                      </button>

                      <button
                        onClick={() => navigate('/client/god-notice')}
                        disabled={!profileComplete}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Bell className="text-purple-600" size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Post Notice</span>
                      </button>

                      <button
                        onClick={() => navigate('/client/mygod-profile-details')}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                          <User className="text-green-600" size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Edit Profile</span>
                      </button>
                    </>
                  )}

                  {clientType === 'media' && (
                    <>
                      <button
                        onClick={() => navigate('/client/media-dashboard')}
                        disabled={!profileComplete}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                          <Video className="text-primary-600" size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Create Media</span>
                      </button>

                      <button
                        onClick={() => navigate('/client/needy-create-form')}
                        disabled={!profileComplete}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Heart className="text-blue-600" size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Create Service</span>
                      </button>

                      <button
                        onClick={() => navigate('/client/needy-view')}
                        disabled={!profileComplete}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Eye className="text-purple-600" size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">View Services</span>
                      </button>

                      <button
                        onClick={() => navigate('/client/edit-profile')}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                          <User className="text-green-600" size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Edit Profile</span>
                      </button>
                    </>
                  )}

                  {clientType === 'union' && (
                    <>
                      <button
                        onClick={() => navigate('/client/member-registration')}
                        disabled={!profileComplete}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                          <Users className="text-primary-600" size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Add Member</span>
                      </button>

                      <button
                        onClick={() => navigate('/client/union-meetings')}
                        disabled={!profileComplete}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Calendar className="text-blue-600" size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Schedule Meeting</span>
                      </button>

                      <button
                        onClick={() => navigate('/client/certificate')}
                        disabled={!profileComplete}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Award className="text-purple-600" size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Issue Certificate</span>
                      </button>

                      <button
                        onClick={() => navigate('/client/unions-details')}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                          <Building2 className="text-green-600" size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Union Details</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-medium text-sm">
                      <CheckCircle size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Profile Updated</div>
                      <div className="text-xs text-gray-600">Your profile information was updated successfully</div>
                    </div>
                    <div className="text-xs text-gray-500">2 hours ago</div>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-medium text-sm">
                      <Upload size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">New Content Added</div>
                      <div className="text-xs text-gray-600">You uploaded new content to your dashboard</div>
                    </div>
                    <div className="text-xs text-gray-500">5 hours ago</div>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white font-medium text-sm">
                      <MessageSquare size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">New Message Received</div>
                      <div className="text-xs text-gray-600">You have a new message from support</div>
                    </div>
                    <div className="text-xs text-gray-500">1 day ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};


