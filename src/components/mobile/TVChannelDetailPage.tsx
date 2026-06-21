/**
 * TVChannelDetailPage
 *
 * Single-page layout combining:
 *  - Video / Audio player at the top
 *  - Real-time interaction bar (views · likes · followers · share)
 *  - Scrollable channel sections:
 *    About (with social links), Ratings & Reviews (real + submit), Gallery,
 *    Newsletter, Our Reporters (carousel), Get in Touch
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize,
  Heart, Eye, UserPlus, Share2, Loader2, Wifi, Radio,
  Globe, Youtube, Facebook, Instagram, Twitter, Linkedin,
  Star, ChevronRight, MapPin, Mail, Phone, X, Settings, Bell,
  Send, ChevronLeft, FileText, Newspaper
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL, getUploadUrl, WASABI_IMG_PROPS } from '../../config/api.config';
import {
  buildPlaybackFromStreamApi,
  buildPlaybackFromScheduleFile,
  resolveMediaSrc,
  EMBED_IFRAME_PROPS,
  type PlaybackConfig
} from '../../utils/mediaPlayback';

/* ─── Types ─────────────────────────────────────────────────── */
interface Props {
  channelId: number;
  channelName: string;
  channelLogo?: string;
  isRadio?: boolean;
  scheduleMediaFile?: string | null;
  scheduleMediaUrl?: string | null;
  programTitle?: string;
  onBack: () => void;
}

interface Interactions {
  views_count: number;
  likes_count: number;
  followers_count: number;
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

interface Review {
  id: number;
  reviewer_name: string;
  comment_text: string;
  rating: number | null;
  created_at: string;
}

interface ReviewStats {
  average: number | null;
  total: number;
  counts: Record<string, number>;
}

interface NewsItem {
  title: string;
  url: string;
  description: string;
  image: string;
  publishedAt: string;
}

/* ─── Helpers ────────────────────────────────────────────────── */
const fmt = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

/** Resolve image path/URL/Wasabi-key → displayable URL */
const resolveImg = (p: string | null | undefined): string | null => {
  if (!p) return null;
  if (p.startsWith('http')) return p;
  return getUploadUrl(p);
};

const SOCIAL_BG: Record<string, string> = {
  website: 'bg-gray-500', youtube: 'bg-red-600', facebook: 'bg-blue-600',
  instagram: 'bg-gradient-to-br from-purple-500 to-pink-500',
  twitter: 'bg-sky-500', linkedin: 'bg-blue-700', blog: 'bg-orange-500',
};
const SOCIAL_ICON: Record<string, React.ReactNode> = {
  website: <Globe size={16} />, youtube: <Youtube size={16} />, facebook: <Facebook size={16} />,
  instagram: <Instagram size={16} />, twitter: <Twitter size={16} />, linkedin: <Linkedin size={16} />,
};

const LS_LIKE_KEY = (id: number) => `mc_liked_${id}`;
const LS_FOLLOW_KEY = (id: number) => `mc_following_${id}`;

/* ─── Component ──────────────────────────────────────────────── */
export const TVChannelDetailPage: React.FC<Props> = ({
  channelId, channelName, channelLogo, isRadio = false,
  scheduleMediaFile, scheduleMediaUrl, programTitle, onBack,
}) => {
  /* player state */
  const mediaRef = useRef<HTMLMediaElement>(null);
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);
  const reportersScrollRef = useRef<HTMLDivElement>(null);
  const [playback, setPlayback] = useState<PlaybackConfig>({ mode: 'none', mediaSrc: '', embedSrc: '', label: 'Live' });
  const [playerLoading, setPlayerLoading] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [activeSource, setActiveSource] = useState('');

  /* interaction state */
  const [interactions, setInteractions] = useState<Interactions>({ views_count: 0, likes_count: 0, followers_count: 0 });
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  /* channel detail state */
  const [data, setData] = useState<ChannelData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  /* reviews state */
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ average: null, total: 0, counts: {} });
  const [reviewForm, setReviewForm] = useState({ rating: 0, name: '', comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  /* news feed state */
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  /* logo */
  const logoSrc = (() => {
    if (channelLogo) return channelLogo.startsWith('http') ? channelLogo : `${BACKEND_URL}${channelLogo}`;
    const ch = data?.channel;
    if (ch?.media_logo_url) return ch.media_logo_url;
    if (ch?.media_logo) return resolveImg(ch.media_logo);
    return null;
  })();

  /* ── Load like/follow from localStorage ── */
  useEffect(() => {
    setIsLiked(localStorage.getItem(LS_LIKE_KEY(channelId)) === '1');
    setIsFollowing(localStorage.getItem(LS_FOLLOW_KEY(channelId)) === '1');
  }, [channelId]);

  /* ── Load playback ── */
  const loadPlayback = useCallback(async () => {
    setPlayerLoading(true);
    setPlayerError(null);
    try {
      if (scheduleMediaUrl || scheduleMediaFile) {
        const src = scheduleMediaUrl || scheduleMediaFile!;
        const cfg = buildPlaybackFromScheduleFile(src, programTitle);
        setPlayback(cfg.mode !== 'none' ? { ...cfg, mediaSrc: resolveMediaSrc(src) || cfg.mediaSrc } : cfg);
        if (cfg.mode === 'none') setPlayerError('Program video is not available');
        setActiveSource('schedule');
        return;
      }
      const res = await axios.get(`${API_BASE_URL}/mymedia/channel/${channelId}/stream`);
      if (res.data.success) {
        const d = res.data.data;
        const cfg = buildPlaybackFromStreamApi(d);
        setActiveSource(d.activeSource || '');
        if (cfg.mode === 'none') setPlayerError('Stream not available');
        else setPlayback(cfg);
      } else { setPlayerError('Stream not available'); }
    } catch {
      if (scheduleMediaFile) {
        const fb = buildPlaybackFromScheduleFile(scheduleMediaFile, programTitle);
        fb.mode !== 'none' ? setPlayback(fb) : setPlayerError('Failed to load program video');
      } else { setPlayerError('Failed to load stream'); }
    } finally { setPlayerLoading(false); }
  }, [channelId, scheduleMediaFile, scheduleMediaUrl, programTitle]);

  /* ── Load channel details ── */
  const loadDetails = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/mymedia/channel/${channelId}`);
      if (res.data.success) {
        const d: ChannelData = res.data.data;
        setData(d);
        const i = d.channel?.interactions;
        if (i) setInteractions({ views_count: i.views_count ?? 0, likes_count: i.likes_count ?? 0, followers_count: i.followers_count ?? 0 });
        if (d.gallery?.length > 0) {
          try {
            const ig = await axios.get(`${API_BASE_URL}/mymedia/gallery/${d.gallery[0].id}/images`);
            if (ig.data.success) setGalleryImages(ig.data.data.slice(0, 9));
          } catch { /* non-critical */ }
        }
      }
    } catch (e) { console.error('Channel details error:', e); }
    finally { setDataLoading(false); }
  }, [channelId]);

  /* ── Load reviews ── */
  const loadReviews = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/mymedia/channel/${channelId}/reviews`, { params: { limit: 5 } });
      if (res.data.success) {
        setReviews(res.data.data.reviews);
        setReviewStats(res.data.data.stats);
      }
    } catch { /* non-critical */ }
  }, [channelId]);

  /* ── Increment view count ── */
  const incrementView = useCallback(async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/mymedia/channel/${channelId}/view`);
      if (res.data.success) setInteractions(p => ({ ...p, views_count: res.data.data.views_count }));
    } catch { /* non-critical */ }
  }, [channelId]);

  /* ── Load latest news feed ── */
  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/mymedia/channel/${channelId}/news-feed`);
      if (res.data.success) setNewsItems(res.data.data.items || []);
    } catch { /* non-critical — news is supplementary */ }
    finally { setNewsLoading(false); }
  }, [channelId]);

  useEffect(() => {
    loadPlayback();
    loadDetails();
    incrementView();
    loadReviews();
    loadNews();
  }, [loadPlayback, loadDetails, incrementView, loadReviews, loadNews]);

  /* Autoplay after load */
  useEffect(() => {
    if (playerLoading || playback.mode === 'none' || playback.mode === 'iframe') return;
    const el = mediaRef.current;
    if (!el || !playback.mediaSrc) return;
    el.muted = false;
    el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [playerLoading, playback.mode, playback.mediaSrc]);

  /* ── Player controls ── */
  const togglePlay = () => {
    const el = mediaRef.current;
    if (!el) return;
    if (isPlaying) { el.pause(); setIsPlaying(false); }
    else el.play().then(() => setIsPlaying(true)).catch(() => {});
  };
  const toggleMute = () => {
    const el = mediaRef.current;
    if (!el) return;
    el.muted = !isMuted; setIsMuted(!isMuted);
  };
  const toggleFullscreen = () => {
    const el = mediaRef.current as HTMLVideoElement | null;
    if (!el) return;
    if (!isFullscreen) el.requestFullscreen?.();
    else document.exitFullscreen?.();
    setIsFullscreen(!isFullscreen);
  };
  const handleMediaTap = () => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  };

  /* ── Interaction handlers ── */
  const handleLike = async () => {
    const next = !isLiked;
    setIsLiked(next);
    localStorage.setItem(LS_LIKE_KEY(channelId), next ? '1' : '0');
    setInteractions(p => ({ ...p, likes_count: next ? p.likes_count + 1 : Math.max(0, p.likes_count - 1) }));
    try {
      const res = await axios.post(`${API_BASE_URL}/mymedia/channel/${channelId}/like`, { action: next ? 'like' : 'unlike' });
      if (res.data.success) setInteractions(p => ({ ...p, likes_count: res.data.data.likes_count }));
    } catch {
      setIsLiked(!next);
      localStorage.setItem(LS_LIKE_KEY(channelId), (!next) ? '1' : '0');
      setInteractions(p => ({ ...p, likes_count: next ? Math.max(0, p.likes_count - 1) : p.likes_count + 1 }));
    }
  };

  const handleFollow = async () => {
    const next = !isFollowing;
    setIsFollowing(next);
    localStorage.setItem(LS_FOLLOW_KEY(channelId), next ? '1' : '0');
    setInteractions(p => ({ ...p, followers_count: next ? p.followers_count + 1 : Math.max(0, p.followers_count - 1) }));
    try {
      const res = await axios.post(`${API_BASE_URL}/mymedia/channel/${channelId}/follow`, { action: next ? 'follow' : 'unfollow' });
      if (res.data.success) setInteractions(p => ({ ...p, followers_count: res.data.data.followers_count }));
    } catch {
      setIsFollowing(!next);
      localStorage.setItem(LS_FOLLOW_KEY(channelId), (!next) ? '1' : '0');
      setInteractions(p => ({ ...p, followers_count: next ? Math.max(0, p.followers_count - 1) : p.followers_count + 1 }));
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: programTitle || channelName, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href).catch(() => {});
    }
  };

  /* ── Review submit ── */
  const handleSubmitReview = async () => {
    if (!reviewForm.comment.trim()) return;
    setReviewSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/mymedia/channel/${channelId}/reviews`, {
        rating: reviewForm.rating || undefined,
        reviewer_name: reviewForm.name || 'Anonymous',
        comment_text: reviewForm.comment,
      });
      setReviewSuccess(true);
      setReviewForm({ rating: 0, name: '', comment: '' });
      setShowReviewForm(false);
      loadReviews();
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch { /* non-critical */ }
    finally { setReviewSubmitting(false); }
  };

  /* ── Reporters carousel scroll ── */
  const scrollReporters = (dir: 'left' | 'right') => {
    const el = reportersScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 220 : -220, behavior: 'smooth' });
  };

  const effectiveMode = isRadio && playback.mode === 'video' ? 'audio' : playback.mode;
  const isLive = activeSource === 'live';
  const displayLabel = programTitle || playback.label;

  /* derived data */
  const channel = data?.channel;
  const socialLinks = data?.socialLinks ?? [];
  const newsletters = data?.newsletters ?? [];
  const team = data?.team ?? [];
  const activeSocial = socialLinks.filter((l: any) => l.url);
  const websiteLink = activeSocial.find((l: any) => l.platform === 'website');
  const locationParts = [channel?.country?.country, channel?.state?.state, channel?.district?.district].filter(Boolean);

  /* rating display: prefer API stats, fall back to like-ratio estimate */
  const displayRating = (() => {
    if (reviewStats.average !== null) return reviewStats.average;
    if (interactions.views_count > 0) {
      const r = Math.min(5, 2.5 + (interactions.likes_count / interactions.views_count) * 25);
      return Math.max(0, Math.min(5, parseFloat(r.toFixed(1))));
    }
    return 4.5;
  })();

  const ratingBarWidths = reviewStats.total > 0
    ? [5, 4, 3, 2, 1].map(s => {
        const pct = Math.round(((reviewStats.counts[String(s)] || 0) / reviewStats.total) * 100);
        return `${pct}%`;
      })
    : ['75%', '15%', '6%', '3%', '1%'];

  /* ────────────────────────── RENDER ────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">

      {/* ═══ PLAYER SECTION ═══════════════════════════════════════ */}
      <div className="relative bg-black" style={{ minHeight: '52vw', maxHeight: '56vh' }}>

        {/* Top overlay bar */}
        <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/90 to-transparent">
          <div className="flex items-center justify-between px-4 pt-3 pb-6">
            <button onClick={onBack} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white" aria-label="Back">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              {isLive && (
                <span className="flex items-center gap-1 px-2 py-1 bg-red-600 rounded text-white text-[10px] font-bold tracking-widest uppercase">
                  <Wifi size={9} /> LIVE
                </span>
              )}
              <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><Bell size={18} /></button>
              <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><Settings size={18} /></button>
            </div>
          </div>
        </div>

        {/* ── Media ── */}
        <div className="w-full h-full flex items-center justify-center" style={{ minHeight: 'inherit', maxHeight: 'inherit' }} onClick={handleMediaTap}>
          {playerLoading ? (
            <div className="flex flex-col items-center gap-3 text-white">
              <Loader2 size={40} className="animate-spin text-red-400" />
              <p className="text-sm text-gray-400">Loading…</p>
            </div>
          ) : playerError ? (
            <div className="text-center text-white px-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                {isRadio ? <Radio size={28} className="text-red-400" /> : <Play size={28} className="text-gray-400" />}
              </div>
              <p className="text-sm font-medium mb-1">{playerError}</p>
              <button onClick={e => { e.stopPropagation(); loadPlayback(); }} className="mt-3 px-5 py-2 bg-red-600 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">Retry</button>
            </div>
          ) : effectiveMode === 'iframe' && playback.embedSrc ? (
            <iframe src={playback.embedSrc} title={displayLabel} className="absolute inset-0 w-full h-full border-0" {...EMBED_IFRAME_PROPS} />
          ) : effectiveMode === 'audio' && playback.mediaSrc ? (
            <div className="flex flex-col items-center gap-4 w-full px-6 py-4">
              {logoSrc ? (
                <img src={logoSrc} alt={channelName} className="w-28 h-28 rounded-2xl object-contain bg-white/10 border border-white/10 shadow-xl" {...WASABI_IMG_PROPS} />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-red-700 to-red-500 flex items-center justify-center shadow-xl">
                  <Radio size={48} className="text-white/80" />
                </div>
              )}
              <p className="text-white font-bold text-base">{channelName}</p>
              <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={playback.mediaSrc}
                onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} playsInline />
              <div className="flex items-center gap-4">
                <button onClick={e => { e.stopPropagation(); toggleMute(); }} className="p-2 bg-white/10 rounded-full text-white">
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button onClick={e => { e.stopPropagation(); togglePlay(); }} className="p-4 bg-red-600 rounded-full hover:bg-red-700 active:scale-95 transition-all shadow-lg text-white">
                  {isPlaying ? <Pause size={30} /> : <Play size={30} className="ml-0.5" />}
                </button>
                <div className="w-8" />
              </div>
            </div>
          ) : effectiveMode === 'video' && playback.mediaSrc ? (
            <>
              <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={playback.mediaSrc}
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)}
                playsInline controls={false}
              />
              {showControls && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button onClick={e => { e.stopPropagation(); togglePlay(); }} className="p-4 bg-black/40 rounded-full hover:bg-black/60 active:scale-95 transition-all text-white">
                      {isPlaying ? <Pause size={40} /> : <Play size={40} className="ml-0.5" />}
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 flex items-center justify-between">
                    <button onClick={e => { e.stopPropagation(); toggleMute(); }} className="p-2 hover:bg-white/20 rounded-full text-white">
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); toggleFullscreen(); }} className="p-2 hover:bg-white/20 rounded-full text-white"><Maximize size={20} /></button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center text-white px-6">
              <p className="text-sm text-gray-400">No stream configured</p>
              <button onClick={e => { e.stopPropagation(); loadPlayback(); }} className="mt-3 px-5 py-2 bg-red-600 rounded-lg text-sm font-medium">Retry</button>
            </div>
          )}
        </div>

        {/* Channel name overlay at bottom */}
        {!playerLoading && effectiveMode !== 'audio' && (
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 to-transparent pb-3 pt-10 px-4 pointer-events-none">
            <div className="flex items-end gap-3">
              {logoSrc && (
                <img src={logoSrc} alt={channelName} className="w-9 h-9 rounded-lg object-contain bg-white/10 flex-shrink-0" {...WASABI_IMG_PROPS} />
              )}
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-tight truncate">{channelName}</p>
                {displayLabel && displayLabel !== 'Live' && (
                  <p className="text-gray-300 text-xs truncate capitalize">{displayLabel}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ INTERACTION BAR ══════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-stretch divide-x divide-gray-100">
          {/* Views */}
          <div className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5">
            <div className="flex items-center gap-1 text-gray-900">
              <Eye size={16} className="text-red-500" />
              <span className="font-bold text-sm">{fmt(interactions.views_count)}</span>
            </div>
            <span className="text-[9px] text-gray-400 uppercase tracking-wider">Views</span>
          </div>
          {/* Like */}
          <button onClick={handleLike} className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}>
            <div className="flex items-center gap-1">
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              <span className="font-bold text-sm">{fmt(interactions.likes_count)}</span>
            </div>
            <span className="text-[9px] uppercase tracking-wider opacity-60">Like</span>
          </button>
          {/* Follow */}
          <button onClick={handleFollow} className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${isFollowing ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}>
            <div className="flex items-center gap-1">
              <UserPlus size={16} fill={isFollowing ? 'currentColor' : 'none'} />
              <span className="font-bold text-sm">{fmt(interactions.followers_count)}</span>
            </div>
            <span className="text-[9px] uppercase tracking-wider opacity-60">{isFollowing ? 'Following' : 'Follow'}</span>
          </button>
          {/* Share */}
          <button onClick={handleShare} className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-gray-500 hover:text-red-400 transition-colors">
            <Share2 size={16} />
            <span className="text-[9px] uppercase tracking-wider opacity-60">Share</span>
          </button>
        </div>
      </div>

      {/* ═══ CHANNEL INFO ════════════════════════════════════════ */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {logoSrc ? (
            <img src={logoSrc} alt={channelName} className="w-10 h-10 rounded-xl object-contain bg-gray-100 border border-gray-200 flex-shrink-0" {...WASABI_IMG_PROPS} />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold flex-shrink-0">
              {channelName?.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{channelName}</p>
            {channel?.category?.category_name && (
              <p className="text-xs text-gray-500 truncate">{channel.category.category_name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleFollow}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${isFollowing ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-red-600 text-white hover:bg-red-700'}`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <button onClick={handleLike} className={`p-2 rounded-full border transition-all ${isLiked ? 'bg-red-50 border-red-300 text-red-500' : 'bg-white border-gray-200 text-gray-400 hover:border-red-300'}`}>
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Category chips */}
      {(channel?.select_type || channel?.media_type) && (
        <div className="bg-white px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {channel?.select_type && <Chip label={channel.select_type} active />}
          {channel?.media_type && channel.media_type !== channel?.category?.category_name && <Chip label={channel.media_type} />}
          {channel?.language?.lang_1 && <Chip label={channel.language.lang_1} />}
        </div>
      )}

      {/* ═══ ABOUT US (full details + social links) ══════════════ */}
      <div className="relative bg-red-700 text-white overflow-hidden">
        {logoSrc && <img src={logoSrc} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-5 blur-lg scale-110 pointer-events-none" {...WASABI_IMG_PROPS} />}
        <div className="relative z-10 px-6 py-8">
          {/* Description */}
          <h2 className="font-bold text-base mb-2 opacity-75 uppercase tracking-wide text-red-100">About Us</h2>
          <p className="font-serif italic text-lg leading-snug font-semibold mb-3">
            {channelName}
          </p>
          <p className="text-red-100 text-sm leading-relaxed mb-4">
            {channelName} is a{' '}
            {channel?.select_type?.toLowerCase()}{' '}
            {channel?.category?.category_name?.toLowerCase() || channel?.media_type?.toLowerCase() || 'media'} channel
            {channel?.language?.lang_1 ? ` broadcasting in ${channel.language.lang_1}` : ''}.
            {locationParts.length > 0 ? ` Based in ${locationParts.join(', ')}.` : ''}
            {channel?.periodical_type ? ` Published ${channel.periodical_type}.` : ''}
            {' '}Committed to quality journalism and community connection.
          </p>

          {/* Channel detail pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {channel?.select_type && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">{channel.select_type}</span>
            )}
            {channel?.language?.lang_1 && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">{channel.language.lang_1}</span>
            )}
            {locationParts.map((loc: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">{loc}</span>
            ))}
          </div>

          {/* Social links */}
          {activeSocial.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {activeSocial.map((l: any) => (
                <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-full text-xs font-medium transition-colors">
                  {SOCIAL_ICON[l.platform] || <Globe size={13} />}
                  <span className="capitalize">{l.platform}</span>
                </a>
              ))}
            </div>
          )}

          {websiteLink ? (
            <a href={websiteLink.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-red-700 rounded-full font-semibold text-sm hover:bg-red-50 transition-colors">
              Visit Website <ChevronRight size={16} />
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 rounded-full font-semibold text-sm">
              Learn More About Us <ChevronRight size={16} />
            </div>
          )}
        </div>
      </div>

      {/* ═══ LATEST NEWS ════════════════════════════════════════ */}
      {(newsLoading || newsItems.length > 0) && (
        <Section title="Latest News" action={
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Globe size={12} /> Web Updates
          </span>
        }>
          <div className="px-4 space-y-0">
            {newsLoading ? (
              /* Loading skeletons */
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 py-3 border-b border-gray-100 animate-pulse">
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-4/5" />
                    <div className="h-2.5 bg-gray-100 rounded w-2/5 mt-3" />
                  </div>
                  <div className="w-20 h-16 rounded-xl bg-gray-200 flex-shrink-0" />
                </div>
              ))
            ) : (
              newsItems.slice(0, 6).map((item, idx) => (
                <NewsCard key={`${item.url}-${idx}`} item={item} channelName={channelName} />
              ))
            )}
          </div>
        </Section>
      )}

      {/* ═══ RATINGS & REVIEWS ═══════════════════════════════════ */}
      <Section title="Ratings & Reviews" action={
        <button onClick={() => setShowReviewForm(v => !v)} className="text-xs font-semibold text-red-500 hover:text-red-600">
          {showReviewForm ? 'Cancel' : '+ Write a Review'}
        </button>
      }>
        <div className="px-4">
          {/* Summary */}
          <div className="flex items-center gap-5 mb-4">
            <div className="text-center">
              <p className="text-5xl font-black text-gray-900">{displayRating.toFixed(1)}</p>
              <div className="flex justify-center gap-0.5 mt-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={14} className="text-red-500" fill={i <= Math.round(displayRating) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {reviewStats.total > 0 ? `${reviewStats.total} review${reviewStats.total > 1 ? 's' : ''}` : 'Overall Rating'}
              </p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5,4,3,2,1].map((s, idx) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-3">{s}</span>
                  <Star size={9} className="text-red-400 fill-red-400 flex-shrink-0" />
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: ratingBarWidths[idx] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit form */}
          <AnimatePresence>
            {showReviewForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
                  <p className="font-semibold text-gray-900 text-sm mb-3">Share your experience</p>
                  {/* Star picker */}
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => setReviewForm(f => ({ ...f, rating: f.rating === s ? 0 : s }))}
                        className="p-1 transition-transform active:scale-90">
                        <Star size={28} className="text-red-400" fill={s <= reviewForm.rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                    {reviewForm.rating > 0 && (
                      <span className="ml-2 text-sm text-gray-500 self-center">{['','Poor','Fair','Good','Very Good','Excellent'][reviewForm.rating]}</span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={reviewForm.name}
                    onChange={e => setReviewForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full mb-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-red-400"
                  />
                  <textarea
                    placeholder="Write your review…"
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-red-400"
                  />
                  <button
                    onClick={handleSubmitReview}
                    disabled={!reviewForm.comment.trim() || reviewSubmitting}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-red-700 transition-colors"
                  >
                    {reviewSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                    {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success toast */}
          <AnimatePresence>
            {reviewSuccess && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium text-center">
                ✓ Thank you for your review!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Review cards */}
          <div className="space-y-3">
            {reviews.length > 0 ? reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                    {(review.reviewer_name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{review.reviewer_name || 'Anonymous'}</p>
                      {review.rating && (
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={10} className="text-red-500" fill={s <= review.rating! ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{review.comment_text}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      {new Date(review.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="bg-white rounded-xl p-5 shadow-sm text-center">
                <Star size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No reviews yet. Be the first!</p>
                <button onClick={() => setShowReviewForm(true)} className="mt-2 text-xs text-red-500 font-semibold hover:text-red-600">
                  Write a Review
                </button>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ═══ GALLERY ════════════════════════════════════════════ */}
      {galleryImages.length > 0 && (
        <Section title="Gallery" action={
          <button className="text-xs font-semibold text-red-500 hover:text-red-600">View All</button>
        }>
          <div className="px-4 grid grid-cols-3 gap-1">
            {galleryImages.slice(0, 9).map((img, i) => (
              <button key={img.id ?? i} onClick={() => setLightboxSrc(img.image_url || resolveImg(img.image_path))}
                className="aspect-square rounded-lg overflow-hidden">
                <img
                  src={img.thumbnail_url || img.image_url || resolveImg(img.thumbnail_path || img.image_path) || ''}
                  alt=""
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                  {...WASABI_IMG_PROPS}
                />
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* ═══ NEWSLETTER ════════════════════════════════════════ */}
      {newsletters.length > 0 && (
        <Section title="Newsletter" action={
          <span className="text-xs text-gray-400">{newsletters.length} issue{newsletters.length > 1 ? 's' : ''}</span>
        }>
          <div className="px-4 space-y-3">
            {newsletters.map((nl: any, i: number) => {
              const colors = ['bg-red-500', 'bg-teal-500', 'bg-purple-500', 'bg-orange-500', 'bg-blue-500'];
              const fileUrl = nl.file_url || (nl.file_path ? getUploadUrl(nl.file_path) : '');
              return (
                <a key={nl.id ?? i} href={fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white rounded-xl shadow-sm hover:shadow-md active:scale-[0.99] transition-all overflow-hidden">
                  <div className={`w-16 h-16 ${colors[i % 5]} flex-shrink-0 flex items-center justify-center`}>
                    <Newspaper size={24} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0 py-2">
                    <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{nl.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {nl.document_type?.toUpperCase() || 'PDF'}
                      {nl.file_size ? ` · ${(nl.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
                    </p>
                    {!fileUrl && (
                      <p className="text-[10px] text-red-400 mt-0.5">File unavailable</p>
                    )}
                  </div>
                  <div className="mr-3 flex-shrink-0">
                    {fileUrl
                      ? <ChevronRight size={16} className="text-gray-300" />
                      : <FileText size={16} className="text-gray-200" />}
                  </div>
                </a>
              );
            })}
          </div>
        </Section>
      )}

      {/* ═══ OUR REPORTERS (horizontal carousel) ══════════════ */}
      {team.length > 0 && (
        <Section title="Our Reporters" action={
          team.length > 2 ? (
            <div className="flex items-center gap-1">
              <button onClick={() => scrollReporters('left')} className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors">
                <ChevronLeft size={14} className="text-gray-600" />
              </button>
              <button onClick={() => scrollReporters('right')} className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors">
                <ChevronRight size={14} className="text-gray-600" />
              </button>
            </div>
          ) : null
        }>
          <div
            ref={reportersScrollRef}
            className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {team.map((member: any, i: number) => (
              <div
                key={member.id ?? i}
                className="flex-shrink-0 w-44 bg-white rounded-2xl shadow-sm overflow-hidden"
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Photo */}
                <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300">
                  {member.photo_url ? (
                    <img
                      src={resolveImg(member.photo_url) || ''}
                      alt={member.name}
                      className="w-full h-full object-cover object-top"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      {...WASABI_IMG_PROPS}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-100 to-red-200">
                      <span className="text-red-400 text-5xl font-black">{member.name?.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                {/* Info */}
                <div className="px-3 py-3">
                  <p className="font-bold text-gray-900 text-sm leading-tight truncate">{member.name}</p>
                  {member.designation && (
                    <p className="text-xs text-red-500 mt-0.5 truncate">{member.designation}</p>
                  )}
                  {/* Social icons */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {(['facebook', 'twitter', 'instagram'] as const).map(platform => {
                      const icons: Record<string, React.ReactNode> = {
                        facebook: <Facebook size={12} />, twitter: <Twitter size={12} />, instagram: <Instagram size={12} />,
                      };
                      const found = activeSocial.find((l: any) => l.platform === platform);
                      return found ? (
                        <a key={platform} href={found.url} target="_blank" rel="noopener noreferrer"
                          className={`w-6 h-6 rounded-full ${SOCIAL_BG[platform] || 'bg-gray-400'} flex items-center justify-center text-white hover:opacity-90`}>
                          {icons[platform]}
                        </a>
                      ) : null;
                    })}
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white hover:opacity-90">
                        <Mail size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ═══ GET IN TOUCH (dark footer) ════════════════════════ */}
      <div className="bg-gray-950 text-white mt-4">
        <div className="px-6 py-8">
          <h2 className="text-base font-bold text-center mb-6">Get in Touch</h2>
          <div className="space-y-5">
            {(channel?.phone || team[0]?.phone) && (
              <TouchRow icon={<Phone size={18} />} label="Phone" value={channel?.phone || team[0]?.phone} />
            )}
            <TouchRow
              icon={<Mail size={18} />}
              label="Email"
              value={team[0]?.email || `info@${channelName?.toLowerCase().replace(/\s+/g, '')}.com`}
            />
            {locationParts.length > 0 && <TouchRow icon={<MapPin size={18} />} label="Location" value={locationParts.join(', ')} />}
          </div>
          {activeSocial.length > 0 && (
            <div className="flex items-center justify-center flex-wrap gap-3 mt-8 pt-6 border-t border-white/10">
              {activeSocial.map((l: any) => (
                <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-full ${SOCIAL_BG[l.platform] || 'bg-gray-600'} flex items-center justify-center text-white hover:opacity-90 active:scale-95 transition-all`}>
                  {SOCIAL_ICON[l.platform] || <Globe size={16} />}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading shimmer for details */}
      {dataLoading && (
        <div className="fixed bottom-0 left-0 right-0 h-1 bg-red-600 animate-pulse z-50" />
      )}

      {/* ═══ LIGHTBOX ══════════════════════════════════════════ */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightboxSrc(null)}>
            <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"><X size={24} /></button>
            <img src={lightboxSrc} alt="Gallery" className="max-w-full max-h-full object-contain" {...WASABI_IMG_PROPS}
              onClick={e => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Sub-components ── */
const Section: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, action, children }) => (
  <div className="py-5 bg-gray-100">
    <div className="flex items-center justify-between px-4 mb-4">
      <h2 className="font-bold text-base text-gray-900">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

/** Relative human-readable timestamp ("5 mins ago", "1 hr ago", "Yesterday", …) */
const newsRelativeTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const then = new Date(dateStr);
  if (Number.isNaN(then.getTime())) return '';
  const diffMins = Math.floor((Date.now() - then.getTime()) / 60_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

/** Inline news card – mirrors the WebNewsFeedView card layout */
const NewsCard: React.FC<{ item: NewsItem; channelName: string }> = ({ item, channelName }) => {
  const [imgErr, setImgErr] = React.useState(false);
  const handleOpen = () => {
    if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
      className="flex gap-3 py-3 bg-white border-b border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      {/* Text */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{item.title}</p>
        {item.description && (
          <p className="text-xs text-gray-500 line-clamp-1">
            {item.description.substring(0, 80)}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-auto pt-0.5">
          <Globe size={10} className="text-red-500 flex-shrink-0" />
          <span className="text-[10px] font-semibold text-red-600 truncate max-w-[100px]">{channelName}</span>
          {item.publishedAt && (
            <>
              <span className="text-gray-300 text-[10px]">•</span>
              <span className="text-[10px] text-gray-400 flex-shrink-0">{newsRelativeTime(item.publishedAt)}</span>
            </>
          )}
        </div>
      </div>
      {/* Thumbnail */}
      {item.image && !imgErr ? (
        <div className="flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden bg-gray-100">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
        </div>
      ) : (
        <div className="flex-shrink-0 w-20 h-16 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
          <Newspaper size={22} className="text-red-300" />
        </div>
      )}
    </div>
  );
};

const Chip: React.FC<{ label: string; active?: boolean }> = ({ label, active }) => (
  <span className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${
    active ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200'
  }`}>{label}</span>
);

const TouchRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">{icon}</div>
    <div>
      <p className="text-gray-400 text-xs mb-0.5">{label}</p>
      <p className="text-white font-medium text-sm">{value}</p>
    </div>
  </div>
);

export default TVChannelDetailPage;
