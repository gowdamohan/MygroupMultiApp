import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Grid3x3, 
  BarChart3, 
  Settings, 
  Shield,
  Menu, 
  X, 
  Bell, 
  Search, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Package,
  FileText,
  Database
} from 'lucide-react';
import { Button } from '../components/ui/Button';

const navigationItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/dashboard/admin' },
  { id: 'users', label: 'Users', icon: Users, path: '/dashboard/admin/users' },
  { id: 'groups', label: 'Groups', icon: Grid3x3, path: '/dashboard/admin/groups' },
  { id: 'applications', label: 'Applications', icon: Package, path: '/dashboard/admin/applications' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/dashboard/admin/analytics' },
  { id: 'reports', label: 'Reports', icon: FileText, path: '/dashboard/admin/reports' },
  { id: 'database', label: 'Database', icon: Database, path: '/dashboard/admin/database' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/admin/settings' },
];

export default function AdminDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300 shadow-lg
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <Shield className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">My Group</h1>
                  <p className="text-xs text-gray-500">Admin Portal</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto">
                <Shield className="text-white" size={20} />
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block p-1 rounded hover:bg-gray-100"
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                      ${active 
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                      ${sidebarCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    <Icon size={20} />
                    {!sidebarCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate capitalize">{user?.role || 'Admin'}</p>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold mx-auto">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`
        transition-all duration-300
        ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
      `}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="h-full px-4 lg:px-6 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search users, groups, applications..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6 bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

