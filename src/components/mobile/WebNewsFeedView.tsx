/**
 * WebNewsFeedView
 *
 * Dailyhunt-style news aggregator for "Web" category channels.
 * Fetches articles from /api/v1/mymedia/channel/:channelId/news-feed
 * and renders them as a vertically scrollable card list.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Globe, RefreshCw, AlertCircle, Newspaper, ExternalLink, Clock } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

/* ─── Types ─────────────────────────────────────────────────── */
interface NewsItem {
  title: string;
  url: string;
  description: string;
  image: string;
  publishedAt: string;
}

interface Props {
  channelId: number;
  channelName: string;
  channelLogo?: string;
  onBack: () => void;
}

/* ─── Helpers ────────────────────────────────────────────────── */

/** Return human-readable relative timestamp ("12 mins ago", "1 hr ago", "Today", …) */
const relativeTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const then = new Date(dateStr);
  if (Number.isNaN(then.getTime())) return '';
  const diffMs = Date.now() - then.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

/** Truncate text to ~n characters at a word boundary. */
const truncate = (text: string, n = 80): string => {
  if (!text || text.length <= n) return text;
  const cut = text.substring(0, n);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.substring(0, lastSpace) : cut) + '…';
};

/** Resolve logo path to a displayable URL. */
const resolveLogoSrc = (logo?: string): string | null => {
  if (!logo) return null;
  if (logo.startsWith('http')) return logo;
  return `${BACKEND_URL}${logo}`;
};

/* ─── Sub-components ─────────────────────────────────────────── */

/** Single news card – thumbnail on right, text on left (Dailyhunt style). */
const NewsCard: React.FC<{ item: NewsItem; channelName: string }> = ({ item, channelName }) => {
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className="flex gap-3 p-4 bg-white cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
    >
      {/* Text section */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-3">
          {item.title}
        </h3>

        {item.description && (
          <p className="text-xs text-gray-500 leading-relaxed">
            {truncate(item.description, 80)}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <Globe size={11} className="text-teal-600 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-teal-700 truncate max-w-[120px]">
            {channelName}
          </span>
          {item.publishedAt && (
            <>
              <span className="text-gray-300 text-[10px]">•</span>
              <span className="flex items-center gap-0.5 text-[11px] text-gray-400 flex-shrink-0">
                <Clock size={10} />
                {relativeTime(item.publishedAt)}
              </span>
            </>
          )}
          <ExternalLink size={10} className="text-gray-300 ml-auto flex-shrink-0" />
        </div>
      </div>

      {/* Thumbnail */}
      {item.image && !imgError ? (
        <div className="flex-shrink-0 w-24 h-20 rounded-xl overflow-hidden bg-gray-100">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="flex-shrink-0 w-24 h-20 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
          <Newspaper size={28} className="text-teal-300" />
        </div>
      )}
    </div>
  );
};

/** Loading skeleton for a single card. */
const CardSkeleton: React.FC = () => (
  <div className="flex gap-3 p-4 bg-white border-b border-gray-100 animate-pulse">
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-gray-200 rounded w-full" />
      <div className="h-3.5 bg-gray-200 rounded w-5/6" />
      <div className="h-3.5 bg-gray-200 rounded w-4/6" />
      <div className="h-3 bg-gray-100 rounded w-2/5 mt-4" />
    </div>
    <div className="flex-shrink-0 w-24 h-20 rounded-xl bg-gray-200" />
  </div>
);

/* ─── Main Component ─────────────────────────────────────────── */
export const WebNewsFeedView: React.FC<Props> = ({
  channelId,
  channelName,
  channelLogo,
  onBack,
}) => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [feedChannelName, setFeedChannelName] = useState(channelName);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const logoSrc = resolveLogoSrc(channelLogo);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/mymedia/channel/${channelId}/news-feed`
      );
      if (res.data.success) {
        setItems(res.data.data.items || []);
        if (res.data.data.channelName) setFeedChannelName(res.data.data.channelName);
      } else {
        setError('Could not load news feed.');
      }
    } catch (err) {
      console.error('[WebNewsFeedView] Error loading feed:', err);
      setError('Failed to load news. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [channelId, refreshKey]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>

          {/* Channel logo */}
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={channelName}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {channelName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 text-base truncate leading-tight">
              {feedChannelName}
            </h1>
            <p className="text-xs text-gray-500">Latest News</p>
          </div>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 disabled:opacity-50"
            aria-label="Refresh feed"
          >
            <RefreshCw size={18} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Live indicator strip */}
        <div className="h-0.5 bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400" />
      </div>

      {/* Feed banner label */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-100">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Latest Updates
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 bg-white">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">Feed Unavailable</p>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Newspaper size={32} className="text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">No News Available</p>
          <p className="text-sm text-gray-500">
            This channel has not published any articles yet, or the feed could not be
            parsed. Try refreshing.
          </p>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="mt-5 px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="flex-1 bg-white divide-y-0">
          {items.map((item, idx) => (
            <NewsCard key={`${item.url}-${idx}`} item={item} channelName={feedChannelName} />
          ))}

          {/* Footer */}
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-gray-400">
              Showing {items.length} article{items.length !== 1 ? 's' : ''} from{' '}
              <span className="font-medium text-gray-500">{feedChannelName}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebNewsFeedView;
