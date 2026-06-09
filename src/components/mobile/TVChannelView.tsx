import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Heart, Share2, UserPlus, Eye, Loader2, Info } from 'lucide-react';
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
        } else if (scheduleMediaFile) {
          const response = await axios.get(
            `${API_BASE_URL}/mymedia/channel/${channelId}/stream?mediaFile=${encodeURIComponent(scheduleMediaFile)}`
          );
          if (response.data.success) {
            setPlayback(buildPlaybackFromStreamApi({ ...response.data.data, activeSource: 'schedule' }));
          } else {
            setPlayback(buildPlaybackFromScheduleFile(scheduleMediaFile, programTitle));
          }
        }
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/mymedia/channel/${channelId}/stream`);
      if (response.data.success) {
        const cfg = buildPlaybackFromStreamApi(response.data.data);
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
        setInteractions(response.data.data.channel.interactions);
      }
    } catch (err) {
      console.error('Error fetching interactions:', err);
    }
  };

  const incrementViewCount = async () => {
    try {
      await axios.post(`${API_BASE_URL}/mymedia/channel/${channelId}/view`);
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

  const handleLike = () => {
    setIsLiked(!isLiked);
    setInteractions((prev) => ({
      ...prev,
      likes_count: isLiked ? prev.likes_count - 1 : prev.likes_count + 1
    }));
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    setInteractions((prev) => ({
      ...prev,
      followers_count: isFollowing ? prev.followers_count - 1 : prev.followers_count + 1
    }));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={48} className="text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3 p-4">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1 flex items-center gap-3" onClick={onViewDetails}>
            {channelLogo ? (
              <img
                src={channelLogo.startsWith('http') ? channelLogo : `${BACKEND_URL}${channelLogo}`}
                alt={channelName}
                className="w-10 h-10 rounded-lg object-contain bg-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white text-lg font-bold">
                {channelName?.charAt(0)}
              </div>
            )}
            <div className="text-white min-w-0">
              <h1 className="font-bold text-lg truncate">{channelName}</h1>
              <p className="text-sm text-gray-300 capitalize truncate">{displayLabel}</p>
            </div>
          </div>
          <button onClick={onViewDetails} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
            <Info size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center min-h-[50vh]" onClick={handleVideoClick}>
        {error ? (
          <div className="text-center text-white p-8">
            <p className="text-lg mb-4">{error}</p>
            <button onClick={loadPlayback} className="px-6 py-2 bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">
              Retry
            </button>
          </div>
        ) : effectiveMode === 'iframe' && playback.embedSrc ? (
          <iframe
            src={playback.embedSrc}
            title={displayLabel}
            className="w-full h-full min-h-[50vh] border-0"
            {...EMBED_IFRAME_PROPS}
          />
        ) : effectiveMode === 'audio' && playback.mediaSrc ? (
          <>
            {channelLogo && (
              <img
                src={channelLogo.startsWith('http') ? channelLogo : `${BACKEND_URL}${channelLogo}`}
                alt={channelName}
                className="w-48 h-48 rounded-2xl object-contain bg-white/10 p-4"
              />
            )}
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={playback.mediaSrc}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              playsInline
            />
            {showControls && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <button onClick={togglePlay} className="p-4 bg-white/20 rounded-full hover:bg-white/30">
                  {isPlaying ? <Pause size={48} className="text-white" /> : <Play size={48} className="text-white" />}
                </button>
              </div>
            )}
          </>
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
            {showControls && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <button onClick={togglePlay} className="p-4 bg-white/20 rounded-full hover:bg-white/30">
                  {isPlaying ? <Pause size={48} className="text-white" /> : <Play size={48} className="text-white" />}
                </button>
              </div>
            )}
            {showControls && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-full text-white">
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  </button>
                  <button onClick={toggleFullscreen} className="p-2 hover:bg-white/20 rounded-full text-white">
                    <Maximize size={24} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-white p-8">
            <p className="text-lg mb-4">No playable video for this selection</p>
            <button onClick={loadPlayback} className="px-6 py-2 bg-teal-600 rounded-lg hover:bg-teal-700">
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="bg-gray-900 border-t border-gray-800">
        <div className="flex items-center justify-around py-3">
          <div className="flex items-center gap-2 text-gray-400">
            <Eye size={20} />
            <span className="text-sm">{interactions.views_count}</span>
          </div>
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-sm">{interactions.likes_count}</span>
          </button>
          <button
            onClick={handleFollow}
            className={`flex items-center gap-2 ${isFollowing ? 'text-teal-500' : 'text-gray-400 hover:text-teal-500'}`}
          >
            <UserPlus size={20} />
            <span className="text-sm">{interactions.followers_count}</span>
          </button>
          <button onClick={handleShare} className="flex items-center gap-2 text-gray-400 hover:text-white">
            <Share2 size={20} />
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TVChannelView;
