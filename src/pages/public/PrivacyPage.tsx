import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicFooterPage } from '../../hooks/usePublicFooterPage';

export const PrivacyPage: React.FC = () => {
  const { data, loading, error } = usePublicFooterPage('privacy_policy');

  return (
    <PublicPageLayout
      title="Privacy Policy"
      subtitle="How we collect, use and protect your personal information"
      accentColor="#0369a1"
      loading={loading}
      error={error}
    >
      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-16">Privacy Policy content not available.</p>
      ) : (
        <div className="space-y-8">
          {/* Quick summary banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-1">Your Privacy Matters</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                We are committed to protecting your personal data. This policy explains what information we collect,
                how we use it, and your rights regarding your data.
              </p>
            </div>
          </div>

          {data.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {item.title && (
                <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100">{item.title}</h2>
              )}
              {item.content && (
                <div
                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed
                    [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-3
                    [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-blue-800 [&_h2]:mb-2 [&_h2]:mt-5
                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-700 [&_h3]:mb-2 [&_h3]:mt-4
                    [&_p]:mb-3 [&_p]:text-sm [&_p]:leading-relaxed
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
                    [&_li]:text-sm [&_li]:mb-1
                    [&_a]:text-blue-600 [&_a]:hover:underline"
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
