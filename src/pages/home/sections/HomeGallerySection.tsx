import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Images, ZoomIn, X } from 'lucide-react';
import { GalleryImageItem } from '../../../types/home.types';
import { resolveImageUrl } from '../utils';

const HOME_GALLERY_MAX = 8;
const HOME_GALLERY_MIN = 5;

interface HomeGallerySectionProps {
  images: GalleryImageItem[];
  darkMode: boolean;
}

/** Bento grid cell span per image index (for 5–8 image layouts). */
const BENTO_SPANS: Record<number, string[]> = {
  5: ['hero', '', '', '', ''],
  6: ['hero', '', '', '', '', ''],
  7: ['hero', '', '', '', '', '', ''],
  8: ['hero', '', '', '', '', '', '', ''],
};

export const HomeGallerySection: React.FC<HomeGallerySectionProps> = ({ images, darkMode }) => {
  const [lightbox, setLightbox] = useState<GalleryImageItem | null>(null);

  const displayImages = useMemo(
    () => images.filter((img) => img.image_name).slice(0, HOME_GALLERY_MAX),
    [images]
  );

  if (displayImages.length === 0) return null;

  const count = displayImages.length;
  const useBento = count >= HOME_GALLERY_MIN;
  const bentoClass = useBento ? `home-gallery-bento home-gallery-bento-${Math.min(count, HOME_GALLERY_MAX)}` : `home-gallery-compact home-gallery-compact-${count}`;

  const border = darkMode ? 'border-gray-700' : 'border-gray-100';
  const altBg = darkMode ? 'home-section-alt bg-gray-900' : 'home-section-light bg-white';
  const headTxt = darkMode ? 'text-teal-400' : 'text-[#057284]';

  return (
    <>
      <div className="home-portal-divider" />
      <section className={`border-b ${border} px-6 py-6 ${altBg} home-section-transition`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-pink-900/40' : 'bg-pink-50'}`}>
              <Images className={`w-4 h-4 ${darkMode ? 'text-pink-400' : 'text-pink-500'}`} />
            </div>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-widest ${headTxt}`}>Gallery</h3>
              {displayImages[0]?.gallery_name && (
                <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {displayImages[0].gallery_name}
                </p>
              )}
            </div>
          </div>
          <Link
            to="/gallery"
            className={`text-[10px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              darkMode
                ? 'border-pink-800/60 text-pink-300 hover:bg-pink-900/30'
                : 'border-pink-200 text-pink-600 hover:bg-pink-50'
            }`}
          >
            View All →
          </Link>
        </div>

        {/* Image grid */}
        <div className={bentoClass}>
          {displayImages.map((img, idx) => {
            const spanClass = useBento
              ? (BENTO_SPANS[count]?.[idx] === 'hero' ? 'home-gallery-bento-hero' : '')
              : '';

            return (
              <button
                key={img.image_id}
                type="button"
                onClick={() => setLightbox(img)}
                className={`home-gallery-tile group ${spanClass}`}
                aria-label={img.image_description || 'View gallery image'}
              >
                <img
                  src={resolveImageUrl(img.image_name)}
                  alt={img.image_description || img.gallery_name || 'Gallery'}
                  className="home-gallery-tile-img"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="home-gallery-tile-overlay">
                  <span className="home-gallery-tile-zoom">
                    <ZoomIn className="w-5 h-5" />
                  </span>
                  {img.image_description && (
                    <p className="home-gallery-tile-caption">{img.image_description}</p>
                  )}
                </div>
                {idx === 0 && useBento && (
                  <span className="home-gallery-featured-badge">Featured</span>
                )}
              </button>
            );
          })}

        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-8"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={resolveImageUrl(lightbox.image_name)}
              alt={lightbox.image_description || 'Gallery'}
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            {(lightbox.image_description || lightbox.gallery_name) && (
              <div className="mt-4 text-center">
                {lightbox.image_description && (
                  <p className="text-white text-sm font-medium">{lightbox.image_description}</p>
                )}
                {lightbox.gallery_name && (
                  <p className="text-white/50 text-xs mt-1">{lightbox.gallery_name}</p>
                )}
              </div>
            )}
            <div className="flex justify-center mt-4">
              <Link
                to="/gallery"
                className="px-5 py-2 rounded-full bg-pink-600 text-white text-xs font-semibold hover:bg-pink-700 transition-colors"
              >
                Open Gallery Page
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { HOME_GALLERY_MAX, HOME_GALLERY_MIN };
