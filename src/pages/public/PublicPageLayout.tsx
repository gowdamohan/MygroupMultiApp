import React from 'react';
import { Link } from 'react-router-dom';
import { MobileHeader } from '../../components/mobile/MobileHeader';
import { HomeFooter } from '../home/sections/HomeFooter';
import { usePublicFooterMeta } from '../../hooks/usePublicFooterMeta';

interface PublicPageLayoutProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
    <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-200 border-t-purple-600" />
    <p className="text-sm text-gray-400">Loading…</p>
  </div>
);

export const PublicPageLayout: React.FC<PublicPageLayoutProps> = ({
  title,
  subtitle,
  accentColor = '#057284',
  children,
  loading,
  error,
}) => {
  const { socialLinks } = usePublicFooterMeta();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Reuse desktop header without ads */}
      <MobileHeader
        appName="mymedia"
        variant="desktop"
        desktopLayout="default"
        showTopIcons={false}
        showAds={false}
        showDarkModeToggle={false}
        showProfileButton={false}
        showSettingsButton={false}
        showAppDownloadButtons={false}
      />

      {/* Page hero banner */}
      <div
        className="pt-20 pb-10 px-6"
        style={{ background: `linear-gradient(135deg, ${accentColor}18 0%, ${accentColor}08 100%)`, borderBottom: `3px solid ${accentColor}30` }}
      >
        <div className="max-w-6xl mx-auto">
          <nav className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
            <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-600 font-medium">{title}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900" style={{ color: accentColor }}>{title}</h1>
          {subtitle && <p className="mt-2 text-base text-gray-500">{subtitle}</p>}
        </div>
      </div>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : (
          children
        )}
      </main>

      {/* Footer */}
      <HomeFooter socialLinks={socialLinks} copyRight={null} />
    </div>
  );
};
