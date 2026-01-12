import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Building2, MapPin, TrendingUp, LogOut,
  ChevronDown, ChevronRight, Menu, X, Search, Bell, Settings,
  User, Lock, FileText, Wallet, Truck, Calculator, Database,
  Clock, BarChart3, DollarSign, Package, Shield, Mail
} from 'lucide-react';
import { RegionalOfficeLogin } from '../franchise/RegionalOfficeLogin';
import { BranchOfficeLogin } from '../franchise/BranchOfficeLogin';
import { Accounts } from '../franchise/Accounts';
import { FranchiseHeaderAds } from '../franchise/FranchiseHeaderAds';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  children?: MenuItem[];
  roleRestriction?: string[]; // Only show for these roles
}

interface DashboardStats {
  regionalOfficeUsers: number;
  branchOfficeUsers: number;
  regionalOfficeAds: any[];
  branchOfficeAds: any[];
  franchiseAds: any[];
}

export const FranchiseDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'head_office' | 'regional' | 'branch'>('head_office');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats>({
    regionalOfficeUsers: 375,
    branchOfficeUsers: 735,
    regionalOfficeAds: [],
    branchOfficeAds: [],
    franchiseAds: []
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Determine user role from groups
      if (parsedUser.groups && parsedUser.groups.length > 0) {
        const role = parsedUser.groups[0].name;
        if (role === 'head_office' || role === 'regional' || role === 'branch') {
          setUserRole(role);
        }
      }
    } else {
      navigate('/auth/login');
    }

    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard/franchise'
    },
    {
      id: 'regional-office-login',
      label: 'Regional Office Login',
      icon: MapPin,
      path: '/franchise/create-regional-office-login',
      roleRestriction: ['head_office']
    },
    {
      id: 'branch-office-login',
      label: 'Branch Office Login',
      icon: Building2,
      path: '/franchise/create-branch-office-login',
      roleRestriction: ['head_office']
    },
    {
      id: 'offer-ads',
      label: 'Offer Ads',
      icon: Package,
      path: '/franchise/franchise-offer-ads',
      roleRestriction: ['head_office']
    },
    {
      id: 'advertisement',
      label: 'Advertisement',
      icon: TrendingUp,
      children: [
        { 
          id: 'header-ads', 
          label: 'Header Ads', 
          icon: BarChart3, 
          path: '/franchise/create-header-ads-head-office',
          roleRestriction: ['head_office', 'regional']
        },
        { 
          id: 'header-ads-1', 
          label: 'Header Ads -1', 
          icon: BarChart3, 
          path: '/franchise/create-header-ads-branch-office',
          roleRestriction: ['branch']
        }
      ]
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      children: [
        { id: 'admin-details', label: 'Admin Details', icon: User, path: '/franchise/admin-details' },
        { id: 'office-address', label: 'Office Address', icon: MapPin, path: '/franchise/office-address' },
        { id: 'terms', label: 'Terms and Conditions', icon: FileText, path: '/franchise/terms-conditions-view' },
        { id: 'change-password', label: 'Change Password', icon: Lock, path: '/franchise/change-password' }
      ]
    },
    {
      id: 'franchise-wallet',
      label: 'Franchise Wallet',
      icon: Wallet,
      path: '/franchise/wallet'
    },
    {
      id: 'shipping-details',
      label: 'Shipping Details',
      icon: Truck,
      path: '/franchise/shipping-details'
    },
    {
      id: 'accounts',
      label: 'Accounts',
      icon: Calculator,
      path: '/franchise/accounts'
    },
    {
      id: 'client-database',
      label: 'Client Database',
      icon: Database,
      path: '/franchise/client-database'
    },
    {
      id: 'public-database',
      label: 'Public Database',
      icon: Database,
      path: '/franchise/public-database'
    }
  ];

  // Filter menu items based on user role
  const getFilteredMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter(item => {
      if (item.roleRestriction && !item.roleRestriction.includes(userRole)) {
        return false;
      }
      if (item.children) {
        item.children = getFilteredMenuItems(item.children);
      }
      return true;
    });
  };

  const filteredMenuItems = getFilteredMenuItems([...menuItems]);

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
    navigate('/auth/login');
  };

  const getRoleDisplayName = () => {
    const roleMap = {
      'head_office': 'Head Office',
      'regional': 'Regional Office',
      'branch': 'Branch Office'
    };
    return roleMap[userRole];
  };

  const getRoleColor = () => {
    const colorMap = {
      'head_office': 'from-purple-600 to-purple-700',
      'regional': 'from-green-600 to-green-700',
      'branch': 'from-orange-600 to-orange-700'
    };
    return colorMap[userRole];
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
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

  const renderContent = () => {
    const path = location.pathname;

    // Route to specific components based on path
    if (path === '/franchise/create-regional-office-login') {
      return <RegionalOfficeLogin />;
    }

    if (path === '/franchise/create-branch-office-login') {
      return <BranchOfficeLogin />;
    }

    if (path === '/franchise/accounts') {
      return <Accounts />;
    }

    if (path === '/franchise/create-header-ads-head-office') {
      return <FranchiseHeaderAds officeLevel="head_office" />;
    }

    if (path === '/franchise/create-header-ads-branch-office') {
      return <FranchiseHeaderAds officeLevel="branch" />;
    }

    // Default dashboard view
    return (
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Clock Widget */}
            <div className={`bg-gradient-to-br ${getRoleColor()} rounded-xl p-6 shadow-lg text-white`}>
              <div className="flex items-center justify-center mb-2">
                <Clock size={32} />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm opacity-90">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Regional Office Users (for head_office and regional) */}
            {(userRole === 'head_office' || userRole === 'regional') && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <MapPin className="text-green-600" size={24} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stats.regionalOfficeUsers}</div>
                <div className="text-sm text-gray-600">Regional Office Users</div>
              </div>
            )}

            {/* Branch Office Users */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Building2 className="text-orange-600" size={24} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.branchOfficeUsers}</div>
              <div className="text-sm text-gray-600">Branch Office Users</div>
            </div>
          </div>

          {/* Advertisement Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Regional Office Ads (for head_office) */}
            {userRole === 'head_office' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Regional Office Ads</h3>
                  <MapPin className="text-green-600" size={20} />
                </div>
                <div className="text-sm text-gray-600 mb-3">By State</div>
                <div className="space-y-2">
                  {[
                    { state: 'California', count: 67 },
                    { state: 'Texas', count: 54 },
                    { state: 'New York', count: 48 },
                    { state: 'Florida', count: 42 },
                    { state: 'Illinois', count: 35 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <span className="text-sm text-gray-700">{item.state}</span>
                      <span className="text-sm font-medium text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                  View All
                </button>
              </div>
            )}

            {/* Branch Office Ads (for head_office and regional) */}
            {(userRole === 'head_office' || userRole === 'regional') && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Branch Office Ads</h3>
                  <Building2 className="text-orange-600" size={20} />
                </div>
                <div className="text-sm text-gray-600 mb-3">By District</div>
                <div className="space-y-2">
                  {[
                    { district: 'Los Angeles', count: 89 },
                    { district: 'Houston', count: 76 },
                    { district: 'Manhattan', count: 71 },
                    { district: 'Miami', count: 63 },
                    { district: 'Chicago', count: 58 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <span className="text-sm text-gray-700">{item.district}</span>
                      <span className="text-sm font-medium text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium">
                  View All
                </button>
              </div>
            )}
          </div>

          {/* Rest of dashboard content continues... */}
        </div>
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
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getRoleColor()} flex items-center justify-center`}>
                <Building2 className="text-white" size={18} />
              </div>
              <span className="font-bold text-gray-900">Franchise</span>
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
            {filteredMenuItems.map(item => renderMenuItem(item))}
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
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getRoleColor()} flex items-center justify-center`}>
                      <Building2 className="text-white" size={18} />
                    </div>
                    <span className="font-bold text-gray-900">Franchise</span>
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
                  {filteredMenuItems.map(item => renderMenuItem(item))}
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
            <h1 className="text-xl font-bold text-gray-900">{getRoleDisplayName()} Dashboard</h1>
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
                <div className="text-xs text-gray-500">{getRoleDisplayName()}</div>
              </div>
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRoleColor()} flex items-center justify-center text-white font-medium`}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};



