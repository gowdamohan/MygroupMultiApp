import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

interface Ad {
  id: number;
  file_path: string;
  file_url: string;
  link_url: string;
  office_level: string;
  priority?: number;
}

interface PriorityAd {
  slot: number; // 1-4
  ad: Ad | null;
  priority: 'corporate' | 'head_office' | 'regional' | 'branch';
}

interface AdCarouselProps {
  appId: number;
  categoryId: number;
  adSlot: 'ads1' | 'ads2';
  countryId?: number;
  stateId?: number;
  districtId?: number;
  className?: string;
  height?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  // Priority-based 4-slide mode
  priorityMode?: boolean;
  maxSlides?: number;
}

export const AdCarousel: React.FC<AdCarouselProps> = ({
  appId,
  categoryId,
  adSlot,
  countryId,
  stateId,
  districtId,
  className = '',
  height = 'h-32',
  autoPlay = true,
  autoPlayInterval = 5000,
  priorityMode = false,
  maxSlides = 4
}) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [priorityAds, setPriorityAds] = useState<PriorityAd[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Priority order: corporate > head_office > regional > branch
  const priorityOrder: ('corporate' | 'head_office' | 'regional' | 'branch')[] = [
    'corporate', 'head_office', 'regional', 'branch'
  ];

  useEffect(() => {
    fetchAds();
  }, [appId, categoryId, adSlot, countryId, stateId, districtId]);

  useEffect(() => {
    const displayAds = priorityMode ? priorityAds.filter(p => p.ad !== null) : ads;
    if (!autoPlay || displayAds.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % displayAds.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, ads.length, priorityAds, priorityMode]);

  const fetchAds = async () => {
    try {
      const params: Record<string, any> = {
        app_id: appId,
        app_category_id: categoryId,
        ad_slot: adSlot
      };
      if (countryId) params.country_id = countryId;
      if (stateId) params.state_id = stateId;
      if (districtId) params.district_id = districtId;

      const response = await axios.get(`${API_BASE_URL}/advertisement/display`, { params });
      if (response.data.success) {
        const fetchedAds: Ad[] = response.data.data;
        setAds(fetchedAds);

        // If priority mode, organize ads by priority
        if (priorityMode) {
          const organized: PriorityAd[] = priorityOrder.slice(0, maxSlides).map((priority, index) => {
            const ad = fetchedAds.find(a => a.office_level === priority) || null;
            return { slot: index + 1, ad, priority };
          });
          setPriorityAds(organized);
        }
      }
    } catch (err) {
      console.error('Error fetching ads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = async (ad: Ad) => {
    // Track click
    try {
      await axios.post(`${API_BASE_URL}/advertisement/ads/${ad.id}/click`);
    } catch (err) {
      console.error('Error tracking click:', err);
    }
    // Navigate to link
    if (ad.link_url) {
      window.open(ad.link_url, '_blank');
    }
  };

  // Get display ads based on mode
  const displayAds = priorityMode
    ? priorityAds.filter(p => p.ad !== null).map(p => p.ad!)
    : ads;

  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % displayAds.length);
  }, [displayAds.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + displayAds.length) % displayAds.length);
  }, [displayAds.length]);

  // Get priority label for display
  const getPriorityLabel = (level: string) => {
    switch (level) {
      case 'corporate': return 'Corporate';
      case 'head_office': return 'Head Office';
      case 'regional': return 'Regional';
      case 'branch': return 'Branch';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className={`${height} ${className} bg-gray-100 animate-pulse rounded-lg`}></div>
    );
  }

  if (displayAds.length === 0) {
    return null; // Don't show anything if no ads
  }

  return (
    <div className={`relative ${height} ${className} overflow-hidden rounded-lg`}>
      {/* Ads */}
      {displayAds.map((ad, index) => (
        <div
          key={ad.id}
          onClick={() => handleAdClick(ad)}
          className={`absolute inset-0 transition-opacity duration-500 cursor-pointer ${
            index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {ad.file_url ? (
            <img
              src={ad.file_url.startsWith('http') ? ad.file_url : `${BACKEND_URL}${ad.file_url}`}
              alt="Advertisement"
              className="w-full h-full object-cover"
            />
          ) : ad.file_path ? (
            <img
              src={`${BACKEND_URL}${ad.file_path}`}
              alt="Advertisement"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-lg font-medium">Advertisement</span>
            </div>
          )}

          {/* Priority badge in priority mode */}
          {priorityMode && ad.office_level && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
              {getPriorityLabel(ad.office_level)}
            </div>
          )}
        </div>
      ))}

      {/* Navigation Arrows (only if multiple ads) */}
      {displayAds.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicators - show 4 slots in priority mode */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {priorityMode ? (
              // Show 4 priority slots with different colors
              priorityAds.map((pAd, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (pAd.ad) {
                      const actualIndex = displayAds.findIndex(a => a.id === pAd.ad!.id);
                      if (actualIndex >= 0) setCurrentIndex(actualIndex);
                    }
                  }}
                  disabled={!pAd.ad}
                  className={`w-2 h-2 rounded-full transition-all ${
                    pAd.ad && displayAds[currentIndex]?.id === pAd.ad.id
                      ? 'bg-white w-4'
                      : pAd.ad
                      ? 'bg-white/50'
                      : 'bg-gray-500/30'
                  }`}
                  title={`${getPriorityLabel(pAd.priority)}${pAd.ad ? '' : ' (Empty)'}`}
                />
              ))
            ) : (
              displayAds.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Priority mode: Show slot indicators */}
      {priorityMode && displayAds.length > 0 && (
        <div className="absolute top-2 right-2 flex gap-1">
          {priorityAds.map((pAd, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full border-2 ${
                pAd.ad
                  ? displayAds[currentIndex]?.id === pAd.ad.id
                    ? 'bg-green-500 border-green-300'
                    : 'bg-green-500/50 border-green-300/50'
                  : 'bg-gray-400/30 border-gray-300/30'
              }`}
              title={`Slot ${index + 1}: ${getPriorityLabel(pAd.priority)}${pAd.ad ? '' : ' (Empty)'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

