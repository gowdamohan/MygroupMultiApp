import React from 'react';
import { SocialLink } from '../../../types/home.types';

const PLATFORM_ORDER = [
  'Website',
  'YouTube',
  'Facebook',
  'Instagram',
  'Twitter',
  'LinkedIn',
  'Blogger',
] as const;

type PlatformKey = typeof PLATFORM_ORDER[number];

const normalizePlatform = (name: string) => name.trim().toLowerCase();

const platformIndex = (name: string) => {
  const key = normalizePlatform(name);
  return PLATFORM_ORDER.findIndex((p) => normalizePlatform(p) === key);
};

interface PlatformStyle {
  bg: string;
  icon: React.ReactNode;
}

const PlatformIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="flex items-center justify-center w-full h-full text-white">{children}</span>
);

const PLATFORM_STYLES: Record<string, PlatformStyle> = {
  website: {
    bg: 'linear-gradient(145deg, #1e88e5 0%, #1565c0 100%)',
    icon: (
      <PlatformIcon>
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      </PlatformIcon>
    ),
  },
  youtube: {
    bg: 'linear-gradient(145deg, #ff5252 0%, #d32f2f 100%)',
    icon: (
      <PlatformIcon>
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden>
          <path d="M21.58 7.19a2.5 2.5 0 00-1.77-1.78C18.25 5 12 5 12 5s-6.25 0-7.81.41A2.5 2.5 0 002.42 7.19 26.3 26.3 0 002 12a26.3 26.3 0 00.42 4.81 2.5 2.5 0 001.77 1.78C5.75 19 12 19 12 19s6.25 0 7.81-.41a2.5 2.5 0 001.77-1.78A26.3 26.3 0 0022 12a26.3 26.3 0 00-.42-4.81zM10 15.5v-7l6 3.5-6 3.5z" />
        </svg>
      </PlatformIcon>
    ),
  },
  facebook: {
    bg: 'linear-gradient(145deg, #5c6bc0 0%, #3949ab 100%)',
    icon: (
      <PlatformIcon>
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden>
          <path d="M22 12a10 10 0 10-11.6 9.87v-6.99H8.1V12h2.3V9.8c0-2.27 1.35-3.53 3.42-3.53.99 0 2.03.18 2.03.18v2.24h-1.14c-1.12 0-1.47.7-1.47 1.42V12h2.5l-.4 2.88h-2.1v6.99A10 10 0 0022 12z" />
        </svg>
      </PlatformIcon>
    ),
  },
  instagram: {
    bg: 'linear-gradient(145deg, #c13584 0%, #e1306c 45%, #f77737 100%)',
    icon: (
      <PlatformIcon>
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden>
          <path d="M7.8 2h8.4A5.8 5.8 0 0122 7.8v8.4A5.8 5.8 0 0116.2 22H7.8A5.8 5.8 0 012 16.2V7.8A5.8 5.8 0 017.8 2zm0 2A3.8 3.8 0 004 7.8v8.4A3.8 3.8 0 007.8 20h8.4a3.8 3.8 0 003.8-3.8V7.8A3.8 3.8 0 0016.2 4H7.8zm9.2 1.9a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z" />
        </svg>
      </PlatformIcon>
    ),
  },
  twitter: {
    bg: 'linear-gradient(145deg, #4fc3f7 0%, #039be5 100%)',
    icon: (
      <PlatformIcon>
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
          <path d="M21.5 7.2c-.7.3-1.4.5-2.2.6.8-.5 1.3-1.2 1.6-2.1-.7.4-1.5.7-2.4.9A3.7 3.7 0 0012 8.6c0 .3 0 .6.1.9A10.5 10.5 0 013 5.4a3.7 3.7 0 001.1 4.9 3.6 3.6 0 01-1.7-.5v.1c0 1.8 1.3 3.3 3 3.6-.3.1-.7.1-1 .1-.2 0-.5 0-.7-.1.5 1.5 1.9 2.6 3.6 2.6A7.4 7.4 0 012 18.1a10.4 10.4 0 005.6 1.6c6.8 0 10.5-5.6 10.5-10.5v-.5c.7-.5 1.3-1.2 1.8-2z" />
        </svg>
      </PlatformIcon>
    ),
  },
  linkedin: {
    bg: 'linear-gradient(145deg, #42a5f5 0%, #1565c0 100%)',
    icon: (
      <PlatformIcon>
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden>
          <path d="M6.5 8.5h3v10h-3v-10zM8 4a1.75 1.75 0 110 3.5A1.75 1.75 0 018 4zm4.5 4.5h2.9v1.4h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.6v5.5h-3v-4.9c0-1.17-.02-2.67-1.63-2.67-1.63 0-1.88 1.27-1.88 2.58v4.99h-3v-10z" />
        </svg>
      </PlatformIcon>
    ),
  },
  blogger: {
    bg: 'linear-gradient(145deg, #ff9800 0%, #ef6c00 100%)',
    icon: (
      <PlatformIcon>
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 6h6v2h-4v1h3c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2h-4v-2h4v-1h-3c-1.1 0-2-.9-2-2v-1c0-1.1.9-2 2-2z" />
        </svg>
      </PlatformIcon>
    ),
  },
};

const defaultStyle: PlatformStyle = {
  bg: 'linear-gradient(145deg, #546e7a 0%, #37474f 100%)',
  icon: (
    <PlatformIcon>
      <span className="text-sm font-bold">@</span>
    </PlatformIcon>
  ),
};

interface FooterSocialBarProps {
  socialLinks: SocialLink[];
}

export const FooterSocialBar: React.FC<FooterSocialBarProps> = ({ socialLinks }) => {
  const activeLinks = socialLinks
    .filter((link) => link.url && link.url.trim() !== '' && link.url !== '#')
    .sort((a, b) => {
      const ai = platformIndex(a.platform);
      const bi = platformIndex(b.platform);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  if (activeLinks.length === 0) return null;

  return (
    <div className="home-footer-social">
      <h3 className="home-footer-social-title">Follow us</h3>
      <div className="home-footer-social-icons">
        {activeLinks.map((link) => {
          const key = normalizePlatform(link.platform);
          const style = PLATFORM_STYLES[key] ?? defaultStyle;

          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="home-footer-social-btn"
              style={{ background: style.bg }}
              title={link.platform}
              aria-label={link.platform}
            >
              {style.icon}
            </a>
          );
        })}
      </div>
    </div>
  );
};

export { PLATFORM_ORDER, normalizePlatform };
