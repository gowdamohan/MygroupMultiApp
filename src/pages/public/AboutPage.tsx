import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicFooterPage } from '../../hooks/usePublicFooterPage';
import { resolveImageUrl } from '../home/utils';

export const AboutPage: React.FC = () => {
  const { data, loading, error } = usePublicFooterPage('about_us');

  return (
    <PublicPageLayout
      title="About Us"
      subtitle="Learn more about Mygroup — our story, vision, and values"
      accentColor="#057284"
      loading={loading}
      error={error}
    >
      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-16">No content available.</p>
      ) : (
        <div className="space-y-10">
          {data.map((item, idx) => (
            <section
              key={item.id}
              className={`rounded-2xl overflow-hidden shadow-sm border border-gray-100 ${
                idx % 2 === 0 ? 'bg-white' : 'bg-teal-50/40'
              }`}
            >
              <div className="flex flex-col md:flex-row">
                {item.image && (
                  <div className="md:w-72 flex-shrink-0">
                    <img
                      src={resolveImageUrl(item.image)}
                      alt={item.title || 'About Us'}
                      className="w-full h-52 md:h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-7 flex-1">
                  {item.title && (
                    <h2 className="text-xl font-bold text-[#057284] mb-3 border-l-4 border-[#057284] pl-3">
                      {item.title}
                    </h2>
                  )}
                  {item.tag_line && (
                    <p className="text-sm font-medium text-gray-500 italic mb-4">{item.tag_line}</p>
                  )}
                  {item.content && (
                    <div
                      className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </PublicPageLayout>
  );
};
