import React from 'react';
import { Link } from 'react-router-dom';
import { AppDetails } from '../../../types/home.types';
import { getAppLink, resolveImageUrl } from '../utils';

interface AppGridSectionProps {
  title: string;
  apps: AppDetails[];
  id?: string;
  darkMode?: boolean;
  excludeNames?: string[];
  variant?: 'default' | 'alt';
  layout?: 'mobile' | 'desktop';
}

export const AppGridSection: React.FC<AppGridSectionProps> = ({
  title,
  apps,
  id,
  darkMode = false,
  excludeNames = [],
  variant = 'default',
  layout = 'mobile',
}) => {
  const filtered = apps?.filter((app) => !excludeNames.includes(app.name)) ?? [];
  if (!filtered.length) return null;

  const isDesktop = layout === 'desktop';

  const sectionClass =
    variant === 'alt'
      ? darkMode
        ? 'home-section-light'
        : 'bg-white'
      : darkMode
        ? 'home-section-alt'
        : 'bg-gray-50';

  return (
    <section
      id={id}
      className={`home-section-transition py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12 ${sectionClass}`}
    >
      <div className={isDesktop ? 'max-w-7xl mx-auto' : 'max-w-6xl mx-auto'}>
        <header className="text-center mb-10 md:mb-12">
          <h2
            className={`font-bold tracking-tight home-text-primary ${
              isDesktop ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
            } ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {title}
          </h2>
          {isDesktop && (
            <p className={`mt-2 text-sm md:text-base home-text-secondary ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Access your applications in one place
            </p>
          )}
        </header>

        <div
          className={
            isDesktop
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-6'
              : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6'
          }
        >
          {filtered.map((app) => (
            <Link
              key={app.id}
              to={getAppLink(app)}
              className={`home-card home-app-card group flex flex-col items-center transition-all duration-300 ${
                isDesktop
                  ? `p-5 md:p-6 rounded-2xl ${
                      darkMode
                        ? 'bg-gray-800/80 hover:bg-gray-700/90 ring-1 ring-gray-700/50 hover:ring-purple-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/20'
                        : 'bg-white hover:bg-white ring-1 ring-gray-100 hover:ring-purple-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10'
                    }`
                  : `p-4 md:p-5 rounded-xl ${
                      darkMode
                        ? 'bg-gray-800 hover:bg-gray-700'
                        : 'bg-white hover:bg-gray-100 shadow-md'
                    }`
              }`}
            >
              <div
                className={`flex items-center justify-center rounded-2xl mb-3 transition-transform duration-300 group-hover:scale-105 ${
                  isDesktop
                    ? darkMode
                      ? 'w-16 h-16 bg-gray-900/60'
                      : 'w-16 h-16 bg-gradient-to-br from-purple-50 to-indigo-50'
                    : ''
                }`}
              >
                <img
                  src={resolveImageUrl(app.icon)}
                  alt={app.name}
                  className={`object-contain ${isDesktop ? 'w-12 h-12 md:w-14 md:h-14' : 'w-12 h-12 md:w-14 md:h-14 rounded-full'} mb-0`}
                />
              </div>
              <span
                className={`font-medium text-center leading-snug home-text-primary ${
                  isDesktop ? 'text-sm md:text-base' : 'text-sm'
                } ${darkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {app.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
