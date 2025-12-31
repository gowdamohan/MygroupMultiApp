import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, User, MapPin, Share2, Eye, RefreshCw, WifiOff,
  DollarSign, Megaphone, FileText, Award, Newspaper, Image, Users,
  ChevronDown, ChevronRight, Menu, X, LogOut, Wifi, Calendar, Upload
} from 'lucide-react';
import { DocumentUpload } from './DocumentUpload';
import { TimeTable } from './TimeTable';
import {
  SocialMediaSection,
  ViewSection,
  SwitcherSection,
  OfflineMediaSection,
  DocumentsSection,
  AwardsSection,
  NewsletterSection,
  GallerySection,
  TeamSection
} from './MediaDashboardPages';

const API_BASE_URL = 'http://localhost:5002/api/v1';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  children?: MenuItem[];
  categoryId?: number;
}

interface UploadCategory {
  id: number;
  category_name: string;
  category_type: string;
}

interface ChannelInfo {
  id: number;
  media_name_english: string;
  media_name_regional: string | null;
  media_logo: string | null;
}

export const MediaDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { channelId } = useParams<{ channelId: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [uploadCategories, setUploadCategories] = useState<UploadCategory[]>([]);
  const [selectedUploadCategory, setSelectedUploadCategory] = useState<UploadCategory | null>(null);

  useEffect(() => {
    if (channelId) {
      fetchChannelInfo();
      fetchUploadCategories();
    }
  }, [channelId]);

  const fetchChannelInfo = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/partner/my-channels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const channel = response.data.data.find((c: any) => c.id === parseInt(channelId || '0'));
        if (channel) setChannelInfo(channel);
      }
    } catch (error) {
      console.error('Error fetching channel info:', error);
    }
  };

  const fetchUploadCategories = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/media-document/upload-categories/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUploadCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching upload categories:', error);
    }
  };

  // Build upload menu items from dynamic categories
  const uploadMenuItems: MenuItem[] = uploadCategories.map(cat => ({
    id: `upload-${cat.id}`,
    label: cat.category_name,
    icon: Upload,
    categoryId: cat.id
  }));

  const menuItems: MenuItem[] = [
    { id: 'back', label: 'Back to Channel List', icon: ArrowLeft, path: '/partner/my-channel-list' },
    { id: 'profile', label: 'Profile', icon: User, children: [
      { id: 'address', label: 'Address', icon: MapPin, path: `/media/dashboard/${channelId}/address` }
    ]},
    { id: 'social-media', label: 'Social Media', icon: Share2, path: `/media/dashboard/${channelId}/social-media` },
    { id: 'view', label: 'View', icon: Eye, path: `/media/dashboard/${channelId}/view` },
    { id: 'switcher', label: 'Switcher', icon: RefreshCw, path: `/media/dashboard/${channelId}/switcher` },
    { id: 'offline-media', label: 'Offline Media', icon: WifiOff, path: `/media/dashboard/${channelId}/offline-media` },
    { id: 'earnings', label: 'Earnings', icon: DollarSign, path: `/media/dashboard/${channelId}/earnings` },
    { id: 'promote', label: 'Promote', icon: Megaphone, path: `/media/dashboard/${channelId}/promote` },
    { id: 'documents', label: 'Documents', icon: FileText, path: `/media/dashboard/${channelId}/documents` },
    { id: 'awards', label: 'Awards', icon: Award, path: `/media/dashboard/${channelId}/awards` },
    { id: 'newsletter', label: 'Newsletter', icon: Newspaper, path: `/media/dashboard/${channelId}/newsletter` },
    { id: 'gallery', label: 'Gallery', icon: Image, path: `/media/dashboard/${channelId}/gallery` },
    { id: 'team', label: 'Team', icon: Users, path: `/media/dashboard/${channelId}/team` },
    { id: 'timetable', label: 'Time Table', icon: Calendar, path: `/media/dashboard/${channelId}/timetable` },
    // Dynamic upload categories
    ...(uploadMenuItems.length > 0 ? [{
      id: 'upload-section',
      label: 'Upload Documents',
      icon: Upload,
      children: uploadMenuItems
    }] : [])
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]);
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.children) {
      toggleMenu(item.id);
    } else if (item.categoryId) {
      // Handle upload category click
      const category = uploadCategories.find(c => c.id === item.categoryId);
      if (category) {
        setSelectedUploadCategory(category);
        setActiveMenu(item.id);
      }
    } else if (item.path) {
      setActiveMenu(item.id);
      setSelectedUploadCategory(null);
      navigate(item.path);
    }
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const isExpanded = expandedMenus.includes(item.id);
    const isActive = activeMenu === item.id || location.pathname === item.path;
    const hasChildren = item.children && item.children.length > 0;
    return (
      <div key={item.id}>
        <button onClick={() => handleMenuClick(item)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
            isActive ? 'bg-teal-600 text-white' : 'text-gray-200 hover:bg-teal-700 hover:text-white'
          } ${depth > 0 ? 'ml-4 text-sm' : ''}`}>
          <div className="flex items-center gap-3">
            <item.icon size={18} />
            {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
          </div>
          {sidebarOpen && hasChildren && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </button>
        {hasChildren && isExpanded && sidebarOpen && (
          <div className="mt-1 space-y-1">{item.children!.map(child => renderMenuItem(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    // If a document upload category is selected, show the upload component
    if (selectedUploadCategory && channelId) {
      return (
        <DocumentUpload
          channelId={parseInt(channelId)}
          category={selectedUploadCategory}
          onBack={() => setSelectedUploadCategory(null)}
        />
      );
    }

    // Route based on current path
    const path = location.pathname;
    if (path.includes('/social-media')) return <SocialMediaSection />;
    if (path.includes('/view')) return <ViewSection />;
    if (path.includes('/switcher')) return <SwitcherSection />;
    if (path.includes('/offline-media')) return <OfflineMediaSection />;
    if (path.includes('/documents')) return <DocumentsSection />;
    if (path.includes('/awards')) return <AwardsSection />;
    if (path.includes('/newsletter')) return <NewsletterSection />;
    if (path.includes('/gallery')) return <GallerySection />;
    if (path.includes('/team')) return <TeamSection />;
    if (path.includes('/timetable')) return <TimeTable />;

    // Default dashboard content
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Media Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center"><Eye className="text-teal-600" size={24} /></div>
              <div><p className="text-sm text-gray-500">Total Views</p><p className="text-2xl font-bold text-gray-900">0</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Users className="text-blue-600" size={24} /></div>
              <div><p className="text-sm text-gray-500">Followers</p><p className="text-2xl font-bold text-gray-900">0</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center"><Award className="text-yellow-600" size={24} /></div>
              <div><p className="text-sm text-gray-500">Awards</p><p className="text-2xl font-bold text-gray-900">0</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><DollarSign className="text-green-600" size={24} /></div>
              <div><p className="text-sm text-gray-500">Earnings</p><p className="text-2xl font-bold text-gray-900">₹0</p></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-teal-50 to-cyan-50 overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} hidden lg:block bg-gradient-to-b from-teal-800 to-teal-900 transition-all duration-300 overflow-hidden shadow-xl`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-teal-700">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-teal-400 shadow-lg mb-3 bg-white">
                {channelInfo?.media_logo ? (
                  <img src={`http://localhost:5002${channelInfo.media_logo}`} alt="Channel" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center"><Wifi className="text-white" size={28} /></div>
                )}
              </div>
              {sidebarOpen && (
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">{channelInfo?.media_name_english || 'Media Channel'}</p>
                  {channelInfo?.media_name_regional && <p className="text-xs text-teal-300 mt-1">{channelInfo.media_name_regional}</p>}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-4 px-3"><nav className="space-y-1">{menuItems.map(item => renderMenuItem(item))}</nav></div>
          <div className="p-3 border-t border-teal-700">
            <button onClick={() => navigate('/partner/my-channel-list')} className="w-full flex items-center gap-3 px-3 py-2.5 text-teal-300 hover:bg-teal-700 rounded-lg transition-colors">
              <LogOut size={18} />{sidebarOpen && <span className="text-sm font-medium">Exit Dashboard</span>}
            </button>
          </div>
        </div>
      </aside>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-teal-800 to-teal-900">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-teal-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-teal-400 bg-white">
                    {channelInfo?.media_logo ? (
                      <img src={`http://localhost:5002${channelInfo.media_logo}`} alt="Channel" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center"><Wifi className="text-white" size={16} /></div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-white">{channelInfo?.media_name_english || 'Media Channel'}</span>
                </div>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-teal-300 hover:text-white"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 px-3"><nav className="space-y-1">{menuItems.map(item => renderMenuItem(item))}</nav></div>
            </div>
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg"><Menu size={20} /></button>
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"><Menu size={20} /></button>
            <h1 className="text-lg font-semibold text-teal-800">Media Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">{channelInfo?.media_name_english}</span>
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-teal-200 bg-white">
              {channelInfo?.media_logo ? (
                <img src={`http://localhost:5002${channelInfo.media_logo}`} alt="Channel" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center"><Wifi className="text-white" size={16} /></div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6"><div className="max-w-7xl mx-auto">{renderContent()}</div></main>
      </div>
    </div>
  );
};

export default MediaDashboard;

