import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicFooterPage } from '../../hooks/usePublicFooterPage';
import { resolveImageUrl } from '../home/utils';

export const EventsPage: React.FC = () => {
  const { data, loading, error } = usePublicFooterPage('events');

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch { return dateStr; }
  };

  return (
    <PublicPageLayout
      title="Events"
      subtitle="Stay updated with our latest events and programmes"
      accentColor="#6366f1"
      loading={loading}
      error={error}
    >
      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-16">No events found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((ev) => (
            <div
              key={ev.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-indigo-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
            >
              {ev.image ? (
                <div className="h-48 overflow-hidden">
                  <img
                    src={resolveImageUrl(ev.image)}
                    alt={ev.title || 'Event'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                {ev.event_date && (
                  <span className="text-xs font-semibold text-indigo-500 mb-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(ev.event_date)}
                  </span>
                )}
                {ev.title && (
                  <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">{ev.title}</h3>
                )}
                {ev.tag_line && (
                  <p className="text-sm text-indigo-600 font-medium mb-2">{ev.tag_line}</p>
                )}
                {ev.content && (
                  <p className="text-sm text-gray-500 leading-relaxed flex-1 line-clamp-3">{ev.content}</p>
                )}
                {ev.url && (
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Learn More →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PublicPageLayout>
  );
};
