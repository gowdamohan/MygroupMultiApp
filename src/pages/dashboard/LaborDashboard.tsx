import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, UserPlus, Building2, UserCheck, ClipboardList,
  LogOut, Menu, X, Search, Bell, Settings, Shield, Calendar,
  Clock, TrendingUp, BarChart3, AlertCircle, CheckCircle2, Briefcase
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  requiresPermission?: boolean;
}

interface DashboardStats {
  totalLabors: number;
  presentToday: number;
  absentToday: number;
  contractors: number;
  subContractors: number;
  teamLeaders: number;
}

interface Permission {
  laborDetails: boolean;
  attendance: boolean;
}

export const LaborDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [permissions, setPermissions] = useState<Permission>({
    laborDetails: true,
    attendance: true
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalLabors: 245,
    presentToday: 198,
    absentToday: 47,
    contractors: 12,
    subContractors: 28,
    teamLeaders: 15
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // In a real app, fetch permissions from backend
      // For now, we'll use default permissions
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
      path: '/dashboard/labor'
    },
    {
      id: 'add-category',
      label: 'Add Category',
      icon: Building2,
      path: '/labor/category'
    },
    {
      id: 'contractor',
      label: 'Contractor',
      icon: Briefcase,
      path: '/labor/contractor'
    },
    {
      id: 'sub-contractor',
      label: 'Sub Contractor',
      icon: Users,
      path: '/labor/category1'
    },
    {
      id: 'team-leaders',
      label: 'Team Leaders',
      icon: UserCheck,
      path: '/labor/category2'
    },
    {
      id: 'add-labors',
      label: 'Add Labors',
      icon: UserPlus,
      path: '/labor/labor-details'
    },
    {
      id: 'labors-details',
      label: 'Labors Details',
      icon: ClipboardList,
      path: '/labor/labor-details-separate',
      requiresPermission: true
    },
    {
      id: 'create-login',
      label: 'Create Login',
      icon: Shield,
      path: '/labor/labor-create-login'
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: Calendar,
      path: '/labor/attendance',
      requiresPermission: true
    }
  ];

  const handleMenuClick = (item: MenuItem) => {
    if (item.path) {
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

  const renderMenuItem = (item: MenuItem) => {
    const isActive = activeMenu === item.id;
    const Icon = item.icon;
    const hasPermission = !item.requiresPermission || 
      (item.id === 'labors-details' && permissions.laborDetails) ||
      (item.id === 'attendance' && permissions.attendance);

    if (!hasPermission) {
      return null;
    }

    return (
      <button
        key={item.id}
        onClick={() => handleMenuClick(item)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
          isActive
            ? 'bg-primary-50 text-primary-700 border-r-3 border-primary-700'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Icon size={18} />
        <span className="flex-1 text-left">{item.label}</span>
      </button>
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center">
                <Users className="text-white" size={18} />
              </div>
              <span className="font-bold text-gray-900">Labor</span>
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
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center">
                      <Users className="text-white" size={18} />
                    </div>
                    <span className="font-bold text-gray-900">Labor</span>
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
            <h1 className="text-xl font-bold text-gray-900">Labor Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search labors..."
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
                <div className="text-xs text-gray-500">Labor Manager</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white font-medium">
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

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Clock Widget */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 shadow-lg text-white">
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

                {/* Total Labors */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users className="text-blue-600" size={24} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalLabors}</div>
                  <div className="text-sm text-gray-600">Total Labors</div>
                </div>

                {/* Present Today */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="text-green-600" size={24} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.presentToday}</div>
                  <div className="text-sm text-gray-600">Present Today</div>
                  <div className="mt-2 text-xs text-green-600 font-medium">
                    {((stats.presentToday / stats.totalLabors) * 100).toFixed(1)}% Attendance
                  </div>
                </div>

                {/* Absent Today */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                      <AlertCircle className="text-red-600" size={24} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.absentToday}</div>
                  <div className="text-sm text-gray-600">Absent Today</div>
                  <div className="mt-2 text-xs text-red-600 font-medium">
                    {((stats.absentToday / stats.totalLabors) * 100).toFixed(1)}% Absent
                  </div>
                </div>
              </div>

              {/* Dashboard Tiles (Permission-based) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Labors Details Tile */}
                {permissions.laborDetails && (
                  <div
                    onClick={() => navigate('/labor/labor-details-separate')}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <ClipboardList className="text-purple-600" size={24} />
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Enabled</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Labors Details</h3>
                    <p className="text-sm text-gray-600">View and manage detailed labor information</p>
                    <div className="mt-4 flex items-center text-sm text-indigo-600 font-medium">
                      View Details →
                    </div>
                  </div>
                )}

                {/* Attendance Tile */}
                {permissions.attendance && (
                  <div
                    onClick={() => navigate('/labor/attendance')}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Calendar className="text-orange-600" size={24} />
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Enabled</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance</h3>
                    <p className="text-sm text-gray-600">Track and manage labor attendance records</p>
                    <div className="mt-4 flex items-center text-sm text-indigo-600 font-medium">
                      Manage Attendance →
                    </div>
                  </div>
                )}

                {/* Contractors Summary */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
                      <Briefcase className="text-teal-600" size={24} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contractors Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Contractors</span>
                      <span className="text-sm font-medium text-gray-900">{stats.contractors}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Sub Contractors</span>
                      <span className="text-sm font-medium text-gray-900">{stats.subContractors}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Team Leaders</span>
                      <span className="text-sm font-medium text-gray-900">{stats.teamLeaders}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => navigate('/labor/labor-details')}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <UserPlus className="text-blue-600" size={24} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Add Labor</span>
                  </button>

                  <button
                    onClick={() => navigate('/labor/contractor')}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
                      <Briefcase className="text-teal-600" size={24} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Contractor</span>
                  </button>

                  <button
                    onClick={() => navigate('/labor/category2')}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <UserCheck className="text-purple-600" size={24} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Team Leaders</span>
                  </button>

                  <button
                    onClick={() => navigate('/labor/labor-create-login')}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Shield className="text-indigo-600" size={24} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Create Login</span>
                  </button>
                </div>
              </div>

              {/* Attendance Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Weekly Attendance Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Attendance</h3>
                  <div className="space-y-3">
                    {[
                      { day: 'Monday', present: 210, absent: 35 },
                      { day: 'Tuesday', present: 205, absent: 40 },
                      { day: 'Wednesday', present: 215, absent: 30 },
                      { day: 'Thursday', present: 198, absent: 47 },
                      { day: 'Friday', present: 220, absent: 25 },
                      { day: 'Saturday', present: 180, absent: 65 },
                      { day: 'Sunday', present: 0, absent: 0 }
                    ].map((item, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 font-medium">{item.day}</span>
                          <span className="text-gray-600">
                            {item.present > 0 ? `${item.present} / ${item.present + item.absent}` : 'Off'}
                          </span>
                        </div>
                        {item.present > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${(item.present / (item.present + item.absent)) * 100}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Labors */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Added Labors</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Rajesh Kumar', contractor: 'ABC Contractors', date: '2 days ago', status: 'Active' },
                      { name: 'Suresh Patel', contractor: 'XYZ Builders', date: '3 days ago', status: 'Active' },
                      { name: 'Mahesh Singh', contractor: 'ABC Contractors', date: '5 days ago', status: 'Active' },
                      { name: 'Ramesh Yadav', contractor: 'DEF Construction', date: '1 week ago', status: 'Active' },
                      { name: 'Dinesh Sharma', contractor: 'XYZ Builders', date: '1 week ago', status: 'Active' }
                    ].map((labor, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white font-medium text-sm">
                          {labor.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{labor.name}</div>
                          <div className="text-xs text-gray-600">{labor.contractor}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">{labor.date}</div>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            {labor.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { user: 'Admin', action: 'Added new labor: Rajesh Kumar', time: '10 min ago', type: 'success' },
                    { user: 'Manager', action: 'Updated attendance for today', time: '25 min ago', type: 'info' },
                    { user: 'Admin', action: 'Created new contractor: ABC Contractors', time: '1 hour ago', type: 'success' },
                    { user: 'Supervisor', action: 'Assigned team leader to Site A', time: '2 hours ago', type: 'info' },
                    { user: 'Admin', action: 'Generated login for 5 new labors', time: '3 hours ago', type: 'success' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white font-medium text-sm">
                        {activity.user[0]}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{activity.user}</div>
                        <div className="text-xs text-gray-600">{activity.action}</div>
                      </div>
                      <div className="text-xs text-gray-500">{activity.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};



