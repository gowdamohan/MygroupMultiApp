import React from 'react';
import { Link } from 'react-router-dom';
import { AppDetails } from '../../../types/home.types';
import { getAppLink, resolveImageUrl } from '../utils';

interface MyAppsSectionProps {
  apps: AppDetails[];
  id?: string;
  layout?: 'mobile' | 'desktop';
}

export const MyAppsSection: React.FC<MyAppsSectionProps> = ({ apps, id = 'myApps', layout = 'mobile' }) => {
  if (!apps?.length) return null;

  const isDesktop = layout === 'desktop';

  return (
    <section id={id} className="home-gradient-bg py-14 md:py-20 lg:py-24 px-4 md:px-8 lg:px-12">
      <div className={isDesktop ? 'max-w-4xl mx-auto' : 'max-w-3xl mx-auto'}>
        <header className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">My Apps</h2>
          {isDesktop && (
            <p className="mt-3 text-purple-100/90 text-sm md:text-base max-w-xl mx-auto">
              Your primary applications — select one to get started
            </p>
          )}
        </header>
        <div className={isDesktop ? 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5' : 'flex flex-col items-center'}>
          {apps.map((app) => (
            <Link
              key={app.id}
              to={getAppLink(app)}
              className={`home-how-btn ${isDesktop ? 'max-w-none' : 'max-w-lg'}`}
            >
              <img
                src={resolveImageUrl(app.icon)}
                alt={app.name}
                className="w-5 h-5 object-contain"
              />
              <span>{app.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
