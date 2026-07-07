import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicFooterPageItem } from '../../hooks/usePublicFooterPageItem';
import { resolveImageUrl } from '../home/utils';

interface FooterDetailConfig {
  type: string;
  title: string;
  listPath: string;
  listLabel: string;
  accentColor: string;
}

const CONFIGS: Record<string, FooterDetailConfig> = {
  newsroom: {
    type: 'newsroom',
    title: 'Newsroom',
    listPath: '/newsroom',
    listLabel: 'Newsroom',
    accentColor: '#0ea5e9',
  },
  awards: {
    type: 'awards',
    title: 'Awards',
    listPath: '/awards',
    listLabel: 'Awards & Recognition',
    accentColor: '#d97706',
  },
  events: {
    type: 'events',
    title: 'Events',
    listPath: '/events',
    listLabel: 'Events',
    accentColor: '#6366f1',
  },
};

interface FooterDetailPageProps {
  pageKey: keyof typeof CONFIGS;
}

export const FooterDetailPage: React.FC<FooterDetailPageProps> = ({ pageKey }) => {
  const { id } = useParams<{ id: string }>();
  const config = CONFIGS[pageKey];
  const { item, loading, error } = usePublicFooterPageItem(config.type, id);

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
      title={item?.title || config.title}
      subtitle={item?.tag_line || undefined}
      accentColor={config.accentColor}
      loading={loading}
      error={error}
    >
      {!item && !loading && !error ? (
        <p className="text-center text-gray-400 py-16">Content not found.</p>
      ) : item ? (
        <article className="max-w-4xl mx-auto">
          {/* Breadcrumb back link */}
          <Link
            to={config.listPath}
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 hover:opacity-80 transition-opacity"
            style={{ color: config.accentColor }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {config.listLabel}
          </Link>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            {item.year && (
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full"
                style={{ backgroundColor: `${config.accentColor}18`, color: config.accentColor }}>
                {item.year}
              </span>
            )}
            {item.event_date && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(item.event_date)}
              </span>
            )}
          </div>

          {/* Hero image */}
          {item.image && (
            <div className="rounded-2xl overflow-hidden shadow-md mb-8 border border-gray-100">
              <img
                src={resolveImageUrl(item.image)}
                alt={item.title || config.title}
                className="w-full max-h-[420px] object-cover"
              />
            </div>
          )}

          {/* Content body */}
          {item.content ? (
            <div
              className="prose prose-base max-w-none text-gray-700 leading-relaxed bg-white rounded-2xl border border-gray-100 p-7 shadow-sm
                [&_p]:mb-4 [&_img]:rounded-xl [&_a]:hover:underline"
              style={{ '--tw-prose-links': config.accentColor } as React.CSSProperties}
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          ) : (
            <p className="text-gray-400 text-center py-8">No content available.</p>
          )}

          {/* Extra images (events) */}
          {item.extra_images && item.extra_images.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Gallery</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {item.extra_images.map((img) => (
                  img.image ? (
                    <img
                      key={img.id}
                      src={resolveImageUrl(img.image)}
                      alt="Event"
                      className="w-full h-40 object-cover rounded-xl border border-gray-100 shadow-sm"
                    />
                  ) : null
                ))}
              </div>
            </div>
          )}

          {/* External link */}
          {item.url && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-colors"
                style={{ backgroundColor: config.accentColor }}
              >
                Learn More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </article>
      ) : null}
    </PublicPageLayout>
  );
};

export const NewsroomDetailPage: React.FC = () => <FooterDetailPage pageKey="newsroom" />;
export const AwardsDetailPage: React.FC = () => <FooterDetailPage pageKey="awards" />;
export const EventsDetailPage: React.FC = () => <FooterDetailPage pageKey="events" />;
