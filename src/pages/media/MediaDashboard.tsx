import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, User, MapPin, Share2, Eye, Send,
  DollarSign, Megaphone, FileText, Award, Newspaper, Image, Users,
  ChevronDown, ChevronRight, Menu, X, LogOut, Wifi, Calendar, Upload, MessageCircle
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

// Tab items for the horizontal scroll bar
type TabItem = 'output' | 'switcher' | 'preview' | 'offline';

interface SwitcherData {
  active_source: 'live' | 'mymedia' | 'offline';
  live_url: string | null;
  mymedia_url: string | null;
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
  const [uploadCategories, setUploadCategories] = useState<UploadCategory[]>([]);
  const [selectedUploadCategory, setSelectedUploadCategory] = useState<UploadCategory | null>(null);

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

  // Upload offline media
  const handleUploadOfflineMedia = async () => {
    if (!offlineFile || !offlineTitle.trim()) return;
    setUploadingOffline(true);
    try {
      const token = localStorage.getItem('accessToken');
      const fd = new FormData();
      fd.append('media_file', offlineFile);
      fd.append('title', offlineTitle);
      fd.append('media_type', offlineType);
      fd.append('is_default', '0');

      await axios.post(`${API_BASE_URL}/media-dashboard/offline-media/${channelId}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      setOfflineFile(null);
      setOfflineTitle('');
      if (offlineFileRef.current) offlineFileRef.current.value = '';
      fetchOfflineMedia();
    } catch (error) { console.error('Error uploading offline media:', error); }
    setUploadingOffline(false);
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



  // Render media based on switcher state
  const renderMedia = () => {
    if (!switcher) return <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500">Loading...</div>;

    const { active_source, live_url, mymedia_url, offlineMedia } = switcher;

    if (active_source === 'live' && live_url) {
      return <iframe src={live_url} className="w-full h-full" allowFullScreen />;
    }
    if (active_source === 'mymedia' && mymedia_url) {
      return <iframe src={mymedia_url} className="w-full h-full" allowFullScreen />;
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
              className={`px-6 py-2 font-bold text-sm transition-colors ${activeTab === 'offline' ? 'bg-red-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-400'}`}>
              Offline
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
          // PREVIEW TAB - Three columns with Preview/Upload/Output for each source
          <div className="flex-1 flex bg-gray-600 min-h-0 p-3 gap-3">
            {/* Column 1 - Other stream url */}
            <div className="flex-1 flex flex-col bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-500">
              <div className="bg-gray-800 px-3 py-2 text-white font-bold text-sm border-b border-gray-600">Other stream url</div>
              {/* Preview Section */}
              <div className="p-2">
                <button className="w-full bg-gray-600 text-white py-1 px-3 text-sm font-semibold rounded hover:bg-gray-500">Preview</button>
              </div>
              {/* Video Preview */}
              <div className="flex-1 mx-2 bg-black relative min-h-[120px] border border-gray-600">
                {switcher?.live_url ? (
                  <iframe src={switcher.live_url} className="w-full h-full" allowFullScreen />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">No stream</div>
                )}
              </div>
              {/* Upload/Submit Buttons */}
              <div className="flex gap-2 p-2">
                <input type="text" value={previewLiveUrl} onChange={(e) => setPreviewLiveUrl(e.target.value)} placeholder="Enter stream URL" className="flex-1 px-2 py-1 text-xs rounded border border-gray-500 bg-gray-600 text-white" />
              </div>
              <div className="flex gap-2 px-2 pb-2">
                <button onClick={handleSubmitLiveUrl} disabled={uploadingLive} className="flex-1 bg-gray-500 text-white py-2 font-bold text-sm hover:bg-gray-400 disabled:opacity-50">
                  {uploadingLive ? 'Saving...' : 'Upload'}
                </button>
                <button onClick={handleSubmitLiveUrl} disabled={uploadingLive} className="flex-1 bg-gray-500 text-white py-2 font-bold text-sm hover:bg-gray-400 disabled:opacity-50">Submit</button>
              </div>
              {/* Output Section */}
              <div className="bg-red-600 text-white text-center py-1 font-bold text-sm">Output</div>
              <div className="mx-2 mb-2 bg-black relative h-[100px] border border-gray-600 mt-2">
                {switcher?.active_source === 'live' && switcher?.live_url ? (
                  <iframe src={switcher.live_url} className="w-full h-full" allowFullScreen />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Not on output</div>
                )}
              </div>
              <button onClick={() => handleSetActiveSource('live')} className={`mx-2 mb-2 py-1 text-sm font-bold ${switcher?.active_source === 'live' ? 'bg-green-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-400'}`}>
                {switcher?.active_source === 'live' ? 'On Air' : 'Set as Output'}
              </button>
            </div>

            {/* Column 2 - Mystream Url */}
            <div className="flex-1 flex flex-col bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-500">
              <div className="bg-gray-800 px-3 py-2 text-white font-bold text-sm border-b border-gray-600">Mystream_Url</div>
              <div className="p-2">
                <button className="w-full bg-gray-600 text-white py-1 px-3 text-sm font-semibold rounded hover:bg-gray-500">Preview</button>
              </div>
              <div className="flex-1 mx-2 bg-black relative min-h-[120px] border border-gray-600">
                {switcher?.mymedia_url ? (
                  <iframe src={switcher.mymedia_url} className="w-full h-full" allowFullScreen />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">No stream</div>
                )}
              </div>
              <div className="flex gap-2 p-2">
                <input type="text" value={previewMymediaUrl} onChange={(e) => setPreviewMymediaUrl(e.target.value)} placeholder="Enter mystream URL" className="flex-1 px-2 py-1 text-xs rounded border border-gray-500 bg-gray-600 text-white" />
              </div>
              <div className="flex gap-2 px-2 pb-2">
                <button onClick={handleSubmitMymediaUrl} disabled={uploadingMymedia} className="flex-1 bg-gray-500 text-white py-2 font-bold text-sm hover:bg-gray-400 disabled:opacity-50">
                  {uploadingMymedia ? 'Saving...' : 'Upload'}
                </button>
                <button onClick={handleSubmitMymediaUrl} disabled={uploadingMymedia} className="flex-1 bg-gray-500 text-white py-2 font-bold text-sm hover:bg-gray-400 disabled:opacity-50">Submit</button>
              </div>
              <div className="bg-red-600 text-white text-center py-1 font-bold text-sm">Output</div>
              <div className="mx-2 mb-2 bg-black relative h-[100px] border border-gray-600 mt-2">
                {switcher?.active_source === 'mymedia' && switcher?.mymedia_url ? (
                  <iframe src={switcher.mymedia_url} className="w-full h-full" allowFullScreen />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Not on output</div>
                )}
              </div>
              <button onClick={() => handleSetActiveSource('mymedia')} className={`mx-2 mb-2 py-1 text-sm font-bold ${switcher?.active_source === 'mymedia' ? 'bg-green-600 text-white' : 'bg-gray-500 text-white hover:bg-gray-400'}`}>
                {switcher?.active_source === 'mymedia' ? 'On Air' : 'Set as Output'}
              </button>
            </div>

            {/* Column 3 - Offline Media */}
            <div className="flex-1 flex flex-col bg-amber-100 rounded-lg overflow-hidden border-2 border-amber-400">
              <div className="bg-amber-200 px-3 py-2 text-amber-900 font-bold text-sm border-b border-amber-300">Offline Media</div>
              <div className="p-2">
                <button className="w-full bg-amber-300 text-amber-900 py-1 px-3 text-sm font-semibold rounded hover:bg-amber-400">Preview</button>
              </div>
              <div className="flex-1 mx-2 bg-amber-50 relative min-h-[120px] border border-amber-300 flex items-center justify-center">
                {offlineMediaList.length > 0 ? (
                  <select value={selectedOfflineId || ''} onChange={(e) => setSelectedOfflineId(e.target.value ? parseInt(e.target.value) : null)} className="w-full h-full px-2 text-sm bg-amber-50">
                    <option value="">Select offline media</option>
                    {offlineMediaList.map(m => (
                      <option key={m.id} value={m.id}>{m.title} ({m.media_type})</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-amber-600 text-sm">No offline media</div>
                )}
              </div>
              <div className="flex flex-col gap-2 p-2">
                <input type="text" value={offlineTitle} onChange={(e) => setOfflineTitle(e.target.value)} placeholder="Media title" className="px-2 py-1 text-xs rounded border border-amber-400 bg-white" />
                <select value={offlineType} onChange={(e) => setOfflineType(e.target.value as 'video' | 'audio')} className="px-2 py-1 text-xs rounded border border-amber-400 bg-white">
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                </select>
                <input ref={offlineFileRef} type="file" accept="video/*,audio/*" onChange={(e) => setOfflineFile(e.target.files?.[0] || null)} className="text-xs" />
              </div>
              <div className="flex gap-2 px-2 pb-2">
                <button onClick={handleUploadOfflineMedia} disabled={uploadingOffline || !offlineFile} className="flex-1 bg-amber-400 text-amber-900 py-2 font-bold text-sm hover:bg-amber-500 disabled:opacity-50">
                  {uploadingOffline ? 'Uploading...' : 'Upload'}
                </button>
                <button onClick={() => selectedOfflineId && handleSetActiveSource('offline', selectedOfflineId)} disabled={!selectedOfflineId} className="flex-1 bg-amber-400 text-amber-900 py-2 font-bold text-sm hover:bg-amber-500 disabled:opacity-50">Submit</button>
              </div>
              <div className="bg-red-600 text-white text-center py-1 font-bold text-sm">Output</div>
              <div className="mx-2 mb-2 bg-amber-50 relative h-[100px] border border-amber-300 mt-2 flex items-center justify-center">
                {switcher?.active_source === 'offline' && switcher?.offlineMedia ? (
                  switcher.offlineMedia.thumbnail_url ? (
                    <img src={switcher.offlineMedia.thumbnail_url} className="w-full h-full object-cover" alt="Offline media" />
                  ) : (
                    <span className="text-amber-600 text-xs">Playing: {switcher.offlineMedia.media_type}</span>
                  )
                ) : (
                  <div className="text-amber-500 text-xs">Not on output</div>
                )}
              </div>
              <button onClick={() => selectedOfflineId && handleSetActiveSource('offline', selectedOfflineId)} className={`mx-2 mb-2 py-1 text-sm font-bold ${switcher?.active_source === 'offline' ? 'bg-green-600 text-white' : 'bg-amber-400 text-amber-900 hover:bg-amber-500'}`}>
                {switcher?.active_source === 'offline' ? 'On Air' : 'Set as Output'}
              </button>
            </div>
          </div>
        ) : (
          // SWITCHER/OFFLINE TABS - Original switcher design
          <div className="flex-1 flex bg-gray-600 min-h-0 p-2 gap-2">
            <div className="flex-1 flex flex-col">
              <div className="flex-1 bg-gray-900 relative min-h-[250px] border-2 border-gray-500">{renderMedia()}</div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleSetActiveSource('live')} className={`flex-1 py-2 font-bold text-center ${switcher?.active_source === 'live' ? 'bg-blue-600 text-white' : 'bg-gray-400 text-gray-800'}`}>Band</button>
                <button onClick={() => handleSetActiveSource('mymedia')} className={`flex-1 py-2 font-bold text-center ${switcher?.active_source === 'mymedia' ? 'bg-blue-600 text-white' : 'bg-gray-400 text-gray-800'}`}>Video</button>
                <button onClick={() => selectedOfflineId && handleSetActiveSource('offline', selectedOfflineId)} className={`flex-1 py-2 font-bold text-center ${switcher?.active_source === 'offline' ? 'bg-red-600 text-white' : 'bg-gray-400 text-gray-800'}`}>Audio</button>
              </div>
              <div className="flex gap-2 mt-2">
                <div className="flex-1 bg-gray-800 h-16 flex items-center justify-center"><Wifi className="text-gray-400" size={24} /></div>
                <div className="flex-1 bg-gray-800 h-16 flex items-center justify-center"><div className="flex gap-0.5">{[...Array(20)].map((_, i) => (<div key={i} className="w-1 bg-pink-500" style={{ height: Math.random() * 30 + 10 }} />))}</div></div>
                <div className="flex-1 bg-gray-800 h-16 flex items-center justify-center"><div className="flex gap-0.5">{[...Array(15)].map((_, i) => (<div key={i} className="w-1 bg-blue-400" style={{ height: Math.random() * 25 + 5 }} />))}</div></div>
              </div>
            </div>
            <div className="w-32 flex flex-col items-center justify-center gap-4">
              <div className="bg-gray-300 rounded px-3 py-1"><span className="text-sm font-bold">ON</span><span className="text-sm font-bold text-red-600 bg-red-200 px-1 ml-1">AIR</span></div>
              <div className="bg-gray-400 rounded-lg p-2 flex flex-col items-center h-48 w-16 relative"><div className="flex-1 w-full bg-gray-300 rounded relative"><div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-10 h-8 bg-gray-600 rounded shadow-lg cursor-pointer" /></div></div>
              <div className="flex flex-col gap-3">
                <div className={`w-6 h-6 rounded-full ${switcher?.active_source === 'live' ? 'bg-green-500' : 'bg-gray-400'} shadow-lg`} />
                <div className={`w-6 h-6 rounded-full ${switcher?.active_source === 'mymedia' ? 'bg-red-500' : 'bg-gray-400'} shadow-lg`} />
                <div className={`w-6 h-6 rounded-full ${switcher?.active_source === 'offline' ? 'bg-red-500' : 'bg-gray-400'} shadow-lg`} />
              </div>
            </div>
            <div className="w-48 flex flex-col gap-2">
              <div className="flex-1 bg-gray-800 rounded overflow-hidden border border-gray-500">
                <div className="bg-gray-700 px-2 py-1 text-xs text-white font-bold">Other stream url</div>
                <div className="h-20 flex items-center justify-center">{switcher?.live_url ? <iframe src={switcher.live_url} className="w-full h-full" /> : <span className="text-gray-500 text-xs">No stream</span>}</div>
              </div>
              <div className="flex-1 bg-gray-800 rounded overflow-hidden border border-gray-500">
                <div className="bg-gray-700 px-2 py-1 text-xs text-white font-bold">Mystream Url</div>
                <div className="h-20 flex items-center justify-center">{switcher?.mymedia_url ? <iframe src={switcher.mymedia_url} className="w-full h-full" /> : <span className="text-gray-500 text-xs">No stream</span>}</div>
              </div>
              <div className="flex-1 bg-gray-800 rounded overflow-hidden border border-gray-500">
                <div className="bg-gray-700 px-2 py-1 text-xs text-white font-bold">Offline Media</div>
                <div className="h-20 flex items-center justify-center">{switcher?.offlineMedia?.thumbnail_url ? <img src={switcher.offlineMedia.thumbnail_url} className="w-full h-full object-cover" /> : <span className="text-gray-500 text-xs">No media</span>}</div>
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
      {/* Mobile Sidebar */}
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
                    <img src={`http://localhost:5002${channelInfo.media_logo}`} alt="Channel" className="w-full h-full object-cover" />
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

