import React, { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft,
  Bell, 
  Search, 
  Settings, 
  LogOut,
  Menu,
  X,
  MoreVertical
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function AppLayout({ 
  appName = 'Application',
  appIcon: AppIcon,
  appColor = 'from-blue-500 to-blue-700',
  navigation = [],
  showBackButton = true
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Header */}
      <header className={`bg-gradient-to-r ${appColor} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <button
                  onClick={handleBack}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              
              <div className="flex items-center gap-3">
                {AppIcon && (
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <AppIcon size={24} />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold">{appName}</h1>
                  <p className="text-xs text-white/80">Welcome, {user?.first_name}</p>
                </div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-white/10 relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 rounded-lg hover:bg-white/10">
                <Settings size={20} />
              </button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="border-white/30 text-white hover:bg-white/10"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Navigation Tabs */}
          {navigation.length > 0 && (
            <nav className="hidden md:flex gap-1 pb-2">
              {navigation.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className="px-4 py-2 rounded-t-lg hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 bg-white/10 backdrop-blur-sm">
            <div className="px-4 py-3 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-white/20 space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10">
                  <Bell size={20} />
                  <span>Notifications</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10">
                  <Settings size={20} />
                  <span>Settings</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}

