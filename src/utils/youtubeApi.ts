/**
 * YouTube Data API v3 helpers.
 * All requests use a single API key; quota errors are surfaced as thrown errors
 * so callers can display friendly messages.
 */

const YT_API_KEY = 'AIzaSyDeBLtxrcD5xe-tkz87Z4WX1IPSQf8loJc';
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount?: string;
  duration?: string;
}

export interface YouTubeChannelInfo {
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount?: string;
  videoCount?: string;
  uploadsPlaylistId: string;
}

async function ytFetch(endpoint: string, params: Record<string, string>): Promise<any> {
  const url = new URL(`${YT_BASE}/${endpoint}`);
  url.searchParams.set('key', YT_API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const reason = body?.error?.message || `HTTP ${res.status}`;
    throw new Error(reason);
  }
  return res.json();
}

/**
 * Resolve a YouTube channel URL to a channel ID.
 *
 * Supports:
 *   @handle             → forHandle API (v3 channels endpoint)
 *   UCxxxx (raw ID)     → used directly
 *   c/customUrl         → search API fallback
 *   user/legacyName     → forUsername API
 */
export async function resolveYouTubeChannelId(handle: string): Promise<string> {
  // Already a raw channel ID
  if (/^UC[\w-]{22}$/.test(handle)) return handle;

  // @handle
  if (handle.startsWith('@')) {
    const data = await ytFetch('channels', {
      part: 'id',
      forHandle: handle,
      maxResults: '1',
    });
    const id = data?.items?.[0]?.id;
    if (id) return id;
    throw new Error(`Channel not found for handle ${handle}`);
  }

  // user/legacyName
  if (handle.startsWith('user/')) {
    const username = handle.replace('user/', '');
    const data = await ytFetch('channels', {
      part: 'id',
      forUsername: username,
      maxResults: '1',
    });
    const id = data?.items?.[0]?.id;
    if (id) return id;
    throw new Error(`Channel not found for username ${username}`);
  }

  // c/customUrl — use search as fallback
  if (handle.startsWith('c/')) {
    const query = handle.replace('c/', '');
    const data = await ytFetch('search', {
      part: 'snippet',
      type: 'channel',
      q: query,
      maxResults: '1',
    });
    const id = data?.items?.[0]?.id?.channelId;
    if (id) return id;
    throw new Error(`Channel not found for custom URL ${query}`);
  }

  throw new Error(`Unrecognised handle format: ${handle}`);
}

/**
 * Fetch channel metadata and its uploads playlist ID.
 */
export async function fetchYouTubeChannelInfo(channelId: string): Promise<YouTubeChannelInfo> {
  const data = await ytFetch('channels', {
    part: 'snippet,contentDetails,statistics',
    id: channelId,
  });

  const item = data?.items?.[0];
  if (!item) throw new Error('Channel metadata not found');

  return {
    channelId,
    title: item.snippet?.title ?? '',
    description: item.snippet?.description ?? '',
    thumbnailUrl:
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url ||
      '',
    subscriberCount: item.statistics?.subscriberCount,
    videoCount: item.statistics?.videoCount,
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads ?? '',
  };
}

/**
 * Fetch the latest videos from an uploads playlist.
 */
export async function fetchYouTubePlaylistVideos(
  uploadsPlaylistId: string,
  maxResults = 25,
  pageToken?: string
): Promise<{ videos: YouTubeVideo[]; nextPageToken?: string }> {
  const params: Record<string, string> = {
    part: 'snippet',
    playlistId: uploadsPlaylistId,
    maxResults: String(maxResults),
  };
  if (pageToken) params.pageToken = pageToken;

  const data = await ytFetch('playlistItems', params);
  const items: any[] = data?.items ?? [];

  const videos: YouTubeVideo[] = items.map((item) => ({
    videoId: item.snippet?.resourceId?.videoId ?? '',
    title: item.snippet?.title ?? '',
    description: item.snippet?.description ?? '',
    thumbnailUrl:
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url ||
      '',
    publishedAt: item.snippet?.publishedAt ?? '',
  }));

  return {
    videos: videos.filter((v) => v.videoId && v.title !== 'Deleted video' && v.title !== 'Private video'),
    nextPageToken: data?.nextPageToken,
  };
}

/**
 * Enrich a list of video IDs with view counts and durations.
 * Called as a best-effort enrichment — returns empty map on failure.
 */
export async function fetchVideoDetails(
  videoIds: string[]
): Promise<Record<string, { viewCount: string; duration: string }>> {
  if (!videoIds.length) return {};
  try {
    const data = await ytFetch('videos', {
      part: 'statistics,contentDetails',
      id: videoIds.join(','),
    });
    const result: Record<string, { viewCount: string; duration: string }> = {};
    for (const item of data?.items ?? []) {
      result[item.id] = {
        viewCount: item.statistics?.viewCount ?? '0',
        duration: item.contentDetails?.duration ?? '',
      };
    }
    return result;
  } catch {
    return {};
  }
}

/** Format ISO 8601 duration (e.g. PT4M13S) to mm:ss */
export function formatYTDuration(iso: string): string {
  if (!iso) return '';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Format a large number e.g. 1234567 → "1.2M views" */
export function formatViewCount(n?: string): string {
  const num = parseInt(n || '0', 10);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M views`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K views`;
  return `${num} views`;
}

/** Human-friendly "x time ago" from ISO date string */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
