import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, User, MapPin, Share2, Eye, Send,
  DollarSign, Megaphone, FileText, Award, Newspaper, Image, Users,
  ChevronDown, ChevronRight, Menu, X, LogOut, Wifi, Calendar, Upload, MessageCircle,
  ToggleLeft, ToggleRight, Edit3, Tv
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
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

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
  app_id?: number;
  category_id?: number;
  media_name_english: string;
  media_name_regional: string | null;
  media_logo: string | null;
  media_logo_url?: string | null;
  status?: string;
  is_active?: number;
  isActive?: boolean;
}

interface MainCategory {
  id: number;
  category_name: string;
  is_disabled?: boolean;
}

// Tab items for the horizontal scroll bar
type TabItem = 'output' | 'switcher' | 'preview' | 'offline';

interface SwitcherData {
  active_source: 'live' | 'mymedia' | 'offline';
  live_url: string | null;
  mymedia_url: string | null;
  offline_media_id?: number | null;
  offlineMedia?: { media_file_url: string; media_type: string; thumbnail_url?: string } | null;
}

interface HeaderAd {
  id: number;
  file_path: string;
  signed_url: string | null;
  url: string | null;
  file_type: string;
}

interface HeaderAdsData {
  header1: HeaderAd[];
  header2: HeaderAd[];
}

interface Comment {
  id: number;
  comment_text: string;
  created_at: string;
  user: {
    id: number;
    full_name: string;
    profile?: { profile_photo: string | null };
  };
  replies?: Comment[];
}

interface InteractionsData {
  likes_count: number;
  dislikes_count: number;
  followers_count: number;
  shortlist_count: number;
  comments_count: number;
  views_count: number;
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
  const [allChannels, setAllChannels] = useState<ChannelInfo[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [uploadCategories, setUploadCategories] = useState<UploadCategory[]>([]);
  const [selectedUploadCategory, setSelectedUploadCategory] = useState<UploadCategory | null>(null);
  const [channelToggleLoading, setChannelToggleLoading] = useState<number | null>(null);
  const [categoriesExpanded, setCategoriesExpanded] = useState<Record<number, boolean>>({});

  // New state for the redesigned dashboard
  const [activeTab, setActiveTab] = useState<TabItem>('output');
  const [switcher, setSwitcher] = useState<SwitcherData | null>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [headerAds, setHeaderAds] = useState<HeaderAdsData>({ header1: [], header2: [] });
  const [header1Index, setHeader1Index] = useState(0);
  const [header2Index, setHeader2Index] = useState(0);

  // Comments and interactions state
  const [comments, setComments] = useState<Comment[]>([]);
  const [interactions, setInteractions] = useState<InteractionsData | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  // Real-time date/time state
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Preview tab state
  const [previewLiveUrl, setPreviewLiveUrl] = useState('');
  const [previewMymediaUrl, setPreviewMymediaUrl] = useState('');
  const [offlineMediaList, setOfflineMediaList] = useState<any[]>([]);
  const [selectedOfflineId, setSelectedOfflineId] = useState<number | null>(null);
  const [uploadingLive, setUploadingLive] = useState(false);
  const [uploadingMymedia, setUploadingMymedia] = useState(false);
  const [uploadingOffline, setUploadingOffline] = useState(false);
  const [offlineFile, setOfflineFile] = useState<File | null>(null);
  const [offlineTitle, setOfflineTitle] = useState('');
  const [offlineType, setOfflineType] = useState<'video' | 'audio'>('video');
  const offlineFileRef = useRef<HTMLInputElement>(null);
  const offlineMediaFileRef = useRef<HTMLInputElement>(null); // For Offline Media tab
  const [offlineUploadError, setOfflineUploadError] = useState<string | null>(null);
  const MAX_OFFLINE_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  const [livePreviewLoaded, setLivePreviewLoaded] = useState(false);
  const [mymediaPreviewLoaded, setMymediaPreviewLoaded] = useState(false);

  useEffect(() => {
    if (channelId) {
      fetchChannelInfo();
      fetchUploadCategories();
      fetchDashboardData();
      fetchHeaderAds();
      fetchComments();
      fetchInteractions();
      fetchOfflineMedia();
    }
  }, [channelId]);

  useEffect(() => {
    if (channelInfo?.app_id) {
      fetchMainCategories(channelInfo.app_id);
    }
  }, [channelInfo?.app_id]);

  // Real-time clock update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-refresh comments every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (channelId) fetchComments();
    }, 10000);
    return () => clearInterval(timer);
  }, [channelId]);

  // Auto-rotate header ads carousel
  useEffect(() => {
    if (headerAds.header1.length > 1) {
      const interval = setInterval(() => {
        setHeader1Index((prev) => (prev + 1) % headerAds.header1.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [headerAds.header1.length]);

  useEffect(() => {
    if (headerAds.header2.length > 1) {
      const interval = setInterval(() => {
        setHeader2Index((prev) => (prev + 1) % headerAds.header2.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [headerAds.header2.length]);

  const fetchHeaderAds = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/media-dashboard/header-ads/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setHeaderAds(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching header ads:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const switcherRes = await axios.get(`${API_BASE_URL}/media-dashboard/switcher/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (switcherRes.data.success) setSwitcher(switcherRes.data.data);
    } catch (error) { console.error('Error fetching dashboard data:', error); }
  };

  const fetchChannelInfo = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/partner/my-channels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const list = response.data.data || [];
        setAllChannels(list);
        const channel = list.find((c: any) => c.id === parseInt(channelId || '0'));
        if (channel) setChannelInfo(channel);
      }
    } catch (error) {
      console.error('Error fetching channel info:', error);
    }
  };

  const fetchMainCategories = async (appId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/partner/media-categories/${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setMainCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching main categories:', error);
    }
  };

  const handleChannelStatusToggle = async (ch: ChannelInfo) => {
    setChannelToggleLoading(ch.id);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/partner/channel/${ch.id}/toggle-status`,
        { status: !(ch.isActive ?? ch.is_active === 1) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setAllChannels(prev => prev.map(c => c.id === ch.id ? { ...c, isActive: !(c.isActive ?? c.is_active === 1), is_active: c.is_active === 1 ? 0 : 1 } : c));
        if (channelInfo?.id === ch.id) {
          setChannelInfo(prev => prev ? { ...prev, isActive: !(prev.isActive ?? prev.is_active === 1), is_active: prev.is_active === 1 ? 0 : 1 } : null);
        }
      }
    } catch (error) {
      console.error('Error toggling channel status:', error);
    } finally {
      setChannelToggleLoading(null);
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

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/media-dashboard/comments/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setComments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchInteractions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/media-dashboard/interactions/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setInteractions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching interactions:', error);
    }
  };

  const handleAddComment = async (parentId: number | null = null) => {
    const text = parentId ? replyText : commentText;
    if (!text.trim()) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/media-dashboard/comments/${channelId}`,
        { comment_text: text, parent_id: parentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Clear input and refresh comments
      if (parentId) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setCommentText('');
      }
      fetchComments();
      fetchInteractions();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Convert YouTube/watch URLs to embed URL for iframe
  const toEmbedUrl = (url: string): string => {
    const t = url.trim();
    if (!t) return '';
    const ytMatch = t.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return t; // Already embed or other stream URL
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Format count to K/M
  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  // Fetch offline media for preview tab
  const fetchOfflineMedia = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/media-dashboard/offline-media/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setOfflineMediaList(response.data.data);
        // Also load current switcher URLs
        const switcherRes = await axios.get(`${API_BASE_URL}/media-dashboard/switcher/${channelId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (switcherRes.data.success) {
          setPreviewLiveUrl(switcherRes.data.data.live_url || '');
          setPreviewMymediaUrl(switcherRes.data.data.mymedia_url || '');
          setSelectedOfflineId(switcherRes.data.data.offline_media_id || null);
        }
      }
    } catch (error) {
      console.error('Error fetching offline media:', error);
    }
  };

  // Submit live URL (Other stream url)
  const handleSubmitLiveUrl = async () => {
    if (!previewLiveUrl.trim()) return;
    setUploadingLive(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${API_BASE_URL}/media-dashboard/switcher/${channelId}`,
        { live_url: previewLiveUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboardData();
    } catch (error) { console.error('Error saving live URL:', error); }
    setUploadingLive(false);
  };

  // Submit mymedia URL
  const handleSubmitMymediaUrl = async () => {
    if (!previewMymediaUrl.trim()) return;
    setUploadingMymedia(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${API_BASE_URL}/media-dashboard/switcher/${channelId}`,
        { mymedia_url: previewMymediaUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboardData();
    } catch (error) { console.error('Error saving mymedia URL:', error); }
    setUploadingMymedia(false);
  };

  // Upload offline media (called from Offline Media tab)
  const handleUploadOfflineMedia = async () => {
    setOfflineUploadError(null);
    if (!offlineFile || !offlineTitle.trim()) {
      setOfflineUploadError('Please provide a title and select a file.');
      return;
    }
    if (offlineFile.size > MAX_OFFLINE_FILE_SIZE) {
      setOfflineUploadError(`File size exceeds 500MB limit. Your file is ${(offlineFile.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }
    setUploadingOffline(true);
    try {
      const token = localStorage.getItem('accessToken');
      const fd = new FormData();
      fd.append('media_file', offlineFile);
      fd.append('title', offlineTitle);
      fd.append('media_type', offlineType);
      fd.append('is_default', '0');

      await axios.post(`${API_BASE_URL}/media-dashboard/offline-media/${channelId}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        maxContentLength: MAX_OFFLINE_FILE_SIZE,
        maxBodyLength: MAX_OFFLINE_FILE_SIZE
      });

      setOfflineFile(null);
      setOfflineTitle('');
      if (offlineFileRef.current) offlineFileRef.current.value = '';
      if (offlineMediaFileRef.current) offlineMediaFileRef.current.value = '';
      setOfflineUploadError(null);
      fetchOfflineMedia();
    } catch (error: any) {
      const msg = error?.response?.status === 413
        ? 'File size exceeds 500MB limit.'
        : error?.response?.data?.message || 'Failed to upload. Please try again.';
      setOfflineUploadError(msg);
      console.error('Error uploading offline media:', error);
    }
    setUploadingOffline(false);
  };

  const handleOfflineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setOfflineFile(file);
    setOfflineUploadError(null);
    if (file && file.size > MAX_OFFLINE_FILE_SIZE) {
      setOfflineUploadError(`File size exceeds 500MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
    }
  };

  // Set source as active output
  const handleSetActiveSource = async (source: 'live' | 'mymedia' | 'offline', offlineId?: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const data: any = { active_source: source };
      if (source === 'offline' && offlineId) data.offline_media_id = offlineId;

      await axios.put(`${API_BASE_URL}/media-dashboard/switcher/${channelId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (error) { console.error('Error setting active source:', error); }
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
    { id: 'media-output', label: 'Media Output', icon: Eye, path: `/media/dashboard/${channelId}` },
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



  // Render media based on switcher state (synced across Output, Switcher, Preview)
  const renderMedia = () => {
    if (!switcher) return <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500">Loading...</div>;

    const { active_source, live_url, mymedia_url, offlineMedia } = switcher;

    if (active_source === 'live' && live_url) {
      return <iframe src={toEmbedUrl(live_url)} className="w-full h-full" allowFullScreen />;
    }
    if (active_source === 'mymedia' && mymedia_url) {
      return <iframe src={toEmbedUrl(mymedia_url)} className="w-full h-full" allowFullScreen />;
    }
    if (active_source === 'offline' && offlineMedia) {
      if (offlineMedia.media_type === 'video') {
        return <video src={offlineMedia.media_file_url} controls className="w-full h-full object-cover" />;
      }
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          {offlineMedia.thumbnail_url && <img src={offlineMedia.thumbnail_url} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
          <audio src={offlineMedia.media_file_url} controls className="z-10" />
        </div>
      );
    }
    return <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500">No media selected</div>;
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

    // Render header ad with carousel support
    const renderHeaderAd = (ads: HeaderAd[], currentIndex: number, defaultBg: string) => {
      if (ads.length === 0) {
        return (
          <div className={`flex-1 ${defaultBg} h-20 flex items-center justify-center`}>
            <span className="text-gray-500 text-sm">No Ad</span>
          </div>
        );
      }
      const ad = ads[currentIndex];
      return (
        <a href={ad.url || '#'} target="_blank" rel="noopener noreferrer" className="flex-1 h-20 overflow-hidden">
          {ad.signed_url ? (
            <img src={ad.signed_url} alt="Header Ad" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full ${defaultBg} flex items-center justify-center`}>
              <span className="text-gray-500">Ad Image</span>
            </div>
          )}
        </a>
      );
    };

    // Default dashboard content - NEW DESIGN with Switcher
    return (
      <div className="flex flex-col h-full bg-gray-600">
        {/* Header Ad Banners */}
        <div className="flex gap-0">
          {renderHeaderAd(headerAds.header1, header1Index, 'bg-cyan-200')}
          {renderHeaderAd(headerAds.header2, header2Index, 'bg-yellow-200')}
        </div>

        {/* Horizontal Tab Bar */}
        <div className="bg-gray-700">
          <div ref={tabScrollRef} className="flex">
            <button onClick={() => setActiveTab('output')}
              className={`px-6 py-2 font-bold text-sm transition-colors border-r border-gray-600 ${activeTab === 'output' ? 'bg-blue-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-400'}`}>
              Output
            </button>
            <button onClick={() => setActiveTab('switcher')}
              className={`px-6 py-2 font-bold text-sm transition-colors border-r border-gray-600 ${activeTab === 'switcher' ? 'bg-green-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-400'}`}>
              Switcher
            </button>
            <button onClick={() => setActiveTab('preview')}
              className={`px-6 py-2 font-bold text-sm transition-colors border-r border-gray-600 ${activeTab === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-400'}`}>
              Preview
            </button>
            <button onClick={() => setActiveTab('offline')}
              className={`px-6 py-2 font-bold text-sm transition-colors ${activeTab === 'offline' ? 'bg-amber-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-400'}`}>
              Offline Media
            </button>
          </div>
        </div>

        {/* Main Content Area - Show based on active tab */}
        {activeTab === 'output' ? (
          // OUTPUT TAB - Video + Interactions + Comments
          <div className="flex-1 flex bg-black min-h-0">
            {/* Left - Video Player with Stats */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 bg-gray-900 relative min-h-[250px]">
                {renderMedia()}
              </div>
              {/* Stats Overlay Bar */}
              <div className="bg-red-700 flex items-center text-white">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-600">
                  <Eye size={20} />
                  <span className="font-bold">: {formatCount(interactions?.views_count || 0)}</span>
                </div>
                <div className="flex-1 flex items-center justify-center gap-4 px-4 py-2">
                  <span className="font-bold">{currentDateTime.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' - ')}</span>
                  <span className="font-bold">{currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                </div>
              </div>
              {/* Engagement Stats */}
              <div className="flex bg-gray-900 text-white">
                <div className="flex-1 flex items-center justify-center gap-2 py-3 border-r border-gray-700">
                  <span className="text-red-500 font-bold">Likes:</span>
                  <span className="font-bold text-lg">{formatCount(interactions?.likes_count || 0)}</span>
                </div>
                <div className="flex-1 flex items-center justify-center gap-2 py-3 border-r border-gray-700">
                  <span className="text-red-500 font-bold">Unlikes:</span>
                  <span className="font-bold text-lg">{formatCount(interactions?.dislikes_count || 0)}</span>
                </div>
                <div className="flex-1 flex items-center justify-center gap-2 py-3 border-r border-gray-700">
                  <span className="text-green-500 font-bold">Followers:</span>
                  <span className="font-bold text-lg">{formatCount(interactions?.followers_count || 0)}</span>
                </div>
                <div className="flex-1 flex items-center justify-center gap-2 py-3">
                  <span className="text-blue-500 font-bold">Shortlists:</span>
                  <span className="font-bold text-lg">{formatCount(interactions?.shortlist_count || 0)}</span>
                </div>
              </div>
            </div>
            {/* Right - Comments Section */}
            <div className="w-80 lg:w-96 bg-white flex flex-col border-l border-gray-300">
              <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <MessageCircle size={20} />
                  Comments:
                </h3>
                <span className="text-sm">{comments.length} total</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                  <div className="text-sm text-gray-500 py-8 text-center">No comments yet. Be the first to comment!</div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {comment.user?.profile?.profile_photo ? (
                            <img src={comment.user.profile.profile_photo} className="w-full h-full object-cover" />
                          ) : (
                            <User size={16} className="text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{comment.user?.full_name || 'User'}</span>
                            <span className="text-xs text-gray-400">{formatTimeAgo(comment.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.comment_text}</p>
                          <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="text-xs text-blue-500 hover:underline mt-1">
                            Reply
                          </button>
                          {/* Reply Input */}
                          {replyingTo === comment.id && (
                            <div className="flex gap-2 mt-2">
                              <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." className="flex-1 px-3 py-1 text-sm border rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500" onKeyDown={(e) => e.key === 'Enter' && handleAddComment(comment.id)} />
                              <button onClick={() => handleAddComment(comment.id)} className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600">
                                <Send size={14} />
                              </button>
                            </div>
                          )}
                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-2 pl-4 border-l-2 border-gray-200 space-y-2">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                    {reply.user?.profile?.profile_photo ? (
                                      <img src={reply.user.profile.profile_photo} className="w-full h-full object-cover" />
                                    ) : (
                                      <User size={12} className="text-gray-500" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-xs">{reply.user?.full_name || 'User'}</span>
                                      <span className="text-xs text-gray-400">{formatTimeAgo(reply.created_at)}</span>
                                    </div>
                                    <p className="text-xs text-gray-700">{reply.comment_text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Comment Input */}
              <div className="p-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Type a comment..." className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" onKeyDown={(e) => e.key === 'Enter' && handleAddComment(null)} />
                  <button onClick={() => handleAddComment(null)} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'preview' ? (
          // PREVIEW TAB - Compact columns: Input → Preview → Submit → Output
          <div className="flex-1 flex bg-gray-600 min-h-0 p-3 gap-3 overflow-auto">
            {/* Column 1 - Other stream url */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-500">
              <div className="bg-gray-800 px-3 py-1.5 text-white font-bold text-sm border-b border-gray-600">Other stream url</div>
              <div className="p-2 space-y-2">
                <input type="text" value={previewLiveUrl} onChange={(e) => { const v = e.target.value; setPreviewLiveUrl(v); setLivePreviewLoaded(prev => (v === previewLiveUrl ? prev : false)); }} placeholder="YouTube, live stream, or embed URL" className="w-full px-2 py-1.5 text-xs rounded border border-gray-500 bg-gray-600 text-white placeholder-gray-400" />
                <div className="bg-black relative h-[80px] border border-gray-600 rounded overflow-hidden">
                  {previewLiveUrl.trim() ? (
                    <iframe src={toEmbedUrl(previewLiveUrl)} className="w-full h-full" allowFullScreen onLoad={() => setLivePreviewLoaded(true)} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Paste URL to preview</div>
                  )}
                </div>
                <button onClick={handleSubmitLiveUrl} disabled={uploadingLive || !previewLiveUrl.trim() || !livePreviewLoaded} className="w-full bg-gray-500 text-white py-1.5 font-bold text-sm rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploadingLive ? 'Saving...' : 'Submit'}
                </button>
              </div>
              <div className="bg-red-600 text-white text-center py-0.5 font-bold text-xs">Output</div>
              <div className="mx-2 mb-2 bg-black relative h-[60px] border border-gray-600 rounded overflow-hidden">
                {switcher?.live_url ? (
                  <iframe src={toEmbedUrl(switcher.live_url)} className="w-full h-full" allowFullScreen />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Not saved yet</div>
                )}
              </div>
              <button onClick={() => handleSetActiveSource('live')} className={`mx-2 mb-2 py-1 text-sm font-bold rounded ${switcher?.active_source === 'live' ? 'bg-green-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-400'}`}>
                {switcher?.active_source === 'live' ? 'On Air' : 'Set as Output'}
              </button>
            </div>

            {/* Column 2 - Mystream Url */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-500">
              <div className="bg-gray-800 px-3 py-1.5 text-white font-bold text-sm border-b border-gray-600">Mystream_Url</div>
              <div className="p-2 space-y-2">
                <input type="text" value={previewMymediaUrl} onChange={(e) => { const v = e.target.value; setPreviewMymediaUrl(v); setMymediaPreviewLoaded(prev => (v === previewMymediaUrl ? prev : false)); }} placeholder="YouTube, live stream, or embed URL" className="w-full px-2 py-1.5 text-xs rounded border border-gray-500 bg-gray-600 text-white placeholder-gray-400" />
                <div className="bg-black relative h-[80px] border border-gray-600 rounded overflow-hidden">
                  {previewMymediaUrl.trim() ? (
                    <iframe src={toEmbedUrl(previewMymediaUrl)} className="w-full h-full" allowFullScreen onLoad={() => setMymediaPreviewLoaded(true)} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Paste URL to preview</div>
                  )}
                </div>
                <button onClick={handleSubmitMymediaUrl} disabled={uploadingMymedia || !previewMymediaUrl.trim() || !mymediaPreviewLoaded} className="w-full bg-gray-500 text-white py-1.5 font-bold text-sm rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploadingMymedia ? 'Saving...' : 'Submit'}
                </button>
              </div>
              <div className="bg-red-600 text-white text-center py-0.5 font-bold text-xs">Output</div>
              <div className="mx-2 mb-2 bg-black relative h-[60px] border border-gray-600 rounded overflow-hidden">
                {switcher?.mymedia_url ? (
                  <iframe src={toEmbedUrl(switcher.mymedia_url)} className="w-full h-full" allowFullScreen />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Not saved yet</div>
                )}
              </div>
              <button onClick={() => handleSetActiveSource('mymedia')} className={`mx-2 mb-2 py-1 text-sm font-bold rounded ${switcher?.active_source === 'mymedia' ? 'bg-green-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-400'}`}>
                {switcher?.active_source === 'mymedia' ? 'On Air' : 'Set as Output'}
              </button>
            </div>

            {/* Column 3 - Offline Media (dropdown + preview + Submit; uploads in Offline Media tab) */}
            <div className="flex-1 flex flex-col min-w-0 bg-amber-100 rounded-lg overflow-hidden border-2 border-amber-400">
              <div className="bg-amber-200 px-3 py-1.5 text-amber-900 font-bold text-sm border-b border-amber-300">Offline Media</div>
              <div className="p-2 space-y-2">
                <select value={selectedOfflineId || ''} onChange={(e) => setSelectedOfflineId(e.target.value ? parseInt(e.target.value) : null)} className="w-full px-2 py-1.5 text-xs rounded border border-amber-400 bg-white">
                  <option value="">Select offline media</option>
                  {offlineMediaList.map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({m.media_type})</option>
                  ))}
                </select>
                <div className="bg-amber-50 relative h-[80px] border border-amber-300 rounded overflow-hidden flex items-center justify-center">
                  {(() => {
                    const sel = offlineMediaList.find(m => m.id === selectedOfflineId);
                    if (!sel) return <div className="text-amber-600 text-xs">Select media to preview</div>;
                    if (sel.media_type === 'video') return <video src={sel.media_file_url} key={sel.id} className="w-full h-full object-contain" controls />;
                    return (
                      <div key={sel.id} className="relative w-full h-full">
                        {sel.thumbnail_url && <img src={sel.thumbnail_url} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />}
                        <audio src={sel.media_file_url} controls className="relative z-10 w-full mt-6" />
                      </div>
                    );
                  })()}
                </div>
                <button onClick={() => selectedOfflineId && handleSetActiveSource('offline', selectedOfflineId)} disabled={!selectedOfflineId} className="w-full bg-amber-400 text-amber-900 py-1.5 font-bold text-sm rounded hover:bg-amber-500 disabled:opacity-50">
                  Submit / Set as Output
                </button>
              </div>
              <div className="bg-red-600 text-white text-center py-0.5 font-bold text-xs">Output</div>
              <div className="mx-2 mb-2 bg-amber-50 relative h-[60px] border border-amber-300 rounded overflow-hidden flex items-center justify-center">
                {switcher?.active_source === 'offline' && switcher?.offlineMedia ? (
                  switcher.offlineMedia.media_type === 'video' ? (
                    <video src={switcher.offlineMedia.media_file_url} className="w-full h-full object-contain" controls />
                  ) : switcher.offlineMedia.thumbnail_url ? (
                    <img src={switcher.offlineMedia.thumbnail_url} className="w-full h-full object-cover" alt="Offline" />
                  ) : (
                    <span className="text-amber-600 text-xs">Playing</span>
                  )
                ) : switcher?.offline_media_id ? (
                  (() => { const m = offlineMediaList.find(x => x.id === switcher.offline_media_id); return m ? (m.media_type === 'video' ? <video src={m.media_file_url} className="w-full h-full object-contain" controls /> : <img src={m.thumbnail_url} className="w-full h-full object-cover" alt="" />) : <span className="text-amber-500 text-xs">Saved</span>; })()
                ) : (
                  <div className="text-amber-500 text-xs">Not on output</div>
                )}
              </div>
              <button onClick={() => selectedOfflineId && handleSetActiveSource('offline', selectedOfflineId)} className={`mx-2 mb-2 py-1 text-sm font-bold rounded ${switcher?.active_source === 'offline' ? 'bg-green-600 text-white' : 'bg-amber-400 text-amber-900 hover:bg-amber-500'}`}>
                {switcher?.active_source === 'offline' ? 'On Air' : 'Set as Output'}
              </button>
            </div>
          </div>
        ) : activeTab === 'offline' ? (
          // OFFLINE MEDIA TAB - Upload form
          <div className="flex-1 flex bg-gray-600 min-h-0 p-4 overflow-auto">
            <div className="max-w-xl w-full bg-amber-50 rounded-lg border-2 border-amber-400 p-6 shadow-lg">
              <h2 className="text-xl font-bold text-amber-900 mb-4">Upload Offline Media</h2>
              <p className="text-sm text-amber-800 mb-4">Upload video or audio files (max 500MB). Files will appear in the Preview tab dropdown.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">Title</label>
                  <input type="text" value={offlineTitle} onChange={(e) => setOfflineTitle(e.target.value)} placeholder="Enter media title" className="w-full px-3 py-2 rounded border border-amber-400 bg-white text-gray-800 focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">Media Type</label>
                  <select value={offlineType} onChange={(e) => setOfflineType(e.target.value as 'video' | 'audio')} className="w-full px-3 py-2 rounded border border-amber-400 bg-white text-gray-800">
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">File (video or audio, max 500MB)</label>
                  <input ref={offlineMediaFileRef} type="file" accept="video/*,audio/*" onChange={handleOfflineFileChange} className="w-full px-3 py-2 text-sm border border-amber-400 rounded bg-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-amber-400 file:text-amber-900 file:font-bold file:cursor-pointer" />
                  {offlineFile && <p className="mt-1 text-xs text-amber-700">Selected: {offlineFile.name} ({(offlineFile.size / (1024 * 1024)).toFixed(2)} MB)</p>}
                </div>
                {offlineUploadError && (
                  <div className="p-3 rounded bg-red-100 text-red-700 text-sm">{offlineUploadError}</div>
                )}
                <button onClick={handleUploadOfflineMedia} disabled={uploadingOffline || !offlineFile || !offlineTitle.trim() || (offlineFile?.size || 0) > MAX_OFFLINE_FILE_SIZE} className="w-full bg-amber-500 text-amber-900 py-3 font-bold rounded hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploadingOffline ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              {offlineMediaList.length > 0 && (
                <p className="mt-4 text-sm text-amber-700">You have {offlineMediaList.length} offline media file(s). Select them in the Preview tab to set as output.</p>
              )}
            </div>
          </div>
        ) : (
          // SWITCHER TAB - Main output + visual switcher + preview panels
          <div className="flex-1 flex bg-gray-600 min-h-0 p-2 gap-2">
            <div className="flex-1 flex flex-col">
              <div className="flex-1 bg-gray-900 relative min-h-[250px] border-2 border-gray-500">{renderMedia()}</div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleSetActiveSource('live')} className={`flex-1 py-2 font-bold text-center ${switcher?.active_source === 'live' ? 'bg-blue-600 text-white' : 'bg-gray-400 text-gray-800'}`}>Band</button>
                <button onClick={() => handleSetActiveSource('mymedia')} className={`flex-1 py-2 font-bold text-center ${switcher?.active_source === 'mymedia' ? 'bg-blue-600 text-white' : 'bg-gray-400 text-gray-800'}`}>Video</button>
                <button onClick={() => (selectedOfflineId ?? switcher?.offline_media_id ?? offlineMediaList[0]?.id) && handleSetActiveSource('offline', selectedOfflineId ?? switcher?.offline_media_id ?? offlineMediaList[0]?.id!)} className={`flex-1 py-2 font-bold text-center ${switcher?.active_source === 'offline' ? 'bg-red-600 text-white' : 'bg-gray-400 text-gray-800'}`}>Audio</button>
              </div>
              <div className="flex gap-2 mt-2">
                <div className="flex-1 bg-gray-800 h-16 flex items-center justify-center"><Wifi className="text-gray-400" size={24} /></div>
                <div className="flex-1 bg-gray-800 h-16 flex items-center justify-center"><div className="flex gap-0.5">{[...Array(20)].map((_, i) => (<div key={i} className="w-1 bg-pink-500" style={{ height: Math.random() * 30 + 10 }} />))}</div></div>
                <div className="flex-1 bg-gray-800 h-16 flex items-center justify-center"><div className="flex gap-0.5">{[...Array(15)].map((_, i) => (<div key={i} className="w-1 bg-blue-400" style={{ height: Math.random() * 25 + 5 }} />))}</div></div>
              </div>
            </div>
            {/* Visual Switcher with animated ON AIR glow */}
            <div className="w-36 flex flex-col items-center justify-center gap-2 bg-gray-800 rounded-lg py-4 px-3 border-2 border-gray-600">
              <div className="relative overflow-hidden rounded px-3 py-1.5 bg-gray-700 mb-1">
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent, rgba(239,68,68,0.6), transparent)', animation: 'onair-glow 2s ease-in-out infinite' }} />
                <style>{`@keyframes onair-glow { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }`}</style>
                <span className="relative z-10 text-sm font-bold text-white">ON</span>
                <span className="relative z-10 text-sm font-bold text-red-600 bg-red-200 px-1 ml-1 rounded">AIR</span>
              </div>
              <div className="flex flex-col gap-5 py-2">
                <button onClick={() => handleSetActiveSource('live')} className="flex flex-col items-center gap-1 group" title="Other stream url (Live)">
                  <div className={`w-10 h-10 rounded-full shadow-lg transition-all cursor-pointer ${switcher?.active_source === 'live' ? 'bg-red-500 ring-4 ring-red-300 ring-opacity-50' : 'bg-gray-500 hover:bg-gray-400'}`} />
                  <span className="text-xs font-medium text-gray-300 group-hover:text-white">Live URL</span>
                </button>
                <button onClick={() => handleSetActiveSource('mymedia')} className="flex flex-col items-center gap-1 group" title="Mystream_Url">
                  <div className={`w-10 h-10 rounded-full shadow-lg transition-all cursor-pointer ${switcher?.active_source === 'mymedia' ? 'bg-red-500 ring-4 ring-red-300 ring-opacity-50' : 'bg-gray-500 hover:bg-gray-400'}`} />
                  <span className="text-xs font-medium text-gray-300 group-hover:text-white">MyMedia</span>
                </button>
                <button onClick={() => { const id = selectedOfflineId ?? switcher?.offline_media_id ?? offlineMediaList[0]?.id; if (id) handleSetActiveSource('offline', id); }} disabled={!offlineMediaList.length} className="flex flex-col items-center gap-1 group disabled:opacity-60 disabled:cursor-not-allowed" title="Offline Media">
                  <div className={`w-10 h-10 rounded-full shadow-lg transition-all cursor-pointer ${switcher?.active_source === 'offline' ? 'bg-red-500 ring-4 ring-red-300 ring-opacity-50' : 'bg-gray-500 hover:bg-gray-400'} ${!offlineMediaList.length ? 'cursor-not-allowed' : ''}`} />
                  <span className="text-xs font-medium text-gray-300 group-hover:text-white">Offline</span>
                </button>
              </div>
            </div>
            {/* Right-side preview panels - highlight active source */}
            <div className="w-48 flex flex-col gap-2">
              <div className={`flex-1 rounded overflow-hidden border-2 transition-all ${switcher?.active_source === 'live' ? 'border-red-500 shadow-lg shadow-red-500/40 ring-2 ring-red-400/50' : 'border-gray-500 bg-gray-800'}`}>
                <div className={`px-2 py-1 text-xs font-bold flex items-center gap-1 ${switcher?.active_source === 'live' ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'}`}>
                  {switcher?.active_source === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  Other stream url
                </div>
                <div className="h-20 flex items-center justify-center bg-black">{switcher?.live_url ? <iframe src={toEmbedUrl(switcher.live_url)} className="w-full h-full" allowFullScreen /> : <span className="text-gray-500 text-xs">No stream</span>}</div>
              </div>
              <div className={`flex-1 rounded overflow-hidden border-2 transition-all ${switcher?.active_source === 'mymedia' ? 'border-red-500 shadow-lg shadow-red-500/40 ring-2 ring-red-400/50' : 'border-gray-500 bg-gray-800'}`}>
                <div className={`px-2 py-1 text-xs font-bold flex items-center gap-1 ${switcher?.active_source === 'mymedia' ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'}`}>
                  {switcher?.active_source === 'mymedia' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  Mystream Url
                </div>
                <div className="h-20 flex items-center justify-center bg-black">{switcher?.mymedia_url ? <iframe src={toEmbedUrl(switcher.mymedia_url)} className="w-full h-full" allowFullScreen /> : <span className="text-gray-500 text-xs">No stream</span>}</div>
              </div>
              <div className={`flex-1 rounded overflow-hidden border-2 transition-all ${switcher?.active_source === 'offline' ? 'border-red-500 shadow-lg shadow-red-500/40 ring-2 ring-red-400/50' : 'border-gray-500 bg-gray-800'}`}>
                <div className={`px-2 py-1 text-xs font-bold flex items-center gap-1 ${switcher?.active_source === 'offline' ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'}`}>
                  {switcher?.active_source === 'offline' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  Offline Media
                </div>
                <div className="h-20 flex items-center justify-center bg-black">{switcher?.offlineMedia?.thumbnail_url ? <img src={switcher.offlineMedia.thumbnail_url} className="w-full h-full object-cover" alt="" /> : switcher?.offlineMedia ? <span className="text-gray-500 text-xs">Playing</span> : <span className="text-gray-500 text-xs">No media</span>}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Check if we're on the main dashboard (no specific sub-path)
  const isMainDashboard = () => {
    const path = location.pathname;
    const basePath = `/media/dashboard/${channelId}`;
    return path === basePath || path === `${basePath}/`;
  };

  // Always show sidebar layout
  return (
    <div className="flex h-screen bg-gray-600 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} hidden lg:block bg-gradient-to-b from-teal-800 to-teal-900 transition-all duration-300 overflow-hidden shadow-xl`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-teal-700">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-teal-400 shadow-lg mb-3 bg-white">
                {(channelInfo?.media_logo_url || channelInfo?.media_logo) ? (
                  <img src={channelInfo.media_logo_url || `${BACKEND_URL}${channelInfo.media_logo}`} alt="Channel" className="w-full h-full object-cover" />
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
          {sidebarOpen && mainCategories.length > 0 && (
            <div className="px-3 py-2 border-b border-teal-700">
              <p className="text-xs font-semibold text-teal-300 uppercase tracking-wider mb-2">My Channels</p>
              <div className="space-y-1">
                {mainCategories.map((cat) => {
                  const channelsInCategory = allChannels.filter((c: any) => c.category_id === cat.id);
                  if (channelsInCategory.length === 0) return null;
                  const isExpanded = categoriesExpanded[cat.id] !== false;
                  return (
                    <div key={cat.id} className="rounded-lg overflow-hidden">
                      <button
                        onClick={() => setCategoriesExpanded(prev => ({ ...prev, [cat.id]: !isExpanded }))}
                        className="w-full flex items-center justify-between px-2 py-1.5 text-teal-200 hover:bg-teal-700 rounded text-left text-sm"
                      >
                        <span className="font-medium">{cat.category_name}</span>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      {isExpanded && (
                        <div className="ml-2 mt-1 space-y-1 border-l border-teal-600 pl-2">
                          {channelsInCategory.map((ch: any) => (
                            <div key={ch.id} className="flex items-center gap-1 py-1">
                              <button
                                onClick={() => navigate(`/media/dashboard/${ch.id}`)}
                                className={`flex-1 min-w-0 text-left text-xs truncate py-1 px-2 rounded ${ch.id === parseInt(channelId || '0') ? 'bg-teal-600 text-white' : 'text-teal-200 hover:bg-teal-700'}`}
                                title={ch.media_name_english}
                              >
                                {ch.media_name_english}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleChannelStatusToggle(ch); }}
                                disabled={channelToggleLoading === ch.id}
                                className={`p-1 rounded ${ch.isActive ?? ch.is_active === 1 ? 'text-green-400' : 'text-gray-400'}`}
                                title={ch.isActive ?? ch.is_active === 1 ? 'Active' : 'Inactive'}
                              >
                                {channelToggleLoading === ch.id ? <span className="animate-spin block w-4 h-4 border border-current border-t-transparent rounded-full" /> : (ch.isActive ?? ch.is_active === 1 ? <ToggleRight size={14} /> : <ToggleLeft size={14} />)}
                              </button>
                              <button
                                onClick={() => navigate('/partner/my-channel-list')}
                                className="p-1 text-teal-300 hover:text-white rounded"
                                title="Edit channel"
                              >
                                <Edit3 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto py-4 px-3"><nav className="space-y-1">{menuItems.map(item => renderMenuItem(item))}</nav></div>
          <div className="p-3 border-t border-teal-700">
            <button onClick={() => navigate('/partner/my-channel-list')} className="w-full flex items-center gap-3 px-3 py-2.5 text-teal-300 hover:bg-teal-700 rounded-lg transition-colors">
              <LogOut size={18} />{sidebarOpen && <span className="text-sm font-medium">Exit Dashboard</span>}
            </button>
          </div>
        </div>
      </aside>
      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-teal-800 to-teal-900">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-teal-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-teal-400 bg-white">
                    {(channelInfo?.media_logo_url || channelInfo?.media_logo) ? (
                      <img src={channelInfo.media_logo_url || `${BACKEND_URL}${channelInfo.media_logo}`} alt="Channel" className="w-full h-full object-cover" />
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
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isMainDashboard() && !selectedUploadCategory ? (
          // Show new dashboard design directly (no header for main dashboard)
          <div className="flex-1 overflow-hidden">{renderContent()}</div>
        ) : (
          // Show header + content for sub-pages
          <>
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
                    <img src={`${BACKEND_URL}${channelInfo.media_logo}`} alt="Channel" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center"><Wifi className="text-white" size={16} /></div>
                  )}
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-teal-50 to-cyan-50">
              <div className="max-w-7xl mx-auto">{renderContent()}</div>
            </main>
          </>
        )}
      </div>
    </div>
  );
};

export default MediaDashboard;

