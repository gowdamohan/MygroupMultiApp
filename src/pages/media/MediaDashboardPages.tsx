import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Save, Trash2, Plus, Upload, X, Play, Pause, Image, FileText,
  ThumbsUp, ThumbsDown, Users, Star, MessageCircle, ExternalLink,
  Globe, Youtube, Facebook, Instagram, Twitter, Linkedin, BookOpen,
  Video, Music, Check, FolderPlus, Eye
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';

// ============================================
// SOCIAL MEDIA SECTION
// ============================================
interface SocialLinksData {
  website: string; youtube: string; facebook: string; instagram: string;
  twitter: string; linkedin: string; blog: string;
}

export const SocialMediaSection: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const [links, setLinks] = useState<SocialLinksData>({
    website: '', youtube: '', facebook: '', instagram: '', twitter: '', linkedin: '', blog: ''
  });
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { fetchLinks(); }, [channelId]);

  const fetchLinks = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/media-dashboard/social-links/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setLinks(res.data.data);
    } catch (error) { console.error('Error fetching social links:', error); }
  };

  const saveLink = async (platform: keyof SocialLinksData) => {
    setSaving(platform);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/media-dashboard/social-links/${channelId}`,
        { platform, url: links[platform] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) { console.error('Error saving link:', error); }
    setSaving(null);
  };

  const platformIcons: Record<string, any> = {
    website: Globe, youtube: Youtube, facebook: Facebook, instagram: Instagram,
    twitter: Twitter, linkedin: Linkedin, blog: BookOpen
  };

  const platformLabels: Record<string, string> = {
    website: 'Website', youtube: 'YouTube', facebook: 'Facebook', instagram: 'Instagram',
    twitter: 'Twitter', linkedin: 'LinkedIn', blog: 'Blog'
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Social Media Links</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {Object.keys(links).map((platform) => {
            const Icon = platformIcons[platform];
            return (
              <div key={platform} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Icon className="text-teal-600" size={20} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {platformLabels[platform]}
                  </label>
                  <input
                    type="url"
                    value={links[platform as keyof SocialLinksData]}
                    onChange={(e) => setLinks({ ...links, [platform]: e.target.value })}
                    placeholder={`Enter ${platformLabels[platform]} URL`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => saveLink(platform as keyof SocialLinksData)}
                  disabled={saving === platform}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save size={16} />
                  {saving === platform ? 'Saving...' : 'Save'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================
// VIEW SECTION (Display based on Switcher)
// ============================================
interface SwitcherData {
  active_source: 'live' | 'mymedia' | 'offline';
  live_url: string | null;
  mymedia_url: string | null;
  offlineMedia?: { media_file_url: string; media_type: string; thumbnail_url?: string } | null;
}

interface InteractionsData {
  likes_count: number; dislikes_count: number; followers_count: number;
  shortlist_count: number; comments_count: number;
}

export const ViewSection: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const [switcher, setSwitcher] = useState<SwitcherData | null>(null);
  const [interactions, setInteractions] = useState<InteractionsData | null>(null);

  useEffect(() => { fetchData(); }, [channelId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const [switcherRes, interactionsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/media-dashboard/switcher/${channelId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/media-dashboard/interactions/${channelId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (switcherRes.data.success) setSwitcher(switcherRes.data.data);
      if (interactionsRes.data.success) setInteractions(interactionsRes.data.data);
    } catch (error) { console.error('Error fetching view data:', error); }
  };

  const renderMedia = () => {
    if (!switcher) return <div className="text-gray-500">Loading...</div>;
    
    const { active_source, live_url, mymedia_url, offlineMedia } = switcher;
    
    if (active_source === 'live' && live_url) {
      return <iframe src={live_url} className="w-full h-96 rounded-lg" allowFullScreen />;
    }
    if (active_source === 'mymedia' && mymedia_url) {
      return <iframe src={mymedia_url} className="w-full h-96 rounded-lg" allowFullScreen />;
    }
    if (active_source === 'offline' && offlineMedia) {
      if (offlineMedia.media_type === 'video') {
        return <video src={offlineMedia.media_file_url} controls className="w-full h-96 rounded-lg bg-black" />;
      }
      return (
        <div className="relative w-full h-96 bg-gray-900 rounded-lg flex items-center justify-center">
          {offlineMedia.thumbnail_url && <img src={offlineMedia.thumbnail_url} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
          <audio src={offlineMedia.media_file_url} controls className="z-10" />
        </div>
      );
    }
    return <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">No media selected</div>;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">View</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">{renderMedia()}</div>
        {interactions && (
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
              <ThumbsUp className="text-green-600" size={18} />
              <span className="font-medium">{interactions.likes_count}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
              <ThumbsDown className="text-red-600" size={18} />
              <span className="font-medium">{interactions.dislikes_count}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
              <Users className="text-blue-600" size={18} />
              <span className="font-medium">{interactions.followers_count} Followers</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg">
              <Star className="text-yellow-600" size={18} />
              <span className="font-medium">{interactions.shortlist_count} Shortlisted</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg">
              <MessageCircle className="text-purple-600" size={18} />
              <span className="font-medium">{interactions.comments_count} Comments</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// SWITCHER SECTION
// ============================================
interface OfflineMediaItem {
  id: number; title: string; media_type: string; media_file_url: string;
  thumbnail_url?: string; is_default: number;
}

export const SwitcherSection: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const [activeSource, setActiveSource] = useState<'live' | 'mymedia' | 'offline'>('offline');
  const [liveUrl, setLiveUrl] = useState('');
  const [mymediaUrl, setMymediaUrl] = useState('');
  const [offlineMedia, setOfflineMedia] = useState<OfflineMediaItem[]>([]);
  const [selectedOffline, setSelectedOffline] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, [channelId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const [switcherRes, offlineRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/media-dashboard/switcher/${channelId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/media-dashboard/offline-media/${channelId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (switcherRes.data.success) {
        const data = switcherRes.data.data;
        setActiveSource(data.active_source || 'offline');
        setLiveUrl(data.live_url || '');
        setMymediaUrl(data.mymedia_url || '');
        setSelectedOffline(data.offline_media_id);
      }
      if (offlineRes.data.success) setOfflineMedia(offlineRes.data.data);
    } catch (error) { console.error('Error fetching switcher data:', error); }
  };

  const saveSwitcher = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${API_BASE_URL}/media-dashboard/switcher/${channelId}`,
        { active_source: activeSource, live_url: liveUrl, mymedia_url: mymediaUrl, offline_media_id: selectedOffline },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) { console.error('Error saving switcher:', error); }
    setSaving(false);
  };

  const getPreviewUrl = () => {
    if (activeSource === 'live') return liveUrl;
    if (activeSource === 'mymedia') return mymediaUrl;
    const selected = offlineMedia.find(m => m.id === selectedOffline);
    return selected?.media_file_url || '';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Switcher</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Window */}
        <div className={`bg-white rounded-xl shadow-sm border-2 p-4 cursor-pointer transition-all ${activeSource === 'live' ? 'border-teal-500 ring-2 ring-teal-200' : 'border-gray-200'}`}
          onClick={() => setActiveSource('live')}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Live</h3>
            {activeSource === 'live' && <Check className="text-teal-600" size={20} />}
          </div>
          <input type="url" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)}
            placeholder="Enter Live URL" onClick={(e) => e.stopPropagation()}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          {liveUrl && <div className="mt-2 h-32 bg-gray-100 rounded-lg overflow-hidden">
            <iframe src={liveUrl} className="w-full h-full" />
          </div>}
        </div>

        {/* MyMedia Window */}
        <div className={`bg-white rounded-xl shadow-sm border-2 p-4 cursor-pointer transition-all ${activeSource === 'mymedia' ? 'border-teal-500 ring-2 ring-teal-200' : 'border-gray-200'}`}
          onClick={() => setActiveSource('mymedia')}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">MyMedia</h3>
            {activeSource === 'mymedia' && <Check className="text-teal-600" size={20} />}
          </div>
          <input type="url" value={mymediaUrl} onChange={(e) => setMymediaUrl(e.target.value)}
            placeholder="Enter MyMedia URL" onClick={(e) => e.stopPropagation()}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          {mymediaUrl && <div className="mt-2 h-32 bg-gray-100 rounded-lg overflow-hidden">
            <iframe src={mymediaUrl} className="w-full h-full" />
          </div>}
        </div>

        {/* Offline Window */}
        <div className={`bg-white rounded-xl shadow-sm border-2 p-4 cursor-pointer transition-all ${activeSource === 'offline' ? 'border-teal-500 ring-2 ring-teal-200' : 'border-gray-200'}`}
          onClick={() => setActiveSource('offline')}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Offline</h3>
            {activeSource === 'offline' && <Check className="text-teal-600" size={20} />}
          </div>
          <select value={selectedOffline || ''} onChange={(e) => setSelectedOffline(Number(e.target.value) || null)}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Select offline media</option>
            {offlineMedia.map(m => <option key={m.id} value={m.id}>{m.title} ({m.media_type})</option>)}
          </select>
          {selectedOffline && (() => {
            const selected = offlineMedia.find(m => m.id === selectedOffline);
            return selected && (
              <div className="mt-2 h-32 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                {selected.media_type === 'video' ? (
                  <video src={selected.media_file_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="relative w-full h-full">
                    {selected.thumbnail_url && <img src={selected.thumbnail_url} className="w-full h-full object-cover" />}
                    <Music className="absolute inset-0 m-auto text-white" size={32} />
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
      <button onClick={saveSwitcher} disabled={saving}
        className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
        <Save size={18} /> {saving ? 'Saving...' : 'Save Switcher Settings'}
      </button>
    </div>
  );
};

// ============================================
// OFFLINE MEDIA SECTION
// ============================================
export const OfflineMediaSection: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const [mediaList, setMediaList] = useState<OfflineMediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', media_type: 'video', is_default: false });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  useEffect(() => { fetchMedia(); }, [channelId]);

  const fetchMedia = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/media-dashboard/offline-media/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setMediaList(res.data.data);
    } catch (error) { console.error('Error fetching offline media:', error); }
  };

  const handleUpload = async () => {
    if (!mediaFile || !formData.title) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const fd = new FormData();
      fd.append('media_file', mediaFile);
      fd.append('title', formData.title);
      fd.append('media_type', formData.media_type);
      fd.append('is_default', formData.is_default ? '1' : '0');
      if (thumbnailFile) fd.append('thumbnail', thumbnailFile);

      await axios.post(`${API_BASE_URL}/media-dashboard/offline-media/${channelId}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      fetchMedia();
      setShowForm(false);
      setFormData({ title: '', media_type: 'video', is_default: false });
      setMediaFile(null);
      setThumbnailFile(null);
    } catch (error) { console.error('Error uploading media:', error); }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this media?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/media-dashboard/offline-media/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMedia();
    } catch (error) { console.error('Error deleting media:', error); }
  };

  const setDefault = async (id: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`${API_BASE_URL}/media-dashboard/offline-media/${id}/default`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMedia();
    } catch (error) { console.error('Error setting default:', error); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Offline Media</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2">
          <Plus size={18} /> Add Media
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={formData.media_type} onChange={(e) => setFormData({ ...formData, media_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Media File</label>
              <input type="file" accept={formData.media_type === 'video' ? 'video/*' : 'audio/*'}
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            {formData.media_type === 'audio' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Image</label>
                <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_default" checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })} />
              <label htmlFor="is_default" className="text-sm text-gray-700">Set as default</label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleUpload} disabled={uploading || !mediaFile || !formData.title}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
              <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaList.map((media) => (
          <div key={media.id} className={`bg-white rounded-xl shadow-sm border-2 p-4 ${media.is_default ? 'border-teal-500' : 'border-gray-200'}`}>
            <div className="h-40 bg-gray-900 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
              {media.media_type === 'video' ? (
                <video src={media.media_file_url} className="w-full h-full object-cover" />
              ) : (
                <div className="relative w-full h-full">
                  {media.thumbnail_url ? <img src={media.thumbnail_url} className="w-full h-full object-cover" /> : null}
                  <Music className="absolute inset-0 m-auto text-white" size={40} />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">{media.title}</h3>
                <p className="text-sm text-gray-500 capitalize">{media.media_type}</p>
              </div>
              <div className="flex gap-2">
                {!media.is_default && (
                  <button onClick={() => setDefault(media.id)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg" title="Set as default">
                    <Check size={18} />
                  </button>
                )}
                <button onClick={() => handleDelete(media.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            {media.is_default && <span className="inline-block mt-2 px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">Default</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// DOCUMENTS SECTION
// ============================================
interface DocumentItem { id: number; title: string; document_type: string; file_url: string; }

export const DocumentsSection: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => { fetchDocuments(); }, [channelId]);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/media-dashboard/documents/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setDocuments(res.data.data);
    } catch (error) { console.error('Error fetching documents:', error); }
  };

  const handleUpload = async () => {
    if (!file || !title) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title);
      await axios.post(`${API_BASE_URL}/media-dashboard/documents/${channelId}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      fetchDocuments();
      setTitle('');
      setFile(null);
    } catch (error) { console.error('Error uploading document:', error); }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this document?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/media-dashboard/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDocuments();
    } catch (error) { console.error('Error deleting document:', error); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Documents</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Document Title" className="px-4 py-2 border border-gray-300 rounded-lg" />
          <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg" />
          <button onClick={handleUpload} disabled={uploading || !file || !title}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
            <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {doc.document_type === 'pdf' ? <FileText className="text-red-500" size={24} /> : <Image className="text-blue-500" size={24} />}
                <div>
                  <p className="font-medium text-gray-800">{doc.title}</p>
                  <p className="text-sm text-gray-500 uppercase">{doc.document_type}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <ExternalLink size={18} />
                </a>
                <button onClick={() => handleDelete(doc.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// AWARDS SECTION
// ============================================
interface AwardItem { id: number; title: string; image_url: string; }

export const AwardsSection: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => { fetchAwards(); }, [channelId]);

  const fetchAwards = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/media-dashboard/awards/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setAwards(res.data.data);
    } catch (error) { console.error('Error fetching awards:', error); }
  };

  const handleUpload = async () => {
    if (!file || !title) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const fd = new FormData();
      fd.append('image', file);
      fd.append('title', title);
      await axios.post(`${API_BASE_URL}/media-dashboard/awards/${channelId}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      fetchAwards();
      setTitle('');
      setFile(null);
    } catch (error) { console.error('Error uploading award:', error); }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this award?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/media-dashboard/awards/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAwards();
    } catch (error) { console.error('Error deleting award:', error); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Awards</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Award Title" className="px-4 py-2 border border-gray-300 rounded-lg" />
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg" />
          <button onClick={handleUpload} disabled={uploading || !file || !title}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
            <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {awards.map((award) => (
            <div key={award.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <img src={award.image_url} alt={award.title} className="w-full h-40 object-cover" />
              <div className="p-3 flex items-center justify-between">
                <p className="font-medium text-gray-800 truncate">{award.title}</p>
                <button onClick={() => handleDelete(award.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// NEWSLETTER SECTION
// ============================================
interface NewsletterItem { id: number; title: string; document_type: string; file_url: string; }

export const NewsletterSection: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const [newsletters, setNewsletters] = useState<NewsletterItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => { fetchNewsletters(); }, [channelId]);

  const fetchNewsletters = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/media-dashboard/newsletters/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setNewsletters(res.data.data);
    } catch (error) { console.error('Error fetching newsletters:', error); }
  };

  const handleUpload = async () => {
    if (!file || !title) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title);
      await axios.post(`${API_BASE_URL}/media-dashboard/newsletters/${channelId}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      fetchNewsletters();
      setTitle('');
      setFile(null);
    } catch (error) { console.error('Error uploading newsletter:', error); }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this newsletter?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/media-dashboard/newsletters/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNewsletters();
    } catch (error) { console.error('Error deleting newsletter:', error); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Newsletter</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Newsletter Title" className="px-4 py-2 border border-gray-300 rounded-lg" />
          <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg" />
          <button onClick={handleUpload} disabled={uploading || !file || !title}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
            <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {newsletters.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {item.document_type === 'pdf' ? <FileText className="text-red-500" size={24} /> : <Image className="text-blue-500" size={24} />}
                <div>
                  <p className="font-medium text-gray-800">{item.title}</p>
                  <p className="text-sm text-gray-500 uppercase">{item.document_type}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <ExternalLink size={18} />
                </a>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// GALLERY SECTION
// ============================================
interface AlbumItem { id: number; album_name: string; description?: string; cover_image_url?: string; images_count: number; images?: GalleryImageItem[]; }
interface GalleryImageItem { id: number; image_name: string; image_url: string; }

export const GallerySection: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumItem | null>(null);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchAlbums(); }, [channelId]);

  const fetchAlbums = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/media-dashboard/gallery/albums/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setAlbums(res.data.data);
    } catch (error) { console.error('Error fetching albums:', error); }
  };

  const createAlbum = async () => {
    if (!albumName) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const fd = new FormData();
      fd.append('album_name', albumName);
      fd.append('description', albumDesc);
      if (coverFile) fd.append('cover', coverFile);
      await axios.post(`${API_BASE_URL}/media-dashboard/gallery/albums/${channelId}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      fetchAlbums();
      setShowCreateAlbum(false);
      setAlbumName('');
      setAlbumDesc('');
      setCoverFile(null);
    } catch (error) { console.error('Error creating album:', error); }
    setUploading(false);
  };

  const deleteAlbum = async (id: number) => {
    if (!confirm('Delete this album and all its images?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/media-dashboard/gallery/albums/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAlbums();
      if (selectedAlbum?.id === id) setSelectedAlbum(null);
    } catch (error) { console.error('Error deleting album:', error); }
  };

  const uploadImages = async () => {
    if (!selectedAlbum || !imageFiles || imageFiles.length === 0) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const fd = new FormData();
      Array.from(imageFiles).forEach(f => fd.append('images', f));
      await axios.post(`${API_BASE_URL}/media-dashboard/gallery/images/${selectedAlbum.id}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      fetchAlbums();
      setImageFiles(null);
    } catch (error) { console.error('Error uploading images:', error); }
    setUploading(false);
  };

  const deleteImage = async (id: number) => {
    if (!confirm('Delete this image?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/media-dashboard/gallery/images/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAlbums();
    } catch (error) { console.error('Error deleting image:', error); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gallery</h2>
        <button onClick={() => setShowCreateAlbum(true)} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2">
          <FolderPlus size={18} /> Create Album
        </button>
      </div>

      {showCreateAlbum && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Create New Album</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={albumName} onChange={(e) => setAlbumName(e.target.value)}
              placeholder="Album Name" className="px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="text" value={albumDesc} onChange={(e) => setAlbumDesc(e.target.value)}
              placeholder="Description (optional)" className="px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={createAlbum} disabled={uploading || !albumName}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
              {uploading ? 'Creating...' : 'Create Album'}
            </button>
            <button onClick={() => setShowCreateAlbum(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {albums.map((album) => (
          <div key={album.id} className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden cursor-pointer transition-all ${selectedAlbum?.id === album.id ? 'border-teal-500' : 'border-gray-200'}`}
            onClick={() => setSelectedAlbum(album)}>
            <div className="h-32 bg-gray-200">
              {album.cover_image_url ? <img src={album.cover_image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image className="text-gray-400" size={40} /></div>}
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800">{album.album_name}</h3>
                <button onClick={(e) => { e.stopPropagation(); deleteAlbum(album.id); }} className="p-1 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-500">{album.images_count} images</p>
            </div>
          </div>
        ))}
      </div>

      {selectedAlbum && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">{selectedAlbum.album_name}</h3>
            <button onClick={() => setSelectedAlbum(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
          </div>
          <div className="flex gap-4 mb-4">
            <input type="file" accept="image/*" multiple onChange={(e) => setImageFiles(e.target.files)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
            <button onClick={uploadImages} disabled={uploading || !imageFiles}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
              <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Images'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {selectedAlbum.images?.map((img) => (
              <div key={img.id} className="relative group">
                <img src={img.image_url} alt={img.image_name} className="w-full h-24 object-cover rounded-lg" />
                <button onClick={() => deleteImage(img.id)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// TEAM SECTION
// ============================================
interface TeamMember { id: number; name: string; designation?: string; id_number?: string; email?: string; photo_url?: string; }

export const TeamSection: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', designation: '', id_number: '', email: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTeam(); }, [channelId]);

  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/media-dashboard/team/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setMembers(res.data.data);
    } catch (error) { console.error('Error fetching team:', error); }
  };

  const handleSubmit = async () => {
    if (!formData.name) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('designation', formData.designation);
      fd.append('id_number', formData.id_number);
      fd.append('email', formData.email);
      if (photoFile) fd.append('photo', photoFile);

      if (editingId) {
        await axios.put(`${API_BASE_URL}/media-dashboard/team/${editingId}`, fd, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API_BASE_URL}/media-dashboard/team/${channelId}`, fd, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }
      fetchTeam();
      resetForm();
    } catch (error) { console.error('Error saving team member:', error); }
    setSaving(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', designation: '', id_number: '', email: '' });
    setPhotoFile(null);
  };

  const editMember = (member: TeamMember) => {
    setEditingId(member.id);
    setFormData({ name: member.name, designation: member.designation || '', id_number: member.id_number || '', email: member.email || '' });
    setShowForm(true);
  };

  const deleteMember = async (id: number) => {
    if (!confirm('Delete this team member?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/media-dashboard/team/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTeam();
    } catch (error) { console.error('Error deleting member:', error); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Team</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2">
          <Plus size={18} /> Add Member
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">{editingId ? 'Edit' : 'Add'} Team Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Name *" className="px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              placeholder="Designation" className="px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="text" value={formData.id_number} onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
              placeholder="ID Number" className="px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email" className="px-4 py-2 border border-gray-300 rounded-lg" />
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSubmit} disabled={saving || !formData.name}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
              {saving ? 'Saving...' : editingId ? 'Update' : 'Add Member'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {member.photo_url ? <img src={member.photo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Users className="text-gray-400" size={24} /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{member.name}</h3>
                {member.designation && <p className="text-sm text-teal-600">{member.designation}</p>}
                {member.id_number && <p className="text-xs text-gray-500">ID: {member.id_number}</p>}
                {member.email && <p className="text-xs text-gray-500 truncate">{member.email}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => editMember(member)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                  <Eye size={16} />
                </button>
                <button onClick={() => deleteMember(member.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
