import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicFooterPage } from '../../hooks/usePublicFooterPage';
import { resolveImageUrl } from '../home/utils';

export const AwardsPage: React.FC = () => {
  const { data, loading, error } = usePublicFooterPage('awards');

  return (
    <PublicPageLayout
      title="Awards & Recognition"
      subtitle="Honours and accolades that recognise our commitment to excellence"
      accentColor="#d97706"
      loading={loading}
      error={error}
    >
      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-16">No awards listed yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-amber-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative"
            >
              {/* Gold ribbon accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />

              {item.image ? (
                <div className="h-52 overflow-hidden">
                  <img
                    src={resolveImageUrl(item.image)}
                    alt={item.title || 'Award'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-52 bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center">
                  <svg className="w-16 h-16 text-amber-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              )}

              <div className="p-5">
                {item.year && (
                  <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full mb-2">
                    {item.year}
                  </span>
                )}
                {item.title && (
                  <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">{item.title}</h3>
                )}
                {item.tag_line && (
                  <p className="text-sm text-amber-600 font-medium mb-2">{item.tag_line}</p>
                )}
                {item.content && (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{item.content}</p>
                )}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900">
                    View Details →
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
