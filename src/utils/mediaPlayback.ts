import { BACKEND_URL, getUploadUrl } from '../config/api.config';

/** Convert watch/share URLs to embeddable iframe src (with autoplay when supported). */
export const toEmbedUrl = (url: string): string => {
  const t = url.trim();
  if (!t) return '';

  const ytMatch = t.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&playsinline=1`;
  }

  if (/youtube\.com\/embed\//i.test(t)) {
    return t.includes('autoplay') ? t : `${t}${t.includes('?') ? '&' : '?'}autoplay=1`;
  }

  return t;
};

export const isEmbeddableStreamUrl = (url: string): boolean => {
  const u = url.toLowerCase();
  return (
    u.includes('youtube.com') ||
    u.includes('youtu.be') ||
    u.includes('vimeo.com') ||
    u.includes('dailymotion.com') ||
    u.includes('/embed')
  );
};

/** Resolve stored path or absolute URL for video/audio elements. */
export const resolveMediaSrc = (path: string | null | undefined): string => {
  if (!path || !path.trim()) return '';
  const trimmed = path.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return getUploadUrl(trimmed);
};

export type PlaybackMode = 'iframe' | 'video' | 'audio' | 'none';

export interface PlaybackConfig {
  mode: PlaybackMode;
  /** Direct src for video/audio */
  mediaSrc: string;
  /** iframe src for live/mymedia embeds */
  embedSrc: string;
  label: string;
}

export const buildPlaybackFromStreamApi = (data: {
  activeSource?: string;
  playbackType?: string;
  streamUrl?: string | null;
  embedUrl?: string | null;
  offlineMedia?: {
    media_type?: string;
    media_file_url?: string;
    file_url?: string;
    thumbnail_url?: string;
  } | null;
}): PlaybackConfig => {
  const activeSource = data.activeSource || 'live';
  const apiType = data.playbackType;

  if (apiType === 'iframe' || (data.embedUrl && data.embedUrl.trim())) {
    const embed = data.embedUrl?.trim() || toEmbedUrl(data.streamUrl || '');
    return { mode: 'iframe', mediaSrc: '', embedSrc: embed, label: activeSource };
  }

  if (activeSource === 'offline' && data.offlineMedia) {
    const fileUrl = data.offlineMedia.media_file_url || data.offlineMedia.file_url || '';
    const src = resolveMediaSrc(fileUrl);
    if (data.offlineMedia.media_type === 'audio') {
      return { mode: 'audio', mediaSrc: src, embedSrc: '', label: 'offline' };
    }
    return { mode: 'video', mediaSrc: src, embedSrc: '', label: 'offline' };
  }

  const raw = data.streamUrl || '';
  if (!raw.trim()) {
    return { mode: 'none', mediaSrc: '', embedSrc: '', label: activeSource };
  }

  if (isEmbeddableStreamUrl(raw)) {
    return { mode: 'iframe', mediaSrc: '', embedSrc: toEmbedUrl(raw), label: activeSource };
  }

  const src = resolveMediaSrc(raw);
  return { mode: 'video', mediaSrc: src, embedSrc: '', label: activeSource };
};

export const buildPlaybackFromScheduleFile = (
  mediaFile: string,
  title?: string
): PlaybackConfig => {
  const src = resolveMediaSrc(mediaFile);
  if (!src) {
    return { mode: 'none', mediaSrc: '', embedSrc: '', label: title || 'Program' };
  }
  if (isEmbeddableStreamUrl(mediaFile)) {
    return { mode: 'iframe', mediaSrc: '', embedSrc: toEmbedUrl(mediaFile), label: title || 'Program' };
  }
  const lower = mediaFile.toLowerCase();
  const isAudio = /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(lower);
  return {
    mode: isAudio ? 'audio' : 'video',
    mediaSrc: src,
    embedSrc: '',
    label: title || 'Program',
  };
};
