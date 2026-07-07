import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicFooterPage } from '../../hooks/usePublicFooterPage';

export const ContactPage: React.FC = () => {
  const { data, loading, error } = usePublicFooterPage('contact_us');
  const contactItem = data[0] ?? null;

  return (
    <PublicPageLayout
      title="Contact Us"
      subtitle="Get in touch with us — we'd love to hear from you"
      accentColor="#059669"
      loading={loading}
      error={error}
    >
      <div className="max-w-3xl mx-auto">
        {contactItem?.content ? (
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-7">
            <h3 className="text-base font-bold text-emerald-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Contact Information
            </h3>
            <div
              className="prose prose-sm max-w-none text-gray-700
                [&_p]:mb-2 [&_p]:text-sm [&_p]:leading-relaxed
                [&_a]:text-emerald-600 [&_a]:hover:underline
                [&_b]:font-semibold [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: contactItem.content }}
            />
          </div>
        ) : (
          !loading && (
            <p className="text-center text-slate-400 py-16">
              Contact information will be available soon.
            </p>
          )
        )}
      </div>
    </PublicPageLayout>
  );
};
