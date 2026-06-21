/**
 * YoutubeChannelView
 *
 * Displays a YouTube channel inside the MyMedia mobile page.
 * Layout mirrors TVChannelDetailPage:
 *   - Top: YouTube iframe player for the selected / latest video
 *   - Interaction bar (views · likes · followers · share) via the backend
 *   - Channel metadata row (logo, name, follow/like)
 *   - Scrollable video list from the channel's uploads playlist
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Heart, Eye, UserPlus, Share2, Loader2,
  Youtube, Play, AlertCircle, RefreshCw, Bell, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';
import {
  resolveYouTubeChannelId,
  fetchYouTubeChannelInfo,
  fetchYouTubePlaylistVideos,
  fetchVideoDetails,
  formatYTDuration,
  formatViewCount,
  timeAgo,
  type YouTubeVideo,
  type YouTubeChannelInfo,
} from '../../utils/youtubeApi';
import { extractYouTubeHandle } from '../../utils/mediaCategoryUtils';

/* ─── Types ──────────────────────────────────────────────────── */
interface Props {
  channelId: number;
  channelName: string;
  channelLogo?: string;
  mediaUrl: string;
  onBack: () => void;
}

interface Interactions {
  views_count: number;
  likes_count: number;
  followers_count: number;
}

const LS_LIKE_KEY = (id: number) => `mc_liked_${id}`;
const LS_FOLLOW_KEY = (id: number) => `mc_following_${id}`;

const fmt = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

/* ─── Component ───────────────────────────────────────────────── */
export const YoutubeChannelView: React.FC<Props> = ({
  channelId,
  channelName,
  channelLogo,
  mediaUrl,
  onBack,
}) => {
  /* YouTube state */
  const [ytLoading, setYtLoading] = useState(true);
  const [ytError, setYtError] = useState<string | null>(null);
  const [ytChannel, setYtChannel] = useState<YouTubeChannelInfo | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  /* Interaction state (backend) */
  const [interactions, setInteractions] = useState<Interactions>({
    views_count: 0, likes_count: 0, followers_count: 0,
  });
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  /* Logo */
  const logoSrc = channelLogo
    ? (channelLogo.startsWith('http') ? channelLogo : `${BACKEND_URL}${channelLogo}`)
    : null;

  /* ── Load like/follow state from localStorage ── */
  useEffect(() => {
    setIsLiked(localStorage.getItem(LS_LIKE_KEY(channelId)) === '1');
    setIsFollowing(localStorage.getItem(LS_FOLLOW_KEY(channelId)) === '1');
  }, [channelId]);

  /* ── Load backend interactions & increment view ── */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/mymedia/channel/${channelId}`);
        if (res.data?.success) {
          const i = res.data.data?.channel?.interactions;
          if (i) setInteractions({ views_count: i.views_count ?? 0, likes_count: i.likes_count ?? 0, followers_count: i.followers_count ?? 0 });
        }
      } catch { /* non-critical */ }
      try {
        const res = await axios.post(`${API_BASE_URL}/mymedia/channel/${channelId}/view`);
        if (res.data?.success) setInteractions(p => ({ ...p, views_count: res.data.data.views_count }));
      } catch { /* non-critical */ }
    };
    load();
  }, [channelId]);

  /* ── Load YouTube data ── */
  const loadYouTube = useCallback(async () => {
    setYtLoading(true);
    setYtError(null);
    try {
      const handle = extractYouTubeHandle(mediaUrl);
      if (!handle) throw new Error('Could not extract YouTube channel handle from URL');

      const resolvedId = await resolveYouTubeChannelId(handle);
      const info = await fetchYouTubeChannelInfo(resolvedId);
      setYtChannel(info);

      if (!info.uploadsPlaylistId) throw new Error('Uploads playlist not found for this channel');

      const { videos: vids, nextPageToken: npt } = await fetchYouTubePlaylistVideos(info.uploadsPlaylistId, 25);

      // Enrich first batch with view counts / durations
      const ids = vids.map(v => v.videoId);
      const details = await fetchVideoDetails(ids);
      const enriched = vids.map(v => ({
        ...v,
        viewCount: details[v.videoId]?.viewCount,
        duration: details[v.videoId]?.duration ? formatYTDuration(details[v.videoId].duration) : undefined,
      }));

      setVideos(enriched);
      setNextPageToken(npt);
      if (enriched.length > 0) setSelectedVideoId(enriched[0].videoId);
    } catch (e: any) {
      console.error('[YoutubeChannelView] Error:', e);
      setYtError(e?.message || 'Failed to load YouTube channel');
    } finally {
      setYtLoading(false);
    }
  }, [mediaUrl]);

  useEffect(() => { loadYouTube(); }, [loadYouTube]);

  /* ── Load more videos ── */
  const loadMore = async () => {
    if (!ytChannel || !nextPageToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const { videos: more, nextPageToken: npt } = await fetchYouTubePlaylistVideos(
        ytChannel.uploadsPlaylistId, 25, nextPageToken
      );
      const ids = more.map(v => v.videoId);
      const details = await fetchVideoDetails(ids);
      const enriched = more.map(v => ({
        ...v,
        viewCount: details[v.videoId]?.viewCount,
        duration: details[v.videoId]?.duration ? formatYTDuration(details[v.videoId].duration) : undefined,
      }));
      setVideos(prev => [...prev, ...enriched]);
      setNextPageToken(npt);
    } catch { /* non-critical */ }
    finally { setLoadingMore(false); }
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
    const shareData = {
      title: channelName,
      url: mediaUrl,
    };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard?.writeText(mediaUrl).catch(() => {});
    }
  };

  const embedSrc = selectedVideoId
    ? `https://www.youtube.com/embed/${selectedVideoId}?autoplay=1&rel=0`
    : null;

  /* ────────────────── RENDER ────────────────── */
  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">

      {/* ═══ PLAYER SECTION ═══════════════════════════════════════ */}
      <div className="relative bg-black" style={{ minHeight: '56vw', maxHeight: '58vh' }}>
        {/* Top overlay bar */}
        <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/90 to-transparent">
          <div className="flex items-center justify-between px-4 pt-3 pb-6">
            <button
              onClick={onBack}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2 py-1 bg-red-600 rounded text-white text-[10px] font-bold tracking-widest uppercase">
                <Youtube size={9} /> YouTube
              </span>
              <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                <Bell size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Player area */}
        <div className="w-full h-full flex items-center justify-center" style={{ minHeight: 'inherit', maxHeight: 'inherit' }}>
          {ytLoading ? (
            <div className="flex flex-col items-center gap-3 text-white">
              <Loader2 size={40} className="animate-spin text-red-400" />
              <p className="text-sm text-gray-400">Loading channel…</p>
            </div>
          ) : ytError ? (
            <div className="text-center text-white px-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                <AlertCircle size={28} className="text-red-400" />
              </div>
              <p className="text-sm font-medium mb-1">{ytError}</p>
              <button
                onClick={loadYouTube}
                className="mt-3 inline-flex items-center gap-2 px-5 py-2 bg-red-600 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : embedSrc ? (
            <iframe
              src={embedSrc}
              title={videos.find(v => v.videoId === selectedVideoId)?.title || channelName}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="text-center text-white px-6">
              <Youtube size={48} className="mx-auto mb-3 text-red-500" />
              <p className="text-sm text-gray-400">No videos available</p>
            </div>
          )}
        </div>

        {/* Channel name overlay at bottom of player */}
        {!ytLoading && !ytError && (
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 to-transparent pb-3 pt-10 px-4 pointer-events-none">
            <div className="flex items-end gap-3">
              {logoSrc && (
                <img src={logoSrc} alt={channelName} className="w-9 h-9 rounded-lg object-contain bg-white/10 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-tight truncate">{channelName}</p>
                {videos.length > 0 && selectedVideoId && (
                  <p className="text-gray-300 text-xs truncate">
                    {videos.find(v => v.videoId === selectedVideoId)?.title}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ INTERACTION BAR ══════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-stretch divide-x divide-gray-100">
          <div className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5">
            <div className="flex items-center gap-1 text-gray-900">
              <Eye size={16} className="text-red-500" />
              <span className="font-bold text-sm">{fmt(interactions.views_count)}</span>
            </div>
            <span className="text-[9px] text-gray-400 uppercase tracking-wider">Views</span>
          </div>
          <button
            onClick={handleLike}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}
          >
            <div className="flex items-center gap-1">
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              <span className="font-bold text-sm">{fmt(interactions.likes_count)}</span>
            </div>
            <span className="text-[9px] uppercase tracking-wider opacity-60">Like</span>
          </button>
          <button
            onClick={handleFollow}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${isFollowing ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}
          >
            <div className="flex items-center gap-1">
              <UserPlus size={16} fill={isFollowing ? 'currentColor' : 'none'} />
              <span className="font-bold text-sm">{fmt(interactions.followers_count)}</span>
            </div>
            <span className="text-[9px] uppercase tracking-wider opacity-60">
              {isFollowing ? 'Following' : 'Follow'}
            </span>
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-gray-500 hover:text-red-400 transition-colors"
          >
            <Share2 size={16} />
            <span className="text-[9px] uppercase tracking-wider opacity-60">Share</span>
          </button>
        </div>
      </div>

      {/* ═══ CHANNEL INFO ROW ════════════════════════════════════ */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={channelName}
              className="w-10 h-10 rounded-xl object-contain bg-gray-100 border border-gray-200 flex-shrink-0"
            />
          ) : ytChannel?.thumbnailUrl ? (
            <img
              src={ytChannel.thumbnailUrl}
              alt={channelName}
              className="w-10 h-10 rounded-xl object-cover bg-gray-100 border border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold flex-shrink-0">
              <Youtube size={20} />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{channelName}</p>
            {ytChannel?.subscriberCount && (
              <p className="text-xs text-gray-500 truncate">
                {formatViewCount(ytChannel.subscriberCount).replace('views', 'subscribers')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleFollow}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isFollowing ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full border bg-red-50 border-red-200 text-red-500 hover:bg-red-100 transition-all"
            title="Open on YouTube"
          >
            <Youtube size={16} />
          </a>
        </div>
      </div>

      {/* ═══ VIDEO LIST ══════════════════════════════════════════ */}
      <div className="py-5 bg-gray-100">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="font-bold text-base text-gray-900">Videos</h2>
          {ytChannel?.videoCount && (
            <span className="text-xs text-gray-500">{Number(ytChannel.videoCount).toLocaleString()} total</span>
          )}
        </div>

        {ytLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={32} className="animate-spin text-red-400" />
          </div>
        ) : ytError ? (
          <div className="mx-4 bg-white rounded-xl p-5 text-center shadow-sm">
            <AlertCircle size={28} className="mx-auto text-red-400 mb-2" />
            <p className="text-sm text-gray-600 mb-3">{ytError}</p>
            <button
              onClick={loadYouTube}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : videos.length === 0 ? (
          <div className="mx-4 bg-white rounded-xl p-5 text-center shadow-sm">
            <Youtube size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No public videos found for this channel.</p>
          </div>
        ) : (
          <div className="space-y-2 px-4">
            <AnimatePresence>
              {videos.map((video, idx) => (
                <motion.button
                  key={video.videoId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                  onClick={() => setSelectedVideoId(video.videoId)}
                  className={`w-full text-left bg-white rounded-xl shadow-sm overflow-hidden flex gap-0 hover:shadow-md active:scale-[0.99] transition-all ${
                    selectedVideoId === video.videoId ? 'ring-2 ring-red-500' : ''
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0 w-36 h-24 bg-gray-900">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Youtube size={28} className="text-red-500" />
                      </div>
                    )}
                    {/* Duration badge */}
                    {video.duration && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-semibold px-1 py-0.5 rounded">
                        {video.duration}
                      </span>
                    )}
                    {/* Playing indicator */}
                    {selectedVideoId === video.videoId && (
                      <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-red-600/80 flex items-center justify-center">
                          <Play size={14} className="text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
                    <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                      {video.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {video.viewCount && (
                        <span className="text-[11px] text-gray-500">{formatViewCount(video.viewCount)}</span>
                      )}
                      {video.publishedAt && (
                        <span className="text-[11px] text-gray-400">{timeAgo(video.publishedAt)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center pr-3 flex-shrink-0">
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>

            {/* Load more */}
            {nextPageToken && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full py-3 bg-white rounded-xl shadow-sm text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
                {loadingMore ? 'Loading…' : 'Load more videos'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* YouTube attribution */}
      <div className="py-4 text-center">
        <a
          href={mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          <Youtube size={14} className="text-red-500" />
          View full channel on YouTube
        </a>
      </div>
    </div>
  );
};

export default YoutubeChannelView;
