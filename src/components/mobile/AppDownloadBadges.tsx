import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

const AndroidIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
    <path d="M17.6 9.48l1.84-3.18c.16-.28.04-.62-.26-.74-.3-.12-.66.04-.78.34l-1.88 3.24a8.77 8.77 0 00-4.52 0L10.12 5.9c-.12-.3-.48-.46-.78-.34-.3.12-.42.46-.26.74L11.4 9.48A8.9 8.9 0 005 14.25v.75h14v-.75a8.9 8.9 0 00-6.4-4.77zM7 16.75a1 1 0 110-2 1 1 0 010 2zm10 0a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
    <path d="M17.05 12.65c-.02-2.17 1.77-3.21 1.85-3.26-1.01-1.47-2.58-1.67-3.14-1.7-1.34-.14-2.62.79-3.3.79-.68 0-1.73-.77-2.85-.75-1.47.02-2.82.85-3.58 2.16-1.53 2.65-.39 6.57 1.1 8.72.73 1.05 1.6 2.23 2.74 2.19 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.85.69 1.18-.02 1.92-1.07 2.64-2.12.83-1.21 1.17-2.38 1.19-2.44-.03-.01-2.28-.87-2.3-3.46zm-2.15-6.4c.74-.89 1.24-2.13 1.1-3.36-1.06.04-2.35.71-3.11 1.6-.69.8-1.29 2.08-1.13 3.31 1.19.09 2.41-.6 3.14-1.55z" />
  </svg>
);

interface AppDownloadBadgesProps {
  className?: string;
}

export const AppDownloadBadges: React.FC<AppDownloadBadgesProps> = ({ className = '' }) => {
  const [androidUrl, setAndroidUrl] = useState('https://play.google.com/store/apps');
  const [iosUrl, setIosUrl] = useState('https://apps.apple.com');

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/home/download-apps`);
        if (response.data.success) {
          const d = response.data.data;
          if (d?.android) setAndroidUrl(d.android);
          if (d?.ios) setIosUrl(d.ios);
        }
      } catch {
        // keep defaults
      }
    };
    fetchLinks();
  }, []);

  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 ${className}`}>
      <a
        href={androidUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-green-600/25 hover:shadow-lg hover:shadow-green-600/35 hover:-translate-y-0.5 transition-all duration-300"
        aria-label="Download on Google Play"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 group-hover:bg-white/25 transition-colors">
          <AndroidIcon />
        </span>
        <span className="hidden sm:flex flex-col leading-tight text-left">
          <span className="text-[9px] uppercase tracking-wide opacity-90">Get it on</span>
          <span className="text-xs font-semibold">Google Play</span>
        </span>
      </a>
      <a
        href={iosUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl bg-gradient-to-br from-gray-800 to-gray-950 text-white shadow-md shadow-gray-900/30 hover:shadow-lg hover:shadow-gray-900/40 hover:-translate-y-0.5 transition-all duration-300"
        aria-label="Download on the App Store"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 group-hover:bg-white/20 transition-colors">
          <AppleIcon />
        </span>
        <span className="hidden sm:flex flex-col leading-tight text-left">
          <span className="text-[9px] uppercase tracking-wide opacity-90">Download on the</span>
          <span className="text-xs font-semibold">App Store</span>
        </span>
      </a>
    </div>
  );
};
