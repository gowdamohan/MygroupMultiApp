import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicFooterPage } from '../../hooks/usePublicFooterPage';
import { resolveImageUrl } from '../home/utils';

export const NewsroomPage: React.FC = () => {
  const { data, loading, error } = usePublicFooterPage('newsroom');

  return (
    <PublicPageLayout
      title="Newsroom"
      subtitle="Latest news, press releases and announcements from Mygroup"
      accentColor="#0ea5e9"
      loading={loading}
      error={error}
    >
      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-16">No news articles yet.</p>
      ) : (
        <div className="space-y-6">
          {/* Featured first article */}
          {data[0] && (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-sky-100 flex flex-col md:flex-row hover:shadow-md transition-shadow">
              {data[0].image && (
                <div className="md:w-2/5 flex-shrink-0 h-56 md:h-auto overflow-hidden">
                  <img
                    src={resolveImageUrl(data[0].image)}
                    alt={data[0].title || 'News'}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-7 flex flex-col justify-center flex-1">
                <span className="text-xs font-bold uppercase tracking-widest text-sky-500 mb-2">Latest</span>
                {data[0].title && (
                  <h2 className="text-xl font-bold text-gray-900 mb-3 leading-snug">{data[0].title}</h2>
                )}
                {data[0].tag_line && (
                  <p className="text-sm font-medium text-sky-600 mb-3">{data[0].tag_line}</p>
                )}
                {data[0].content && (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{data[0].content}</p>
                )}
                {data[0].url && (
                  <a href={data[0].url} target="_blank" rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-800">
                    Read Full Story →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Remaining articles in grid */}
          {data.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.slice(1).map((item) => (
                <div key={item.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
                  {item.image ? (
                    <div className="h-44 overflow-hidden">
                      <img src={resolveImageUrl(item.image)} alt={item.title || 'News'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-.586-1.414l-3.5-3.5A2 2 0 0015.5 4H15" />
                      </svg>
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    {item.title && <h3 className="text-sm font-bold text-gray-900 mb-1 leading-snug line-clamp-2">{item.title}</h3>}
                    {item.tag_line && <p className="text-xs text-sky-600 mb-2">{item.tag_line}</p>}
                    {item.content && <p className="text-xs text-gray-500 line-clamp-2 flex-1">{item.content}</p>}
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="mt-3 text-xs font-semibold text-sky-600 hover:text-sky-800">Read More →</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PublicPageLayout>
  );
};
