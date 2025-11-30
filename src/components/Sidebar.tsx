import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Users, Grid3x3, BarChart3, Settings, 
  ChevronLeft, ChevronRight, Shield, LogOut, User 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
}

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard/admin' },
  { id: 'users', label: 'Users', icon: Users, path: '/dashboard/admin/users' },
  { id: 'groups', label: 'Groups', icon: Grid3x3, path: '/dashboard/admin/groups' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/dashboard/admin/analytics' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/admin/settings' }
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed: externalCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const handleToggle = onToggle || (() => setInternalCollapsed(!internalCollapsed));

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 240 }}
      className="bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 shadow-sm"
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <Shield className="text-white" size={20} />
              </div>
              <div>
                <div className="text-gray-900">My Group</div>
                <div className="text-xs text-gray-500">Admin Portal</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <motion.button
              key={item.id}
              onClick={() => navigate(item.path)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${active
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Icon size={20} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-all
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white flex-shrink-0">
              A
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 text-left overflow-hidden"
                >
                  <div className="text-sm text-gray-900 truncate">Admin User</div>
                  <div className="text-xs text-gray-500 truncate">admin@mygroup.com</div>
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* User Menu Dropdown */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <User size={18} className="text-gray-600" />
                  <span className="text-sm text-gray-700">Profile</span>
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
                >
                  <LogOut size={18} className="text-gray-600" />
                  <span className="text-sm text-gray-700">Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
};
