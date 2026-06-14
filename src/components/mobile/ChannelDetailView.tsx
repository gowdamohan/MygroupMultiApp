import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Globe, Youtube, Facebook, Instagram, Twitter, Linkedin, BookOpen,
  Award, Newspaper, Image, Users, Share2, Heart, Eye, UserPlus, X,
  MapPin, Phone, Mail, ChevronDown, ChevronUp, Star, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL, getUploadUrl, WASABI_IMG_PROPS } from '../../config/api.config';

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
  website:   <Globe size={20} />,
  youtube:   <Youtube size={20} />,
  facebook:  <Facebook size={20} />,
  instagram: <Instagram size={20} />,
  twitter:   <Twitter size={20} />,
  linkedin:  <Linkedin size={20} />,
  blog:      <BookOpen size={20} />
};

const SOCIAL_COLORS: Record<string, string> = {
  website:   'bg-gray-600',
  youtube:   'bg-red-600',
  facebook:  'bg-blue-600',
  instagram: 'bg-gradient-to-br from-purple-600 to-pink-500',
  twitter:   'bg-sky-500',
  linkedin:  'bg-blue-700',
  blog:      'bg-orange-500'
};

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const resolveLogoUrl = (channel: any): string | null => {
  if (channel.media_logo_url) return channel.media_logo_url;
  if (channel.media_logo) {
    return channel.media_logo.startsWith('http')
      ? channel.media_logo
      : `${BACKEND_URL}${channel.media_logo}`;
  }
  return null;
};

export const ChannelDetailView: React.FC<ChannelDetailViewProps> = ({ channelId, onBack }) => {
  const [data, setData] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('about');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<Record<number, any[]>>({});
  const [expandedAlbums, setExpandedAlbums] = useState<Set<number>>(new Set());
  const teamScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChannelDetails();
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

  const toggleAlbum = (albumId: number) => {
    setExpandedAlbums(prev => {
      const next = new Set(prev);
      if (next.has(albumId)) {
        next.delete(albumId);
      } else {
        next.add(albumId);
        fetchAlbumImages(albumId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
        <p className="text-sm text-gray-400">Loading channel…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="font-medium mb-2">Channel not found</p>
        <button onClick={onBack} className="mt-2 text-teal-600 underline text-sm">Go Back</button>
      </div>
    );
  }

  const { channel, socialLinks, awards, newsletters, team, gallery } = data;
  const interactions = channel.interactions || { views_count: 0, followers_count: 0, likes_count: 0 };
  const logoSrc = resolveLogoUrl(channel);

  const locationParts = [
    channel.country?.country,
    channel.state?.state,
    channel.district?.district
  ].filter(Boolean);

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'about',      label: 'About',      icon: <BookOpen size={15} /> },
    { id: 'awards',     label: 'Awards',     icon: <Award size={15} />,     count: awards.length },
    { id: 'newsletter', label: 'Newsletter', icon: <Newspaper size={15} />, count: newsletters.length },
    { id: 'gallery',    label: 'Gallery',    icon: <Image size={15} />,     count: gallery.length },
    { id: 'team',       label: 'Team',       icon: <Users size={15} />,     count: team.length },
    { id: 'social',     label: 'Social',     icon: <Share2 size={15} />,    count: socialLinks.filter(l => l.url).length }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-teal-700 text-white shadow-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="p-2 hover:bg-teal-600 rounded-full transition-colors" aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base leading-tight truncate">{channel.media_name_english}</h1>
            {channel.media_name_regional && (
              <p className="text-xs text-teal-100 truncate">{channel.media_name_regional}</p>
            )}
          </div>
          <button
            onClick={async () => {
              if (navigator.share) {
                await navigator.share({ title: channel.media_name_english, url: window.location.href }).catch(() => {});
              }
            }}
            className="p-2 hover:bg-teal-600 rounded-full transition-colors"
            aria-label="Share"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* Channel identity card */}
      <div className="bg-white shadow-sm">
        <div className="p-4 flex items-start gap-4">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={channel.media_name_english}
              className="w-20 h-20 rounded-xl object-contain bg-gray-100 border border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {channel.media_name_english?.charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-base leading-tight">{channel.media_name_english}</h2>
            {channel.media_name_regional && (
              <p className="text-sm text-gray-500 mt-0.5">{channel.media_name_regional}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {channel.select_type && (
                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-medium">
                  {channel.select_type}
                </span>
              )}
              {channel.category?.category_name && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {channel.category.category_name}
                </span>
              )}
              {channel.media_type && channel.media_type !== channel.category?.category_name && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                  {channel.media_type}
                </span>
              )}
            </div>
            <div className="mt-2 space-y-0.5">
              {channel.language?.lang_1 && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Globe size={11} className="text-gray-400" />
                  {channel.language.lang_1}
                </p>
              )}
              {locationParts.length > 0 && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin size={11} className="text-gray-400" />
                  {locationParts.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 border-t border-gray-100">
          <div className="py-3 text-center border-r border-gray-100">
            <div className="flex items-center justify-center gap-1 text-teal-600 mb-0.5">
              <Eye size={15} />
              <span className="font-bold text-gray-900 text-base">{formatCount(interactions.views_count)}</span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Views</p>
          </div>
          <div className="py-3 text-center border-r border-gray-100">
            <div className="flex items-center justify-center gap-1 text-teal-600 mb-0.5">
              <UserPlus size={15} />
              <span className="font-bold text-gray-900 text-base">{formatCount(interactions.followers_count)}</span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Followers</p>
          </div>
          <div className="py-3 text-center">
            <div className="flex items-center justify-center gap-1 text-red-500 mb-0.5">
              <Heart size={15} />
              <span className="font-bold text-gray-900 text-base">{formatCount(interactions.likes_count)}</span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Likes</p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="sticky top-[60px] z-30 bg-white border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <div className="flex" style={{ width: 'max-content', minWidth: '100%' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-teal-700 border-teal-700'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full text-[10px] font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4 pb-8">
        {/* ── About ── */}
        {activeTab === 'about' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-teal-600" />
                About
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                <span className="font-medium text-gray-900">{channel.media_name_english}</span>
                {' '}is a{' '}
                {channel.select_type?.toLowerCase()}{' '}
                {channel.parentCategory?.category_name?.toLowerCase() || channel.media_type?.toLowerCase() || 'media'}{' '}
                channel
                {channel.language?.lang_1 ? ` broadcasting in ${channel.language.lang_1}` : ''}.
                {locationParts.length > 0 ? ` Based in ${locationParts.join(', ')}.` : ''}
              </p>
              {channel.periodical_type && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-600">
                  <Newspaper size={14} className="text-teal-500" />
                  <span>Published <strong>{channel.periodical_type}</strong></span>
                </div>
              )}
            </div>

            {/* Ratings display */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Star size={16} className="text-yellow-500" />
                Ratings &amp; Reviews
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">4.5</p>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {[1,2,3,4,5].map(i => (
                      <Star
                        key={i}
                        size={14}
                        className={i <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-400'}
                        fill={i <= 4 ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Overall Rating</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5,4,3,2,1].map((star, idx) => {
                    const widths = ['75%', '15%', '6%', '3%', '1%'];
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-4">{star}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: widths[idx] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Channel details */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
              <div className="space-y-2.5 text-sm">
                {channel.select_type && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reach</span>
                    <span className="text-gray-800 font-medium">{channel.select_type}</span>
                  </div>
                )}
                {channel.media_type && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="text-gray-800 font-medium">{channel.media_type}</span>
                  </div>
                )}
                {channel.language?.lang_1 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Language</span>
                    <span className="text-gray-800 font-medium">{channel.language.lang_1}</span>
                  </div>
                )}
                {locationParts.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location</span>
                    <span className="text-gray-800 font-medium text-right">{locationParts.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Awards ── */}
        {activeTab === 'awards' && (
          <div className="grid grid-cols-2 gap-3">
            {awards.length === 0 ? (
              <EmptyState icon={<Award size={32} />} message="No awards yet" />
            ) : (
              awards.map(award => (
                <div key={award.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <img
                    src={award.image_url
                      ? (award.image_url.startsWith('http') ? award.image_url : getUploadUrl(award.image_url))
                      : ''}
                    alt={award.title}
                    className="w-full h-32 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    {...WASABI_IMG_PROPS}
                  />
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{award.title}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Newsletter ── */}
        {activeTab === 'newsletter' && (
          <div className="space-y-3">
            {newsletters.length === 0 ? (
              <EmptyState icon={<Newspaper size={32} />} message="No newsletters yet" />
            ) : (
              newsletters.map(nl => (
                <a
                  key={nl.id}
                  href={getUploadUrl(nl.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md active:scale-[0.99] transition-all"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Newspaper className="text-red-600" size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{nl.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {nl.document_type?.toUpperCase()}
                      {nl.file_size ? ` · ${(nl.file_size / 1024 / 1024).toFixed(2)} MB` : ''}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <ArrowLeft size={14} className="text-gray-400 rotate-180" />
                  </div>
                </a>
              ))
            )}
          </div>
        )}

        {/* ── Gallery ── */}
        {activeTab === 'gallery' && (
          <div className="space-y-3">
            {gallery.length === 0 ? (
              <EmptyState icon={<Image size={32} />} message="No gallery albums yet" />
            ) : (
              gallery.map(album => {
                const isExpanded = expandedAlbums.has(album.id);
                const images = galleryImages[album.id] || [];
                return (
                  <div key={album.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button
                      className="w-full p-3 border-b border-gray-100 flex items-center justify-between text-left"
                      onClick={() => toggleAlbum(album.id)}
                    >
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{album.album_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{album.images_count ?? 0} images</p>
                      </div>
                      {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </button>
                    {isExpanded && (
                      <div className="grid grid-cols-3 gap-0.5 p-0.5">
                        {images.length === 0 ? (
                          <div className="col-span-3 py-6 text-center text-gray-400 text-sm">Loading…</div>
                        ) : (
                          images.map(img => {
                            // Backend now returns signed URLs; fall back to getUploadUrl for local paths
                            const thumbSrc = img.thumbnail_url?.startsWith('http')
                              ? img.thumbnail_url
                              : img.image_url?.startsWith('http')
                              ? img.image_url
                              : getUploadUrl(img.thumbnail_url || img.image_url || img.thumbnail_path || img.image_path || '');
                            const fullSrc = img.image_url?.startsWith('http')
                              ? img.image_url
                              : getUploadUrl(img.image_url || img.image_path || '');
                            return (
                              <img
                                key={img.id}
                                src={thumbSrc}
                                alt={img.image_name || ''}
                                className="w-full aspect-square object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setSelectedImage(fullSrc)}
                                {...WASABI_IMG_PROPS}
                              />
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Team (horizontal carousel) ── */}
        {activeTab === 'team' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Our Reporters</h3>
              {team.length > 2 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => teamScrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
                    className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                  >
                    <ChevronLeft size={14} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => teamScrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
                    className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                  >
                    <ChevronRight size={14} className="text-gray-600" />
                  </button>
                </div>
              )}
            </div>
            {team.length === 0 ? (
              <EmptyState icon={<Users size={32} />} message="No team members yet" />
            ) : (
              <div
                ref={teamScrollRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {team.map(member => {
                  const photoSrc = member.photo_url
                    ? (member.photo_url.startsWith('http') ? member.photo_url : getUploadUrl(member.photo_url))
                    : null;
                  return (
                    <div
                      key={member.id}
                      className="flex-shrink-0 w-44 bg-white rounded-xl shadow-sm overflow-hidden"
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      {/* Photo */}
                      <div className="relative h-48 bg-gradient-to-br from-teal-100 to-teal-200">
                        {photoSrc ? (
                          <img
                            src={photoSrc}
                            alt={member.name}
                            className="w-full h-full object-cover object-top"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            {...WASABI_IMG_PROPS}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-teal-400 text-5xl font-black">{member.name?.charAt(0)}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{member.name}</p>
                        {member.designation && (
                          <p className="text-xs text-teal-600 mt-0.5 truncate">{member.designation}</p>
                        )}
                        {member.email && (
                          <a href={`mailto:${member.email}`}
                            className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400 hover:text-teal-600 transition-colors">
                            <Mail size={10} />
                            <span className="truncate">{member.email}</span>
                          </a>
                        )}
                        {/* Channel social links */}
                        <div className="flex items-center gap-1.5 mt-2">
                          {socialLinks.filter((l: any) => l.url && ['facebook','instagram','twitter'].includes(l.platform)).map((l: any) => {
                            const icons: Record<string, React.ReactNode> = {
                              facebook: <Facebook size={11} />, instagram: <Instagram size={11} />, twitter: <Twitter size={11} />,
                            };
                            const bgMap: Record<string, string> = {
                              facebook: 'bg-blue-600', instagram: 'bg-gradient-to-br from-purple-500 to-pink-500', twitter: 'bg-sky-500',
                            };
                            return (
                              <a key={l.platform} href={l.url} target="_blank" rel="noopener noreferrer"
                                className={`w-6 h-6 rounded-full ${bgMap[l.platform]} flex items-center justify-center text-white`}>
                                {icons[l.platform]}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Social ── */}
        {activeTab === 'social' && (
          <div className="space-y-4">
            {/* Social links grid */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Follow Us</h3>
              {socialLinks.filter(link => link.url).length === 0 ? (
                <EmptyState icon={<Share2 size={28} />} message="No social links yet" />
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {socialLinks.filter(link => link.url).map(link => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-white transition-opacity hover:opacity-90 active:opacity-75 ${SOCIAL_COLORS[link.platform] || 'bg-gray-600'}`}
                    >
                      {SOCIAL_ICONS[link.platform] || <Globe size={20} />}
                      <span className="text-[10px] font-medium capitalize">{link.platform}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Get in Touch section */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                <Mail size={15} className="text-teal-600" />
                Get in Touch
              </h3>
              <div className="space-y-3">
                {locationParts.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin size={15} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm text-gray-800 font-medium">{locationParts.join(', ')}</p>
                    </div>
                  </div>
                )}
                {channel.language?.lang_1 && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Globe size={15} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Broadcast Language</p>
                      <p className="text-sm text-gray-800 font-medium">{channel.language.lang_1}</p>
                    </div>
                  </div>
                )}
                {/* Website link if available */}
                {socialLinks.find(l => l.platform === 'website' && l.url) && (
                  <a
                    href={socialLinks.find(l => l.platform === 'website')!.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-1 -mx-1 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Globe size={15} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Website</p>
                      <p className="text-sm text-teal-600 font-medium truncate max-w-[220px]">
                        {socialLinks.find(l => l.platform === 'website')!.url}
                      </p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
              <X size={24} />
            </button>
            <img
              src={selectedImage}
              alt="Gallery"
              className="max-w-full max-h-full object-contain"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EmptyState: React.FC<{ icon: React.ReactNode; message: string }> = ({ icon, message }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center opacity-60">
      {icon}
    </div>
    <p className="text-sm">{message}</p>
  </div>
);

export default ChannelDetailView;
