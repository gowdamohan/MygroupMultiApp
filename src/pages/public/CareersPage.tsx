import React from 'react';
import { Link } from 'react-router-dom';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicFooterPage } from '../../hooks/usePublicFooterPage';
import { resolveImageUrl } from '../home/utils';

export const CareersPage: React.FC = () => {
  const { data, loading, error } = usePublicFooterPage('careers');

  return (
    <PublicPageLayout
      title="Careers"
      subtitle="Join our team and build the future with Mygroup"
      accentColor="#10b981"
      loading={loading}
      error={error}
    >
      {data.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-emerald-100 items-center justify-center mb-4">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-400">No open positions listed yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {data.map((job) => (
            <article
              key={job.id}
              className="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row"
            >
              {job.image && (
                <div className="md:w-56 flex-shrink-0 h-44 md:h-auto overflow-hidden">
                  <img
                    src={resolveImageUrl(job.image)}
                    alt={job.title || 'Career'}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-3">
                  {job.title && (
                    <h3 className="text-lg font-bold text-gray-900 leading-snug">{job.title}</h3>
                  )}
                  <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Open
                  </span>
                </div>
                {job.tag_line && (
                  <p className="text-sm font-medium text-emerald-600 mb-3">{job.tag_line}</p>
                )}
                {job.content && (
                  <div
                    className="prose prose-sm max-w-none text-gray-600 flex-1
                      [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: job.content }}
                  />
                )}
                {job.url ? (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Apply Now
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                ) : (
                  <Link
                    to="/contact"
                    className="mt-4 inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-colors"
                  >
                    Contact Us to Apply
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </PublicPageLayout>
  );
};
