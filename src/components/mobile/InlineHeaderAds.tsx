import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeaderAd {
  id: number;
  image: string;
  title: string;
  url: string;
}

interface InlineHeaderAdsProps {
  ads: HeaderAd[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}

export const InlineHeaderAds: React.FC<InlineHeaderAdsProps> = ({
  ads,
  currentIndex,
  onPrev,
  onNext,
  onSelect,
}) => {
  if (!ads.length) {
    return (
      <div className="w-full max-w-2xl h-12 md:h-14 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-100/80 flex items-center justify-center">
        <span className="text-xs text-gray-400 font-medium">Featured promotions</span>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto group">
      <div className="relative h-12 md:h-14 rounded-xl overflow-hidden ring-1 ring-gray-200/80 shadow-sm bg-gray-100">
        {ads.map((ad, index) => (
          <a
            key={`header-ad-${ad.id}-${index}`}
            href={ad.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
          </a>
        ))}

        {ads.length > 1 && (
          <>
            <button
              type="button"
              onClick={onPrev}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-white/90 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous ad"
            >
              <ChevronLeft size={14} className="text-gray-700" />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-white/90 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next ad"
            >
              <ChevronRight size={14} className="text-gray-700" />
            </button>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 flex gap-1">
              {ads.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onSelect(index)}
                  className={`h-1 rounded-full transition-all ${
                    index === currentIndex ? 'w-3 bg-white' : 'w-1 bg-white/60'
                  }`}
                  aria-label={`Go to ad ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
