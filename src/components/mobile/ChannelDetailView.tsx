import React, { useState, useEffect } from 'react';
import { ArrowLeft, Globe, Youtube, Facebook, Instagram, Twitter, Linkedin, BookOpen, Award, Newspaper, Image, Users, Share2, Heart, Eye, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

interface ChannelDetailViewProps {
  channelId: number;
  onBack: () => void;
}

interface ChannelData {
  channel: any;
  socialLinks: any[];
  awards: any[];
  newsletters: any[];
  team: any[];
  gallery: any[];
  switcher: any;
}

type TabType = 'about' | 'awards' | 'newsletter' | 'gallery' | 'team' | 'social';

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  website: <Globe size={20} />,
  youtube: <Youtube size={20} />,
  facebook: <Facebook size={20} />,
  instagram: <Instagram size={20} />,
  twitter: <Twitter size={20} />,
  linkedin: <Linkedin size={20} />,
  blog: <BookOpen size={20} />
};

const SOCIAL_COLORS: Record<string, string> = {
  website: 'bg-gray-600',
  youtube: 'bg-red-600',
  facebook: 'bg-blue-600',
  instagram: 'bg-gradient-to-br from-purple-600 to-pink-500',
  twitter: 'bg-sky-500',
  linkedin: 'bg-blue-700',
  blog: 'bg-orange-500'
};

export const ChannelDetailView: React.FC<ChannelDetailViewProps> = ({ channelId, onBack }) => {
  const [data, setData] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('about');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<Record<number, any[]>>({});

  useEffect(() => {
    fetchChannelDetails();
    incrementViewCount();
  }, [channelId]);

  const fetchChannelDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/mymedia/channel/${channelId}`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching channel details:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await axios.post(`${API_BASE_URL}/mymedia/channel/${channelId}/view`);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const fetchAlbumImages = async (albumId: number) => {
    if (galleryImages[albumId]) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/mymedia/gallery/${albumId}/images`);
      if (response.data.success) {
        setGalleryImages(prev => ({ ...prev, [albumId]: response.data.data }));
      }
    } catch (error) {
      console.error('Error fetching album images:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Channel not found</p>
        <button onClick={onBack} className="mt-4 text-teal-600 underline">Go Back</button>
      </div>
    );
  }

  const { channel, socialLinks, awards, newsletters, team, gallery } = data;
  const interactions = channel.interactions || { views_count: 0, followers_count: 0, likes_count: 0 };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'about', label: 'About', icon: <BookOpen size={16} /> },
    { id: 'awards', label: 'Awards', icon: <Award size={16} />, count: awards.length },
    { id: 'newsletter', label: 'Newsletter', icon: <Newspaper size={16} />, count: newsletters.length },
    { id: 'gallery', label: 'Gallery', icon: <Image size={16} />, count: gallery.length },
    { id: 'team', label: 'Team', icon: <Users size={16} />, count: team.length },
    { id: 'social', label: 'Social', icon: <Share2 size={16} />, count: socialLinks.length }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-teal-700 text-white">
        <div className="flex items-center gap-3 p-4">
          <button onClick={onBack} className="p-2 hover:bg-teal-600 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg truncate">{channel.media_name_english}</h1>
            {channel.media_name_regional && (
              <p className="text-sm text-teal-100 truncate">{channel.media_name_regional}</p>
            )}
          </div>
        </div>
      </div>

      {/* Channel Info Card */}
      <div className="bg-white shadow-sm">
        <div className="p-4 flex items-start gap-4">
          {channel.media_logo ? (
            <img src={`${BACKEND_URL}${channel.media_logo}`} alt={channel.media_name_english} className="w-20 h-20 rounded-lg object-contain bg-gray-100" />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
              {channel.media_name_english?.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs">{channel.select_type}</span>
              {channel.category?.category_name && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{channel.category.category_name}</span>
              )}
            </div>
            {channel.language?.lang_1 && <p className="text-sm text-gray-600">Language: {channel.language.lang_1}</p>}
            {channel.country?.country && <p className="text-sm text-gray-600">Location: {channel.country.country}{channel.state?.state ? `, ${channel.state.state}` : ''}</p>}
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 border-t">
          <div className="p-3 text-center border-r">
            <div className="flex items-center justify-center gap-1 text-gray-500"><Eye size={16} /><span className="font-bold text-gray-900">{interactions.views_count}</span></div>
            <p className="text-xs text-gray-500">Views</p>
          </div>
          <div className="p-3 text-center border-r">
            <div className="flex items-center justify-center gap-1 text-gray-500"><UserPlus size={16} /><span className="font-bold text-gray-900">{interactions.followers_count}</span></div>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
          <div className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500"><Heart size={16} /><span className="font-bold text-gray-900">{interactions.likes_count}</span></div>
            <p className="text-xs text-gray-500">Likes</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[72px] z-30 bg-white border-b overflow-x-auto scrollbar-hide">
        <div className="flex" style={{ width: 'max-content' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'text-teal-700 border-b-2 border-teal-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'about' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-gray-600 text-sm">
                {channel.media_name_english} is a {channel.select_type?.toLowerCase()} {channel.parentCategory?.category_name?.toLowerCase() || 'media'} channel
                {channel.language?.lang_1 ? ` in ${channel.language.lang_1}` : ''}.
              </p>
              {channel.periodical_type && (
                <p className="text-gray-600 text-sm mt-2">Publication: {channel.periodical_type}</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'awards' && (
          <div className="grid grid-cols-2 gap-3">
            {awards.length === 0 ? (
              <p className="col-span-2 text-center text-gray-500 py-8">No awards yet</p>
            ) : (
              awards.map(award => (
                <div key={award.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <img src={`${BACKEND_URL}${award.image_url}`} alt={award.title} className="w-full h-32 object-cover" />
                  <div className="p-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{award.title}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'newsletter' && (
          <div className="space-y-3">
            {newsletters.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No newsletters yet</p>
            ) : (
              newsletters.map(nl => (
                <a key={nl.id} href={`${BACKEND_URL}${nl.file_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Newspaper className="text-red-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{nl.title}</p>
                    <p className="text-xs text-gray-500">{nl.document_type?.toUpperCase()} • {nl.file_size ? `${(nl.file_size / 1024 / 1024).toFixed(2)} MB` : ''}</p>
                  </div>
                </a>
              ))
            )}
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-4">
            {gallery.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No gallery albums yet</p>
            ) : (
              gallery.map(album => (
                <div key={album.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-3 border-b flex items-center justify-between" onClick={() => fetchAlbumImages(album.id)}>
                    <div>
                      <p className="font-medium text-gray-900">{album.album_name}</p>
                      <p className="text-xs text-gray-500">{album.images_count} images</p>
                    </div>
                  </div>
                  {galleryImages[album.id] && (
                    <div className="grid grid-cols-3 gap-1 p-1">
                      {galleryImages[album.id].map(img => (
                        <img key={img.id} src={`${BACKEND_URL}${img.thumbnail_url || img.image_url}`} alt={img.image_name} className="w-full aspect-square object-cover cursor-pointer" onClick={() => setSelectedImage(`${BACKEND_URL}${img.image_url}`)} />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="grid grid-cols-2 gap-3">
            {team.length === 0 ? (
              <p className="col-span-2 text-center text-gray-500 py-8">No team members yet</p>
            ) : (
              team.map(member => (
                <div key={member.id} className="bg-white rounded-lg shadow-sm p-3 text-center">
                  {member.photo_url ? (
                    <img src={`${BACKEND_URL}${member.photo_url}`} alt={member.name} className="w-16 h-16 rounded-full mx-auto object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full mx-auto bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold">{member.name?.charAt(0)}</div>
                  )}
                  <p className="font-medium text-gray-900 mt-2 text-sm">{member.name}</p>
                  {member.designation && <p className="text-xs text-gray-500">{member.designation}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'social' && (
          <div className="grid grid-cols-4 gap-3">
            {socialLinks.length === 0 ? (
              <p className="col-span-4 text-center text-gray-500 py-8">No social links yet</p>
            ) : (
              socialLinks.filter(link => link.url).map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className={`flex flex-col items-center gap-2 p-3 rounded-lg text-white ${SOCIAL_COLORS[link.platform] || 'bg-gray-600'}`}>
                  {SOCIAL_ICONS[link.platform] || <Globe size={20} />}
                  <span className="text-xs capitalize">{link.platform}</span>
                </a>
              ))
            )}
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setSelectedImage(null)}>
            <button className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full"><X size={24} /></button>
            <img src={selectedImage} alt="Gallery" className="max-w-full max-h-full object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChannelDetailView;

