import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import { Awards, Events, Gallery, Newsroom } from '../../../types/home.types';
import { resolveImageUrl, truncateText } from '../utils';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface FooterContentCarouselProps {
  newsroom?: Newsroom | null;
  awards?: Awards | null;
  event?: Events | null;
  gallery?: Gallery | null;
  darkMode?: boolean;
}

export const FooterContentCarousel: React.FC<FooterContentCarouselProps> = ({
  newsroom,
  awards,
  event,
  gallery,
  darkMode = false,
}) => {
  const slides = useMemo(() => {
    const items: { key: string; title: string; description: string; image: string; link: string; linkLabel: string }[] = [];

    if (newsroom) {
      items.push({
        key: 'newsroom',
        title: newsroom.title,
        description: truncateText(newsroom.description),
        image: newsroom.image,
        link: `/newsroom/${newsroom.id}`,
        linkLabel: 'Read More',
      });
    }
    if (awards) {
      items.push({
        key: 'awards',
        title: awards.title,
        description: truncateText(awards.description),
        image: awards.image,
        link: `/awards/${awards.id}`,
        linkLabel: 'Read More',
      });
    }
    if (event) {
      items.push({
        key: 'events',
        title: event.title,
        description: truncateText(event.description),
        image: event.image,
        link: `/events/${event.id}`,
        linkLabel: 'Read More',
      });
    }
    if (gallery) {
      items.push({
        key: 'gallery',
        title: gallery.title || 'Latest Gallery',
        description: gallery.description ? truncateText(gallery.description) : '',
        image: gallery.image_name,
        link: '/gallery',
        linkLabel: 'View Gallery',
      });
    }
    return items;
  }, [newsroom, awards, event, gallery]);

  if (!slides.length) return null;

  const sectionClass = darkMode ? 'home-section-light' : 'bg-white';

  return (
    <section className={`home-section-transition py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12 ${sectionClass}`}>
      <div className="max-w-4xl mx-auto">
        <h2 className={`text-xl md:text-2xl font-bold text-center mb-8 home-text-primary ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Latest Updates
        </h2>
        <Swiper
          modules={[Pagination, Autoplay, Navigation]}
          pagination={{ clickable: true }}
          navigation
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={slides.length > 1}
          className="home-swiper footer-carousel"
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.key}>
              <div className="flex flex-col items-center text-center px-4 pb-10">
                {slide.image && (
                  <img
                    src={resolveImageUrl(slide.image)}
                    alt={slide.title}
                    className="w-full max-w-lg h-48 md:h-56 object-cover rounded-xl mb-6"
                  />
                )}
                <h4 className={`text-lg font-semibold mb-3 home-text-primary ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {slide.title}
                </h4>
                {slide.description && (
                  <p className={`text-sm mb-4 max-w-xl home-text-secondary ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {slide.description}
                  </p>
                )}
                <Link
                  to={slide.link}
                  className="inline-flex px-6 py-2 rounded-full text-white font-medium home-gradient-bg"
                >
                  {slide.linkLabel}
                </Link>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};
