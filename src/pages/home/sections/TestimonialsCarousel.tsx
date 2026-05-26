import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import { Star } from 'lucide-react';
import { Testimonial } from '../../../types/home.types';
import { resolveImageUrl } from '../utils';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
  darkMode?: boolean;
}

export const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({
  testimonials,
  darkMode = false,
}) => {
  if (!testimonials?.length) return null;

  const sectionClass = darkMode ? 'home-section-light' : 'bg-gray-50';

  return (
    <section id="testimonials" className={`home-section-transition py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12 ${sectionClass}`}>
      <div className="max-w-3xl mx-auto">
        <h2 className={`text-2xl md:text-3xl font-bold text-center mb-10 home-text-primary ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          What Our Clients Say
        </h2>
        <Swiper
          modules={[Pagination, Autoplay, Navigation]}
          pagination={{ clickable: true }}
          navigation
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={testimonials.length > 1}
          className="home-swiper testimonials-carousel"
        >
          {testimonials.map((item) => (
            <SwiperSlide key={item.id}>
              <div
                className={`rounded-2xl shadow-lg p-8 md:p-10 text-center home-card ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                {item.image ? (
                  <img
                    src={resolveImageUrl(item.image)}
                    alt={item.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-6"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                    {item.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      className={star <= (item.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <p className={`text-base md:text-lg italic mb-6 home-text-secondary ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  &ldquo;{item.testimonial}&rdquo;
                </p>
                <h5 className={`font-semibold text-lg home-text-primary ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {item.name}
                </h5>
                {item.designation && (
                  <p className={`text-sm mt-1 home-text-secondary ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.designation}
                  </p>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};
