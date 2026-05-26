import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import { AboutUs } from '../../../types/home.types';
import { resolveImageUrl } from '../utils';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface AboutUsCarouselProps {
  aboutData: AboutUs[];
  darkMode?: boolean;
}

export const AboutUsCarousel: React.FC<AboutUsCarouselProps> = ({ aboutData, darkMode = false }) => {
  if (!aboutData?.length) return null;

  const sectionClass = darkMode ? 'home-section-light' : 'bg-white';

  return (
    <section className={`home-section-transition py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12 ${sectionClass}`}>
      <div className="max-w-5xl mx-auto">
        <h2 className={`text-xl md:text-2xl font-bold text-center mb-8 home-text-primary ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          About Us
        </h2>
        <Swiper
          modules={[Pagination, Autoplay, Navigation]}
          pagination={{ clickable: true }}
          navigation
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={aboutData.length > 1}
          className="home-swiper about-carousel"
        >
          {aboutData.map((item) => (
            <SwiperSlide key={item.id}>
              <div className="flex flex-col items-center text-center px-4 pb-10">
                {item.image && (
                  <img
                    src={resolveImageUrl(item.image)}
                    alt={item.title}
                    className="w-1/2 max-w-xs mx-auto mb-6 rounded-lg object-cover"
                  />
                )}
                {item.title && (
                  <h3 className={`text-lg font-semibold mb-3 home-text-primary ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.title}
                  </h3>
                )}
                <div
                  className={`text-sm md:text-base max-w-2xl home-text-secondary ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};
