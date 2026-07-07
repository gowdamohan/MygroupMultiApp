import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicFooterPage } from '../../hooks/usePublicFooterPage';

export const TermsPage: React.FC = () => {
  const { data, loading, error } = usePublicFooterPage('terms');

  return (
    <PublicPageLayout
      title="Terms & Conditions"
      subtitle="Please read these terms carefully before using our services"
      accentColor="#475569"
      loading={loading}
      error={error}
    >
      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-16">Terms & Conditions content not available.</p>
      ) : (
        <div className="space-y-8">
          {data.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {item.title && (
                <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100">{item.title}</h2>
              )}
              {item.content && (
                <div
                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed
                    [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-3
                    [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-800 [&_h2]:mb-2 [&_h2]:mt-5
                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-700 [&_h3]:mb-2 [&_h3]:mt-4
                    [&_p]:mb-3 [&_p]:text-sm [&_p]:leading-relaxed
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
                    [&_li]:text-sm [&_li]:mb-1
                    [&_a]:text-teal-600 [&_a]:hover:underline"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </PublicPageLayout>
  );
};
