import React from 'react';
import { Grid3x3, Building2, Globe, Download } from 'lucide-react';

const NAV_ITEMS = [
  { href: '#myApps', label: 'My Apps', icon: Grid3x3, description: 'Core applications' },
  { href: '#myCompany', label: 'My Company', icon: Building2, description: 'Company tools' },
  { href: '#onlineApps', label: 'My Online Apps', icon: Globe, description: 'Cloud services' },
  { href: '#offlineApps', label: 'My Offline Apps', icon: Download, description: 'Local apps' },
] as const;

interface NavigationButtonsProps {
  darkMode?: boolean;
  layout?: 'mobile' | 'desktop';
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  darkMode = false,
  layout = 'mobile',
}) => {
  const isDesktop = layout === 'desktop';
  const sectionClass = darkMode ? 'home-section-alt' : 'bg-gray-50';

  return (
    <section className={`home-section-transition py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12 ${sectionClass}`}>
      <div className={isDesktop ? 'max-w-5xl mx-auto' : 'max-w-2xl mx-auto'}>
        <header className="text-center mb-10 md:mb-12">
          <h2
            className={`font-bold tracking-tight home-text-primary ${
              isDesktop ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
            } ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Quick Navigation
          </h2>
          {isDesktop && (
            <p className={`mt-2 text-sm md:text-base home-text-secondary ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Jump to any section on this page
            </p>
          )}
        </header>

        <div className={isDesktop ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5' : 'flex flex-col'}>
          {NAV_ITEMS.map(({ href, label, icon: Icon, description }) => (
            <a
              key={href}
              href={href}
              className={
                isDesktop
                  ? `home-nav-card group flex items-center gap-4 p-5 md:p-6 rounded-2xl transition-all duration-300 ${
                      darkMode
                        ? 'bg-gray-800/80 ring-1 ring-gray-700/50 hover:ring-purple-500/40 hover:bg-gray-700/90 hover:-translate-y-0.5'
                        : 'bg-white ring-1 ring-gray-100 hover:ring-purple-200 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5'
                    }`
                  : 'home-nav-btn'
              }
            >
              <span
                className={`flex-shrink-0 flex items-center justify-center rounded-xl transition-colors duration-300 ${
                  isDesktop
                    ? `w-12 h-12 ${
                        darkMode
                          ? 'bg-gradient-to-br from-purple-600/30 to-indigo-600/30 text-purple-300 group-hover:from-purple-600/50 group-hover:to-indigo-600/50'
                          : 'bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 group-hover:from-purple-200 group-hover:to-indigo-200'
                      }`
                    : ''
                }`}
              >
                <Icon size={isDesktop ? 22 : 20} />
              </span>
              <span className={isDesktop ? 'text-left' : undefined}>
                <span
                  className={`block font-semibold ${
                    isDesktop
                      ? darkMode
                        ? 'text-white'
                        : 'text-gray-900'
                      : ''
                  }`}
                >
                  {label}
                </span>
                {isDesktop && (
                  <span className={`block text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {description}
                  </span>
                )}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
