import { getUploadUrl } from '../../config/api.config';
import { AppDetails } from '../../types/home.types';

export const resolveImageUrl = (path?: string): string => {
  if (!path) return '';
  return getUploadUrl(path);
};

export const getAppLink = (app: AppDetails): string => {
  if (app.url && app.url !== '#') return app.url;
  const slug = app.name?.toLowerCase().replace(/\s+/g, '') || '';
  return `/mobile/${slug}`;
};

export const truncateText = (text: string, maxLength = 100): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
