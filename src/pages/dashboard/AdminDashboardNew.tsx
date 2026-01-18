import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Grid3x3, FileText, Globe, GraduationCap,
  Briefcase, Languages, Image, Heart, Building2, Database, HeadphonesIcon,
  LogOut, ChevronDown, ChevronRight, Menu, X, Bell, Search, User,
  Settings, Shield, Package, MapPin, Award, Newspaper, Calendar,
  Briefcase as Career, UserCheck, Milestone, MessageSquare, Mail,
  FileCheck, Scale, Lock, Copyright, FolderTree
} from 'lucide-react';

// Import admin pages
import { LanguageList } from '../admin/Content/LanguageList';
import { EducationList } from '../admin/Content/EducationList';
import { ProfessionList } from '../admin/Content/ProfessionList';
import { ContinentList } from '../admin/Content/Country/ContinentList';
import { CountryList } from '../admin/Content/Country/CountryList';
import { StateList } from '../admin/Content/Country/StateList';
import { DistrictList } from '../admin/Content/Country/DistrictList';
import { CreateAppsList } from '../admin/CreateApps/CreateAppsList';
import { CorporateLogin } from '../admin/CorporateLogin';
import { AccountsLogin } from '../admin/AccountsLogin';
import { CreateCategoryPage } from '../admin/CreateCategory';
import { AdminSupportChat } from '../admin/AdminSupportChat';
interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  children?: MenuItem[];
  adminOnly?: boolean;
  groupSpecific?: string[];
}

export const AdminDashboardNew: React.FC = () => {
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
      setUser(JSON.parse(userData));
    } else {
      navigate('/auth/admin');
    }
  }, [navigate]);

  // Render content based on current path
  const renderContent = () => {
    const path = location.pathname;
    console.log('Current path:', path);

    switch (path) {
      case '/admin/language':
        console.log('Rendering LanguageList');
        return <LanguageList />;
      case '/admin/education':
        console.log('Rendering EducationList');
        return <EducationList />;
      case '/admin/profession':
        console.log('Rendering ProfessionList');
        return <ProfessionList />;
      case '/admin/continent':
        console.log('Rendering ContinentList');
        return <ContinentList />;
      case '/admin/country':
        console.log('Rendering CountryList');
        return <CountryList />;
      case '/admin/state':
        console.log('Rendering StateList');
        return <StateList />;
      case '/admin/district':
        console.log('Rendering DistrictList');
        return <DistrictList />;
      case '/admin/create-apps':
        console.log('Rendering CreateAppsList');
        return <CreateAppsList />;
      case '/admin/corporate-login':
        console.log('Rendering CorporateLogin');
        return <CorporateLogin />;
      case '/admin/accounts-login':
        console.log('Rendering Accounts Login');
        return <AccountsLogin />;
      case '/admin/create-category':
        console.log('Rendering CreateCategoryPage');
        return <CreateCategoryPage />;
      case '/admin/support-chat':
        console.log('Rendering Support Chart');
        return <AdminSupportChat />;
      default:
        return (
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
              <p className="text-gray-600">Welcome to the Admin Dashboard. Use the sidebar to navigate.</p>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">Current path: {path}</p>
                <p className="text-sm text-blue-700 mt-2">Available routes:</p>
                <ul className="text-xs text-blue-600 mt-1 ml-4 list-disc">
                  <li>/admin/language - Language Management</li>
                  <li>/admin/education - Education Management</li>
                  <li>/admin/profession - Profession Management</li>
                  <li>/admin/continent - Continent Management</li>
                  <li>/admin/country - Country Management</li>
                  <li>/admin/state - State Management</li>
                  <li>/admin/district - District Management</li>
                </ul>
              </div>
            </div>
          </div>
        );
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard/admin'
    },
    {
      id: 'corporate-login',
      label: 'Corporate Login',
      icon: Building2,
      path: '/admin/corporate-login'
    },
    {
      id: 'accounts-login',
      label: 'Accounts Login',
      icon: Building2,
      path: '/admin/accounts-login'
    },
    {
      id: 'group-management',
      label: 'Group Management',
      icon: Grid3x3,
      children: [
        // { id: 'group', label: 'Group', icon: Package, path: '/admin/group' },
        // { id: 'created', label: 'Created', icon: FileCheck, path: '/admin/create' },
        { id: 'create-apps', label: 'Create Apps', icon: Package, path: '/admin/create-apps' },
        { id: 'create-category', label: 'Create Category', icon: FolderTree, path: '/admin/create-category' },
        // { id: 'advertise', label: 'Advertise', icon: Newspaper, path: '/admin/advertise' },
        // { id: 'group-account', label: 'Group Account', icon: UserCheck, path: '/admin/user-group-creation' },
        // { id: 'popup-add', label: 'Popup Add', icon: MessageSquare, path: '/admin/popup-add' }
        { id: 'change-password', label: 'Change Password', icon: MessageSquare, path: '/admin/change-password' }
      ]
    },
    {
      id: 'content',
      label: 'Content',
      icon: FileText,
      children: [
        { id: 'education', label: 'Education', icon: GraduationCap, path: '/admin/education' },
        { id: 'profession', label: 'Profession', icon: Briefcase, path: '/admin/profession' },
        { id: 'language', label: 'Language', icon: Languages, path: '/admin/language' }
      ]
    },
    {
      id: 'country-list',
      label: 'Location',
      icon: Globe,
      children: [
        { id: 'continent', label: 'Continent', icon: Globe, path: '/admin/continent' },
        { id: 'country', label: 'Country', icon: MapPin, path: '/admin/country' },
        { id: 'state', label: 'State', icon: MapPin, path: '/admin/state' },
        { id: 'district', label: 'District', icon: MapPin, path: '/admin/district' }
      ]
    },
    {
      id: 'needy-services',
      label: 'Needy Services',
      icon: Heart,
      groupSpecific: ['myneedy'],
      children: [
        { id: 'needy-category', label: 'Category', icon: Grid3x3, path: '/admin/needy-category' },
        { id: 'needy-sub-category', label: 'Sub Category', icon: Grid3x3, path: '/admin/needy-sub-category' },
        { id: 'needy-services', label: 'Services', icon: Heart, path: '/admin/needy-services' }
      ]
    },
    {
      id: 'union-management',
      label: 'Union Management',
      icon: Building2,
      groupSpecific: ['myunions'],
      children: [
        { id: 'union-category', label: 'Category', icon: Grid3x3, path: '/admin/category' },
        { id: 'member-reg', label: 'Member Registration', icon: UserCheck, path: '/admin/member-registration' },
        { id: 'director-reg', label: 'Director Registration', icon: UserCheck, path: '/admin/director-registration' },
        { id: 'header-reg', label: 'Header/Leader Registration', icon: UserCheck, path: '/admin/header-leader-registration' },
        { id: 'staff-reg', label: 'Staff Registration', icon: UserCheck, path: '/admin/staff-registration' },
        { id: 'member-app', label: 'Member Applications', icon: FileText, path: '/admin/member-application-form' },
        { id: 'director-app', label: 'Director Applications', icon: FileText, path: '/admin/director-application-form' },
        { id: 'header-app', label: 'Header/Leader Applications', icon: FileText, path: '/admin/header-leader-application-form' },
        { id: 'staff-app', label: 'Staff Applications', icon: FileText, path: '/admin/staff-application-form' }
      ]
    },
    {
      id: 'database',
      label: 'Database',
      icon: Database,
      children: [
        { id: 'client-db', label: 'Client Database', icon: Users, path: '/admin/client-database' },
        { id: 'public-db', label: 'Public Database', icon: Globe, path: '/admin/public-database' },
        { id: 'apply-db', label: 'Apply Database', icon: FileText, path: '/admin/apply-database' },
        { id: 'enquiry-db', label: 'Enquiry Database', icon: Mail, path: '/admin/enquiry-database' },
        { id: 'franchise-db', label: 'Franchise Database', icon: Building2, path: '/admin/franchise-database' },
        { id: 'job-db', label: 'Job Database', icon: Briefcase, path: '/admin/job-database' },
        { id: 'feedback-db', label: 'Feedback Database', icon: MessageSquare, path: '/admin/feedback-database' }
      ]
    },
    {
      id: 'supports',
      label: 'Supports',
      icon: HeadphonesIcon,
      children: [
        { id: 'feedback', label: 'Feedback and Suggestions', icon: MessageSquare, path: '/admin/feedback-users' },
        { id: 'support-chat', label: 'Support Chat', icon: MessageSquare, path: '/admin/support-chat' }
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
    navigate('/auth/admin');
  };

  console.log('MenuItem', menuItems);

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    // Check if menu should be shown based on user role and group
    if (item.adminOnly && user?.group_id !== 0) return null;
    if (item.groupSpecific && !item.groupSpecific.includes(user?.groupDetails?.name?.toLowerCase())) return null;

    const isExpanded = expandedMenus.includes(item.id);
    const isActive = activeMenu === item.id;
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        <button
          onClick={() => handleMenuClick(item)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
            isActive
              ? 'bg-primary-50 text-primary-700 border-r-3 border-primary-700'
              : 'text-gray-700 hover:bg-gray-100'
          } ${level > 0 ? 'pl-' + (4 + level * 4) : ''}`}
        >
          <Icon size={18} />
          <span className="flex-1 text-left">{item.label}</span>
          {hasChildren && (
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
              <span className="font-bold text-gray-900">My Group</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

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
                    <span className="font-bold text-gray-900">My Group</span>
                  </div>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

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
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
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
                <div className="text-xs text-gray-500">Administrator</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-medium">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

