import React from 'react';
import { Link } from 'react-router-dom';
import { Quote, Star } from 'lucide-react';
import { FooterPageItem, Testimonial } from '../../../types/home.types';
import { resolveImageUrl } from '../utils';

const HOME_TESTIMONIALS_LIMIT = 6;

interface TestimonialsCarouselProps {
  /** footer_page rows with footer_page_type = 'testimonials' */
  testimonialsList?: FooterPageItem[];
  /** Legacy: testimonials table rows (mobile compat) */
  testimonials?: Testimonial[];
  darkMode?: boolean;
}

export const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({
  testimonialsList,
  testimonials,
  darkMode = false,
}) => {
  const items: {
    id: number;
    name: string;
    designation?: string;
    image?: string;
    text: string;
    rating: number;
  }[] = [];

  if (testimonialsList && testimonialsList.length > 0) {
    testimonialsList.forEach((t) => {
      items.push({
        id: t.id,
        name: t.title || 'Anonymous',
        designation: t.tag_line || undefined,
        image: t.image || undefined,
        text: t.content || '',
        rating: 5,
      });
    });
  } else if (testimonials && testimonials.length > 0) {
    testimonials.forEach((t) => {
      items.push({
        id: t.id,
        name: t.name,
        designation: t.designation,
        image: t.image,
        text: t.testimonial,
        rating: t.rating || 5,
      });
    });
  }

  if (!items.length) return null;

  const latestItems = items.slice(0, HOME_TESTIMONIALS_LIMIT);

  const sectionBg = darkMode ? 'bg-gray-800' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-900/70' : 'bg-white';
  const border = darkMode ? 'border-gray-700' : 'border-gray-200';
  const headTxt = darkMode ? 'text-white' : 'text-gray-900';
  const mutedTxt = darkMode ? 'text-gray-400' : 'text-gray-500';
  const bodyTxt = darkMode ? 'text-gray-300' : 'text-gray-700';

  return (
    <section
      id="testimonials"
      className={`home-section-transition border-b ${border} px-6 py-8 ${sectionBg}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <h3 className={`text-xs font-bold uppercase tracking-widest ${headTxt}`}>
          What Our Clients Say
        </h3>
        <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <Link
          to="/testimonials"
          className="text-[10px] font-semibold uppercase tracking-wider text-[#057284] hover:underline flex-shrink-0"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {latestItems.map((item) => (
          <article
            key={item.id}
            className={`relative rounded-2xl border ${border} ${cardBg} p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden`}
          >
            <Quote
              size={48}
              className={`absolute top-3 right-3 opacity-[0.08] ${
                darkMode ? 'text-white' : 'text-[#057284]'
              }`}
              aria-hidden
            />

            <div className="flex gap-4 items-start">
              {item.image ? (
                <img
                  src={resolveImageUrl(item.image)}
                  alt={item.name}
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0 ring-2 ring-[#057284]/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-white text-lg font-bold bg-[#057284]">
                  {item.name?.charAt(0) || 'U'}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={
                        star <= item.rating
                          ? 'text-amber-400 fill-amber-400'
                          : darkMode
                            ? 'text-gray-600'
                            : 'text-gray-300'
                      }
                    />
                  ))}
                </div>

                {item.text && (
                  <p className={`text-sm leading-relaxed line-clamp-4 mb-3 ${bodyTxt}`}>
                    &ldquo;{item.text}&rdquo;
                  </p>
                )}

                <h5 className={`font-semibold text-sm ${headTxt}`}>{item.name}</h5>
                {item.designation && (
                  <p className={`text-xs mt-0.5 ${mutedTxt}`}>{item.designation}</p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
