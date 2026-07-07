import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicFooterPage } from '../../hooks/usePublicFooterPage';
import { resolveImageUrl } from '../home/utils';

const StarRating: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} className={`w-4 h-4 ${i < count ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export const TestimonialsPage: React.FC = () => {
  const { data, loading, error } = usePublicFooterPage('testimonials');

  return (
    <PublicPageLayout
      title="Testimonials"
      subtitle="What our clients and partners say about us"
      accentColor="#f59e0b"
      loading={loading}
      error={error}
    >
      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-16">No testimonials yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow"
            >
              {/* Quote icon */}
              <svg className="w-8 h-8 text-amber-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>

              {/* Testimonial text */}
              {item.content && (
                <p className="text-sm text-gray-600 leading-relaxed italic flex-1">&ldquo;{item.content}&rdquo;</p>
              )}
              {!item.content && item.tag_line && (
                <p className="text-sm text-gray-600 leading-relaxed italic flex-1">&ldquo;{item.tag_line}&rdquo;</p>
              )}

              <StarRating count={5} />

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                {item.image ? (
                  <img
                    src={resolveImageUrl(item.image)}
                    alt={item.title || 'Testimonial'}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-amber-100"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {item.title?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.title || 'Anonymous'}</p>
                  {item.tag_line && item.content && (
                    <p className="text-xs text-amber-600">{item.tag_line}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PublicPageLayout>
  );
};
