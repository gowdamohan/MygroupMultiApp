import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicFaq } from '../../hooks/usePublicFaq';

export const FaqPage: React.FC = () => {
  const { faqs, loading, error } = usePublicFaq();
  const [openId, setOpenId] = useState<number | null>(null);

  const toggle = (id: number) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <PublicPageLayout
      title="Frequently Asked Questions"
      subtitle="Find answers to common questions about Mygroup"
      accentColor="#7c3aed"
      loading={loading}
      error={error}
    >
      {faqs.length === 0 ? (
        <p className="text-center text-gray-400 py-16">No FAQs added yet.</p>
      ) : (
        <div className="space-y-3 max-w-3xl mx-auto">
          {faqs.map((faq, idx) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`bg-white rounded-2xl border transition-all duration-200 ${
                  isOpen ? 'border-violet-200 shadow-md' : 'border-gray-100 shadow-sm hover:border-violet-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                    isOpen ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-600'
                  }`}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-gray-900 leading-snug">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 text-violet-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pl-[4.5rem]">
                    <div
                      className="prose prose-sm max-w-none text-gray-600 leading-relaxed
                        [&_p]:mb-2 [&_a]:text-violet-600 [&_a]:hover:underline"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Help CTA */}
      <div className="mt-12 text-center bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100 p-8">
        <h3 className="text-base font-bold text-gray-900 mb-2">Still have questions?</h3>
        <p className="text-sm text-gray-500 mb-4">Our team is happy to help you with anything not covered here.</p>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </PublicPageLayout>
  );
};
