import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Edit, Radio, Tv, Share2, FileText, Lock,
  Mail, MapPin, LogOut, Menu, X, Search, Bell, Settings,
  TrendingUp, Users, Eye, Heart, MessageSquare, Play, Globe
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  mediaTypeRestriction?: string[]; // Only show for these media types
}

interface DashboardStats {
  totalViews: number;
  totalSubscribers: number;
  totalLikes: number;
  totalComments: number;
  liveViewers?: number;
}

export const MediaChannelDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [mediaType, setMediaType] = useState<'tv' | 'radio' | 'newspaper' | 'magazine'>('tv');
  const [channelInfo, setChannelInfo] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalViews: 125430,
    totalSubscribers: 8542,
    totalLikes: 3421,
    totalComments: 892,
    liveViewers: 234
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Determine media type from user data or group details
      // For now, we'll use a default
      if (parsedUser.company?.toLowerCase().includes('tv')) {
        setMediaType('tv');
      } else if (parsedUser.company?.toLowerCase().includes('radio')) {
        setMediaType('radio');
      } else if (parsedUser.company?.toLowerCase().includes('newspaper')) {
        setMediaType('newspaper');
      } else if (parsedUser.company?.toLowerCase().includes('magazine')) {
        setMediaType('magazine');
      }
    } else {
      navigate('/auth/login');
    }
  }, [navigate]);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'My Media Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard/media'
    },
    {
      id: 'edit-channel',
      label: 'Edit Channel',
      icon: Edit,
      path: '/media/edit-channel'
    },
    {
      id: 'live-url',
      label: 'Live URL',
      icon: Play,
      path: `/media/live-url/${mediaType}`,
      mediaTypeRestriction: ['tv', 'radio']
    },
    {
      id: 'social-icon',
      label: 'Social Icon',
      icon: Share2,
      path: '/media/social-icon'
    },
    {
      id: 'terms',
      label: 'Terms & Conditions',
      icon: FileText,
      path: '/media/terms-conditions'
    },
    {
      id: 'privacy',
      label: 'Privacy & Policy',
      icon: Lock,
      path: '/media/privacy-policy'
    },
    {
      id: 'enquiry',
      label: 'Enquiry',
      icon: Mail,
      path: '/media/enquiry'
    },
    {
      id: 'address',
      label: 'Address',
      icon: MapPin,
      path: '/media/address'
    }
  ];

  // Filter menu items based on media type
  const getFilteredMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter(item => {
      if (item.mediaTypeRestriction && !item.mediaTypeRestriction.includes(mediaType)) {
        return false;
      }
      return true;
    });
  };

  const filteredMenuItems = getFilteredMenuItems([...menuItems]);

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

  const getMediaTypeIcon = () => {
    const iconMap = {
      'tv': Tv,
      'radio': Radio,
      'newspaper': FileText,
      'magazine': FileText
    };
    return iconMap[mediaType];
  };

  const getMediaTypeColor = () => {
    const colorMap = {
      'tv': 'from-red-600 to-red-700',
      'radio': 'from-blue-600 to-blue-700',
      'newspaper': 'from-gray-600 to-gray-700',
      'magazine': 'from-purple-600 to-purple-700'
    };
    return colorMap[mediaType];
  };

  const getMediaTypeLabel = () => {
    const labelMap = {
      'tv': 'TV Channel',
      'radio': 'Radio Station',
      'newspaper': 'Newspaper',
      'magazine': 'Magazine'
    };
    return labelMap[mediaType];
  };

  const renderMenuItem = (item: MenuItem) => {
    const isActive = activeMenu === item.id;
    const Icon = item.icon;

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

  const MediaIcon = getMediaTypeIcon();

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
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getMediaTypeColor()} flex items-center justify-center`}>
                <MediaIcon className="text-white" size={18} />
              </div>
              <span className="font-bold text-gray-900">Media</span>
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
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getMediaTypeColor()} flex items-center justify-center`}>
                      <MediaIcon className="text-white" size={18} />
                    </div>
                    <span className="font-bold text-gray-900">Media</span>
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
            <h1 className="text-xl font-bold text-gray-900">Media Channel Dashboard</h1>
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
                <div className="text-xs text-gray-500">{getMediaTypeLabel()}</div>
              </div>
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMediaTypeColor()} flex items-center justify-center text-white font-medium`}>
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Views */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Eye className="text-blue-600" size={24} />
                    </div>
                    <TrendingUp className="text-green-500" size={20} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {stats.totalViews.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Views</div>
                  <div className="mt-2 text-xs text-green-600 font-medium">+12.5% from last month</div>
                </div>

                {/* Total Subscribers */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Users className="text-purple-600" size={24} />
                    </div>
                    <TrendingUp className="text-green-500" size={20} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {stats.totalSubscribers.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Subscribers</div>
                  <div className="mt-2 text-xs text-green-600 font-medium">+8.3% from last month</div>
                </div>

                {/* Total Likes */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                      <Heart className="text-pink-600" size={24} />
                    </div>
                    <TrendingUp className="text-green-500" size={20} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {stats.totalLikes.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Likes</div>
                  <div className="mt-2 text-xs text-green-600 font-medium">+15.7% from last month</div>
                </div>

                {/* Live Viewers / Comments */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      {(mediaType === 'tv' || mediaType === 'radio') ? (
                        <Play className="text-orange-600" size={24} />
                      ) : (
                        <MessageSquare className="text-orange-600" size={24} />
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {(mediaType === 'tv' || mediaType === 'radio')
                      ? stats.liveViewers?.toLocaleString()
                      : stats.totalComments.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {(mediaType === 'tv' || mediaType === 'radio') ? 'Live Viewers' : 'Comments'}
                  </div>
                  {(mediaType === 'tv' || mediaType === 'radio') && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">Currently Live</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Channel Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Channel Name</label>
                    <div className="text-gray-900">{user?.company || 'My Media Channel'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Media Type</label>
                    <div className="flex items-center gap-2">
                      <MediaIcon size={18} className="text-gray-600" />
                      <span className="text-gray-900 capitalize">{getMediaTypeLabel()}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Active
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Website</label>
                    <div className="flex items-center gap-2 text-blue-600 hover:underline cursor-pointer">
                      <Globe size={16} />
                      <span>www.mychannel.com</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => navigate('/media/edit-channel')}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Edit className="text-blue-600" size={24} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Edit Channel</span>
                  </button>

                  {(mediaType === 'tv' || mediaType === 'radio') && (
                    <button
                      onClick={() => navigate(`/media/live-url/${mediaType}`)}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                        <Play className="text-red-600" size={24} />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Live URL</span>
                    </button>
                  )}

                  <button
                    onClick={() => navigate('/media/social-icon')}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Share2 className="text-purple-600" size={24} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Social Links</span>
                  </button>

                  <button
                    onClick={() => navigate('/media/enquiry')}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <Mail className="text-green-600" size={24} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Enquiries</span>
                  </button>
                </div>
              </div>

              {/* Analytics & Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recent Enquiries */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Enquiries</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'John Doe', subject: 'Advertisement Inquiry', time: '10 min ago', status: 'New' },
                      { name: 'Sarah Smith', subject: 'Partnership Proposal', time: '1 hour ago', status: 'Replied' },
                      { name: 'Mike Johnson', subject: 'Content Submission', time: '2 hours ago', status: 'New' },
                      { name: 'Emily Davis', subject: 'Technical Support', time: '3 hours ago', status: 'In Progress' },
                      { name: 'David Wilson', subject: 'General Inquiry', time: '5 hours ago', status: 'Replied' }
                    ].map((enquiry, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMediaTypeColor()} flex items-center justify-center text-white font-medium text-sm`}>
                          {enquiry.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{enquiry.name}</div>
                          <div className="text-xs text-gray-600">{enquiry.subject}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">{enquiry.time}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            enquiry.status === 'New' ? 'bg-blue-100 text-blue-700' :
                            enquiry.status === 'Replied' ? 'bg-green-100 text-green-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {enquiry.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    View All Enquiries
                  </button>
                </div>

                {/* Social Media Stats */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Reach</h3>
                  <div className="space-y-4">
                    {[
                      { platform: 'Facebook', followers: '45.2K', engagement: '8.5%', color: 'blue' },
                      { platform: 'Twitter', followers: '32.1K', engagement: '6.2%', color: 'sky' },
                      { platform: 'Instagram', followers: '28.7K', engagement: '12.3%', color: 'pink' },
                      { platform: 'YouTube', followers: '15.4K', engagement: '15.8%', color: 'red' },
                      { platform: 'LinkedIn', followers: '8.9K', engagement: '4.1%', color: 'indigo' }
                    ].map((social, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg bg-${social.color}-100 flex items-center justify-center`}>
                              <Share2 className={`text-${social.color}-600`} size={16} />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{social.platform}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{social.followers}</div>
                            <div className="text-xs text-gray-600">{social.engagement} engagement</div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`bg-${social.color}-500 h-2 rounded-full`}
                            style={{ width: social.engagement }}
                          ></div>
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
                    { user: 'Admin', action: 'Updated channel information', time: '10 min ago', type: 'success' },
                    { user: 'Editor', action: 'Published new content', time: '25 min ago', type: 'info' },
                    { user: 'Admin', action: 'Modified social media links', time: '1 hour ago', type: 'success' },
                    { user: 'Manager', action: 'Responded to 5 enquiries', time: '2 hours ago', type: 'info' },
                    { user: 'Admin', action: 'Updated privacy policy', time: '3 hours ago', type: 'success' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMediaTypeColor()} flex items-center justify-center text-white font-medium text-sm`}>
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



