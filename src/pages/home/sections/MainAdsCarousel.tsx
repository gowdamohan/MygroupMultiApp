import React, { useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import { MainAds } from '../../../types/home.types';
import { resolveImageUrl } from '../utils';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface MainAdsCarouselProps {
  ads: MainAds;
  darkMode?: boolean;
}

export const MainAdsCarousel: React.FC<MainAdsCarouselProps> = ({ ads, darkMode = false }) => {
  const slides = useMemo(() => {
    if (!ads) return [];
    const items: { image: string; url?: string; key: string }[] = [];
    if (ads.ads1) items.push({ image: ads.ads1, url: ads.ads1_url, key: 'ads1' });
    if (ads.ads2) items.push({ image: ads.ads2, url: ads.ads2_url, key: 'ads2' });
    if (ads.ads3) items.push({ image: ads.ads3, url: ads.ads3_url, key: 'ads3' });
    return items;
  }, [ads]);

  if (!slides.length) return null;

  const sectionClass = darkMode ? 'home-section-alt' : 'bg-gray-50';

  return (
    <section className={`py-10 md:py-14 px-4 md:px-8 ${sectionClass}`}>
      <div className="max-w-5xl mx-auto">
        <h2 className={`text-xl md:text-2xl font-bold text-center mb-8 home-text-primary ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Featured
        </h2>
        <Swiper
          modules={[Pagination, Autoplay, Navigation]}
          pagination={{ clickable: true }}
          navigation
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={slides.length > 1}
          className="home-swiper main-ads-carousel rounded-xl overflow-hidden"
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.key}>
              <a
                href={slide.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <img
                  src={resolveImageUrl(slide.image)}
                  alt="Advertisement"
                  className="w-full h-48 md:h-72 lg:h-80 object-cover rounded-xl"
                />
              </a>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};
