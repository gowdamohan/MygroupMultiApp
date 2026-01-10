import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Heart, Share2, UserPlus, Eye, Loader2, Info } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

interface TVChannelViewProps {
  channelId: number;
  channelName: string;
  channelLogo?: string;
  onBack: () => void;
  onViewDetails: () => void;
}

interface StreamData {
  activeSource: 'live' | 'mymedia' | 'offline';
  streamUrl: string;
  offlineMedia?: {
    id: number;
    title: string;
    thumbnail_url: string;
    file_url: string;
  };
}

export const TVChannelView: React.FC<TVChannelViewProps> = ({
  channelId,
  channelName,
  channelLogo,
  onBack,
  onViewDetails
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamData, setStreamData] = useState<StreamData | null>(null);
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

  useEffect(() => {
    fetchStreamData();
    fetchInteractions();
    incrementViewCount();
  }, [channelId]);

  const fetchStreamData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/mymedia/channel/${channelId}/stream`);
      if (response.data.success) {
        setStreamData(response.data.data);
      } else {
        setError('Stream not available');
      }
    } catch (err) {
      console.error('Error fetching stream:', err);
      setError('Failed to load stream');
    } finally {
      setLoading(false);
    }
  };

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
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleVideoClick = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setInteractions(prev => ({
      ...prev,
      likes_count: isLiked ? prev.likes_count - 1 : prev.likes_count + 1
    }));
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    setInteractions(prev => ({
      ...prev,
      followers_count: isFollowing ? prev.followers_count - 1 : prev.followers_count + 1
    }));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: channelName,
          text: `Watch ${channelName} live!`,
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  const getStreamUrl = () => {
    if (!streamData) return '';
    if (streamData.activeSource === 'offline' && streamData.offlineMedia) {
      return `${BACKEND_URL}${streamData.offlineMedia.file_url}`;
    }
    return streamData.streamUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={48} className="text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3 p-4">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1 flex items-center gap-3" onClick={onViewDetails}>
            {channelLogo ? (
              <img src={`${BACKEND_URL}${channelLogo}`} alt={channelName} className="w-10 h-10 rounded-lg object-contain bg-white" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white text-lg font-bold">{channelName?.charAt(0)}</div>
            )}
            <div className="text-white">
              <h1 className="font-bold text-lg">{channelName}</h1>
              <p className="text-sm text-gray-300 capitalize">{streamData?.activeSource || 'Live'}</p>
            </div>
          </div>
          <button onClick={onViewDetails} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
            <Info size={24} />
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 relative flex items-center justify-center" onClick={handleVideoClick}>
        {error ? (
          <div className="text-center text-white p-8">
            <p className="text-lg mb-4">{error}</p>
            <button onClick={fetchStreamData} className="px-6 py-2 bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">
              Retry
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={getStreamUrl()}
              className="w-full h-full object-contain"
              poster={streamData?.offlineMedia?.thumbnail_url ? `${BACKEND_URL}${streamData.offlineMedia.thumbnail_url}` : undefined}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              playsInline
              autoPlay
            />

            {/* Video Controls Overlay */}
            {showControls && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity">
                <button onClick={togglePlay} className="p-4 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                  {isPlaying ? <Pause size={48} className="text-white" /> : <Play size={48} className="text-white" />}
                </button>
              </div>
            )}

            {/* Bottom Controls */}
            {showControls && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
                      {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                  </div>
                  <button onClick={toggleFullscreen} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
                    <Maximize size={24} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Engagement Bar */}
      <div className="bg-gray-900 border-t border-gray-800">
        <div className="flex items-center justify-around py-3">
          <div className="flex items-center gap-2 text-gray-400">
            <Eye size={20} />
            <span className="text-sm">{interactions.views_count}</span>
          </div>
          <button onClick={handleLike} className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-sm">{interactions.likes_count}</span>
          </button>
          <button onClick={handleFollow} className={`flex items-center gap-2 transition-colors ${isFollowing ? 'text-teal-500' : 'text-gray-400 hover:text-teal-500'}`}>
            <UserPlus size={20} />
            <span className="text-sm">{interactions.followers_count}</span>
          </button>
          <button onClick={handleShare} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <Share2 size={20} />
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TVChannelView;

