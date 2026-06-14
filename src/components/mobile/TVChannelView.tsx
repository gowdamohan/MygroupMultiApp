import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Heart, Share2, UserPlus, Eye, Loader2, Info, Radio, Wifi } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';
import {
  buildPlaybackFromStreamApi,
  buildPlaybackFromScheduleFile,
  resolveMediaSrc,
  EMBED_IFRAME_PROPS,
  type PlaybackConfig
} from '../../utils/mediaPlayback';

interface TVChannelViewProps {
  channelId: number;
  channelName: string;
  channelLogo?: string;
  isRadio?: boolean;
  /** Raw path from media_schedules.media_file */
  scheduleMediaFile?: string | null;
  /** Resolved URL from API (preferred) */
  scheduleMediaUrl?: string | null;
  programTitle?: string;
  onBack: () => void;
  onViewDetails: () => void;
}

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

export const TVChannelView: React.FC<TVChannelViewProps> = ({
  channelId,
  channelName,
  channelLogo,
  isRadio = false,
  scheduleMediaFile,
  scheduleMediaUrl,
  programTitle,
  onBack,
  onViewDetails
}) => {
  const mediaRef = useRef<HTMLMediaElement>(null);
  const [playback, setPlayback] = useState<PlaybackConfig>({
    mode: 'none',
    mediaSrc: '',
    embedSrc: '',
    label: 'Live'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [interactions, setInteractions] = useState({ views_count: 0, likes_count: 0, followers_count: 0 });
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeSource, setActiveSource] = useState<string>('');
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadPlayback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (scheduleMediaFile || scheduleMediaUrl) {
        if (scheduleMediaUrl) {
          const cfg = buildPlaybackFromScheduleFile(scheduleMediaUrl, programTitle);
          if (cfg.mode === 'none') {
            setError('Program video is not available');
          } else {
            setPlayback({ ...cfg, mediaSrc: resolveMediaSrc(scheduleMediaUrl) || cfg.mediaSrc });
          }
          setActiveSource('schedule');
        } else if (scheduleMediaFile) {
          const response = await axios.get(
            `${API_BASE_URL}/mymedia/channel/${channelId}/stream?mediaFile=${encodeURIComponent(scheduleMediaFile)}`
          );
          if (response.data.success) {
            const cfg = buildPlaybackFromStreamApi({ ...response.data.data, activeSource: 'schedule' });
            setPlayback(cfg);
            setActiveSource('schedule');
          } else {
            const cfg = buildPlaybackFromScheduleFile(scheduleMediaFile, programTitle);
            setPlayback(cfg);
            setActiveSource('schedule');
          }
        }
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/mymedia/channel/${channelId}/stream`);
      if (response.data.success) {
        const data = response.data.data;
        const cfg = buildPlaybackFromStreamApi(data);
        setActiveSource(data.activeSource || '');
        if (cfg.mode === 'none') {
          setError('Stream not available');
        } else {
          setPlayback(cfg);
        }
      } else {
        setError('Stream not available');
      }
    } catch (err) {
      console.error('Error loading playback:', err);
      if (scheduleMediaFile) {
        const fallback = buildPlaybackFromScheduleFile(scheduleMediaFile, programTitle);
        if (fallback.mode !== 'none') {
          setPlayback(fallback);
          setActiveSource('schedule');
        } else {
          setError('Failed to load program video');
        }
      } else {
        setError('Failed to load stream');
      }
    } finally {
      setLoading(false);
    }
  }, [channelId, scheduleMediaFile, scheduleMediaUrl, programTitle]);

  useEffect(() => {
    loadPlayback();
    fetchInteractions();
    incrementViewCount();
  }, [loadPlayback]);

  useEffect(() => {
    if (loading || playback.mode === 'none' || playback.mode === 'iframe') return;
    const el = mediaRef.current;
    if (!el || !playback.mediaSrc) return;

    el.muted = false;
    const playPromise = el.play();
    if (playPromise) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Autoplay blocked or failed:', err);
          setIsPlaying(false);
        });
    }
  }, [loading, playback.mode, playback.mediaSrc]);

  const fetchInteractions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/mymedia/channel/${channelId}`);
      if (response.data.success && response.data.data.channel?.interactions) {
        const i = response.data.data.channel.interactions;
        setInteractions({
          views_count: i.views_count ?? 0,
          likes_count: i.likes_count ?? 0,
          followers_count: i.followers_count ?? 0
        });
      }
    } catch (err) {
      console.error('Error fetching interactions:', err);
    }
  };

  const incrementViewCount = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/mymedia/channel/${channelId}/view`);
      if (response.data.success) {
        setInteractions(prev => ({ ...prev, views_count: response.data.data.views_count }));
      }
    } catch (err) {
      console.error('Error incrementing view:', err);
    }
  };

  const togglePlay = () => {
    if (playback.mode === 'iframe') return;
    const el = mediaRef.current;
    if (!el || !playback.mediaSrc) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn('Play failed:', err));
    }
  };

  const toggleMute = () => {
    const el = mediaRef.current;
    if (!el) return;
    el.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (playback.mode !== 'video' || !mediaRef.current) return;
    const el = mediaRef.current as HTMLVideoElement;
    if (!isFullscreen) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleVideoClick = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleLike = async () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setInteractions(prev => ({
      ...prev,
      likes_count: newLiked ? prev.likes_count + 1 : Math.max(0, prev.likes_count - 1)
    }));
    try {
      const response = await axios.post(`${API_BASE_URL}/mymedia/channel/${channelId}/like`, {
        action: newLiked ? 'like' : 'unlike'
      });
      if (response.data.success) {
        setInteractions(prev => ({ ...prev, likes_count: response.data.data.likes_count }));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      setIsLiked(!newLiked);
      setInteractions(prev => ({
        ...prev,
        likes_count: newLiked ? Math.max(0, prev.likes_count - 1) : prev.likes_count + 1
      }));
    }
  };

  const handleFollow = async () => {
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);
    setInteractions(prev => ({
      ...prev,
      followers_count: newFollowing ? prev.followers_count + 1 : Math.max(0, prev.followers_count - 1)
    }));
    try {
      const response = await axios.post(`${API_BASE_URL}/mymedia/channel/${channelId}/follow`, {
        action: newFollowing ? 'follow' : 'unfollow'
      });
      if (response.data.success) {
        setInteractions(prev => ({ ...prev, followers_count: response.data.data.followers_count }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      setIsFollowing(!newFollowing);
      setInteractions(prev => ({
        ...prev,
        followers_count: newFollowing ? Math.max(0, prev.followers_count - 1) : prev.followers_count + 1
      }));
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: programTitle || channelName,
          text: `Watch ${programTitle || channelName}!`,
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  const effectiveMode = isRadio && playback.mode === 'video' ? 'audio' : playback.mode;
  const displayLabel = programTitle || playback.label;
  const isLive = activeSource === 'live';
  const isSchedule = !!scheduleMediaFile || !!scheduleMediaUrl || activeSource === 'schedule';

  const logoSrc = channelLogo
    ? (channelLogo.startsWith('http') ? channelLogo : `${BACKEND_URL}${channelLogo}`)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 size={48} className="text-teal-400 animate-spin" />
        <p className="text-gray-400 text-sm">Loading stream…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top header overlay */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
        <div className="flex items-center gap-3 p-4 pt-safe">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="flex-1 flex items-center gap-3 min-w-0" onClick={onViewDetails}>
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={channelName}
                className="w-10 h-10 rounded-lg object-contain bg-white/10 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                {isRadio ? <Radio size={20} /> : channelName?.charAt(0)}
              </div>
            )}
            <div className="text-white min-w-0 flex-1">
              <h1 className="font-bold text-base leading-tight truncate">{channelName}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                {isLive && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-600 rounded text-white text-[10px] font-bold tracking-wide uppercase">
                    <Wifi size={10} />
                    LIVE
                  </span>
                )}
                {isSchedule && !isLive && (
                  <span className="px-1.5 py-0.5 bg-teal-600/80 rounded text-white text-[10px] font-semibold uppercase">
                    SCHEDULE
                  </span>
                )}
                <p className="text-xs text-gray-300 truncate capitalize">{displayLabel}</p>
              </div>
            </div>
          </div>

          <button
            onClick={onViewDetails}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white flex-shrink-0"
            aria-label="Channel info"
          >
            <Info size={22} />
          </button>
        </div>
      </div>

      {/* Media area */}
      <div
        className="flex-1 relative flex items-center justify-center bg-black"
        style={{ minHeight: '55vh' }}
        onClick={handleVideoClick}
      >
        {error ? (
          <div className="text-center text-white p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
              {isRadio ? <Radio size={32} className="text-teal-400" /> : <Play size={32} className="text-gray-400" />}
            </div>
            <p className="text-base mb-1 font-medium">{error}</p>
            <p className="text-sm text-gray-400 mb-5">The stream may be temporarily unavailable.</p>
            <button
              onClick={(e) => { e.stopPropagation(); loadPlayback(); }}
              className="px-6 py-2.5 bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : effectiveMode === 'iframe' && playback.embedSrc ? (
          <iframe
            src={playback.embedSrc}
            title={displayLabel}
            className="absolute inset-0 w-full h-full border-0"
            {...EMBED_IFRAME_PROPS}
          />
        ) : effectiveMode === 'audio' && playback.mediaSrc ? (
          <div className="flex flex-col items-center gap-6 p-8 w-full">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={channelName}
                className="w-48 h-48 rounded-2xl object-contain bg-white/10 p-4 shadow-2xl"
              />
            ) : (
              <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-500 flex items-center justify-center shadow-2xl">
                <Radio size={64} className="text-white/80" />
              </div>
            )}
            <div className="text-center">
              <p className="text-white font-semibold text-lg">{channelName}</p>
              {displayLabel && displayLabel !== 'Live' && (
                <p className="text-gray-400 text-sm mt-1">{displayLabel}</p>
              )}
            </div>
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={playback.mediaSrc}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              playsInline
            />
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="p-5 bg-teal-600 rounded-full hover:bg-teal-700 active:scale-95 transition-all shadow-lg"
            >
              {isPlaying ? <Pause size={36} className="text-white" /> : <Play size={36} className="text-white ml-1" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
        ) : effectiveMode === 'video' && playback.mediaSrc ? (
          <>
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={playback.mediaSrc}
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              playsInline
              controls={false}
            />
            {/* Play/Pause overlay */}
            {showControls && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="p-4 bg-black/40 rounded-full hover:bg-black/60 active:scale-95 transition-all"
                >
                  {isPlaying ? <Pause size={44} className="text-white" /> : <Play size={44} className="text-white ml-1" />}
                </button>
              </div>
            )}
            {/* Bottom controls */}
            {showControls && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                    className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                  >
                    {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                    className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                  >
                    <Maximize size={22} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-white p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
              <Play size={32} className="text-gray-400" />
            </div>
            <p className="text-base font-medium mb-1">No playable source</p>
            <p className="text-sm text-gray-400 mb-5">This channel has no active stream configured.</p>
            <button
              onClick={(e) => { e.stopPropagation(); loadPlayback(); }}
              className="px-6 py-2.5 bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Interaction bar */}
      <div className="bg-gray-950 border-t border-gray-800">
        <div className="flex items-stretch divide-x divide-gray-800">
          {/* Views — display only */}
          <div className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Eye size={18} />
              <span className="text-sm font-semibold text-white">{formatCount(interactions.views_count)}</span>
            </div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Views</span>
          </div>

          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400 active:text-red-500'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
              <span className="text-sm font-semibold">{formatCount(interactions.likes_count)}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider opacity-70">Like</span>
          </button>

          {/* Follow */}
          <button
            onClick={handleFollow}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
              isFollowing ? 'text-teal-400' : 'text-gray-400 hover:text-teal-400 active:text-teal-500'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <UserPlus size={18} />
              <span className="text-sm font-semibold">{formatCount(interactions.followers_count)}</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider opacity-70">
              {isFollowing ? 'Following' : 'Follow'}
            </span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-gray-400 hover:text-white active:text-teal-400 transition-colors"
          >
            <Share2 size={18} />
            <span className="text-[10px] uppercase tracking-wider opacity-70">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TVChannelView;
