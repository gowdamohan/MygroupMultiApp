import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home,
  MessageSquare, 
  BookOpen, 
  Heart, 
  ShoppingBag,
  Tv,
  Radio,
  Users,
  Menu, 
  X, 
  Bell, 
  Search, 
  LogOut,
  User,
  Settings
} from 'lucide-react';
import { Button } from '../components/ui/Button';

const clientNavigation = [
  { id: 'home', label: 'Home', icon: Home, path: '/dashboard' },
  { id: 'mychat', label: 'MyChat', icon: MessageSquare, path: '/dashboard/mychat' },
  { id: 'mydiary', label: 'MyDiary', icon: BookOpen, path: '/dashboard/mydiary' },
  { id: 'myneedy', label: 'MyNeedy', icon: Heart, path: '/dashboard/myneedy' },
  { id: 'myshop', label: 'MyShop', icon: ShoppingBag, path: '/dashboard/myshop' },
  { id: 'mytv', label: 'MyTV', icon: Tv, path: '/dashboard/mytv' },
  { id: 'mymedia', label: 'MyMedia', icon: Radio, path: '/dashboard/mymedia' },
  { id: 'myunions', label: 'MyUnions', icon: Users, path: '/dashboard/myunions' },
];

export default function ClientDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
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
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                MG
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">My Group</h1>
                <p className="text-xs text-gray-500">Your Apps</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {clientNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                      ${active 
                        ? 'bg-primary-50 text-primary-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Settings at bottom of nav */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              <Link
                to="/dashboard/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>
            </div>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="h-full px-4 lg:px-6 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="flex-1 max-w-xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search applications..."
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

