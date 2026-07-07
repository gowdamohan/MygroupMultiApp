import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicFooterPage } from '../../hooks/usePublicFooterPage';
import { resolveImageUrl } from '../home/utils';

export const MilestonesPage: React.FC = () => {
  const { data, loading, error } = usePublicFooterPage('milestones');

  return (
    <PublicPageLayout
      title="Milestones"
      subtitle="Our journey — key achievements and growth markers"
      accentColor="#8b5cf6"
      loading={loading}
      error={error}
    >
      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-16">No milestones added yet.</p>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 via-purple-200 to-transparent hidden sm:block" />

          <div className="space-y-8">
            {data.map((item, idx) => (
              <div key={item.id} className="flex gap-6 relative">
                {/* Timeline dot */}
                <div className="flex-shrink-0 hidden sm:flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md z-10 text-white font-bold text-xs">
                    {item.year || (idx + 1)}
                  </div>
                </div>

                {/* Card */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    {item.image && (
                      <div className="sm:w-48 flex-shrink-0">
                        <img
                          src={resolveImageUrl(item.image)}
                          alt={item.title || 'Milestone'}
                          className="w-full h-36 sm:h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-5 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {item.year && (
                          <span className="inline-block bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {item.year}
                          </span>
                        )}
                        <span className="sm:hidden inline-block bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          #{idx + 1}
                        </span>
                      </div>
                      {item.title && (
                        <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                      )}
                      {item.tag_line && (
                        <p className="text-sm text-purple-600 font-medium mb-2">{item.tag_line}</p>
                      )}
                      {item.content && (
                        <div
                          className="prose prose-sm max-w-none text-gray-600"
                          dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PublicPageLayout>
  );
};
