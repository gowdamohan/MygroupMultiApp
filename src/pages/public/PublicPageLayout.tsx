import React from 'react';
import { Link } from 'react-router-dom';
import { HomeFooter } from '../home/sections/HomeFooter';
import { DesktopHomeHeader } from '../home/sections/DesktopHomeHeader';
import { usePublicFooterMeta } from '../../hooks/usePublicFooterMeta';
import { useHomeDarkMode } from '../../hooks/useHomeDarkMode';
import '../../styles/home.css';

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
    <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-900 border-t-teal-400" />
    <p className="text-sm text-slate-400">Loading…</p>
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
  const { darkMode, toggleDarkMode } = useHomeDarkMode();

  return (
    <div className="desktop-home public-footer-page">
      <DesktopHomeHeader darkMode={darkMode} onDarkModeToggle={toggleDarkMode} />

      {/* Page hero banner */}
      <div
        className="public-page-hero pb-8 px-6 border-b transition-colors duration-300"
        style={{
          paddingTop: 25,
          borderBottomWidth: 3,
          borderBottomColor: `${accentColor}35`,
        }}
      >
        <div className="max-w-6xl mx-auto">
          <nav className="public-page-breadcrumb text-xs mb-3 flex items-center gap-1.5">
            <Link to="/">Home</Link>
            <span>/</span>
            <span className="public-page-breadcrumb-current font-medium">{title}</span>
          </nav>
          <h1 className="public-page-title text-3xl font-bold">{title}</h1>
          {subtitle && <p className="public-page-subtitle mt-2 text-base">{subtitle}</p>}
        </div>
      </div>

      {/* Page content */}
      <main className="public-footer-main max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : (
          children
        )}
      </main>

      <HomeFooter socialLinks={socialLinks} copyRight={null} />
    </div>
  );
};
