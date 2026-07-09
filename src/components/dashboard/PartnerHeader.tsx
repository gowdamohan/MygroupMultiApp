import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Megaphone } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.config';
import {
  applySignedUrlCacheToAds,
  getCachedBlobUrl,
  resolveAdImageSrc,
} from '../../utils/partnerAdCache';

export interface PartnerAd {
  id: number;
  app_id: number;
  image_path: string | null;
  image_url: string | null;
  url: string | null;
  type: 'ads1' | 'ads2' | null;
  slot: number | null;
  is_active: number;
  signed_url?: string | null;
}

interface PartnerHeaderProps {
  fallbackMarqueeText?: string;
  className?: string;
}

const ROTATE_MS = 5000;

const buildSlotAdsFromList = (ads: PartnerAd[], type: 'ads1' | 'ads2') =>
  ads
    .filter(
      (ad) =>
        ad.type === type &&
        ad.is_active === 1 &&
        ad.slot != null &&
        ad.slot >= 1 &&
        ad.slot <= 3 &&
        (ad.signed_url || ad.image_url)
    )
    .sort((a, b) => (a.slot || 0) - (b.slot || 0))
    .slice(0, 3);

const CachedAdImage: React.FC<{
  ad: PartnerAd;
  alt: string;
  className?: string;
}> = ({ ad, alt, className }) => {
  const [src, setSrc] = useState(() => {
    if (ad.image_path) {
      const blob = getCachedBlobUrl(ad.image_path);
      if (blob) return blob;
      const signed = ad.signed_url || ad.image_url || '';
      return signed;
    }
    return ad.signed_url || ad.image_url || '';
  });

  useEffect(() => {
    let cancelled = false;
    resolveAdImageSrc(ad.image_path, ad.signed_url, ad.image_url).then((url) => {
      if (!cancelled && url) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [ad.id, ad.image_path, ad.signed_url, ad.image_url]);

  if (!src) return null;

  return <img src={src} alt={alt} className={className} />;
};

const AdSlotCarousel: React.FC<{ ads: PartnerAd[]; fallbackLabel: string }> = ({
  ads,
  fallbackLabel,
}) => {
  const [index, setIndex] = useState(0);
  const adIdsKey = ads.map((a) => a.id).join(',');

  useEffect(() => {
    setIndex(0);
  }, [adIdsKey]);

  useEffect(() => {
    if (ads.length <= 1) return;

    let interval: ReturnType<typeof setInterval> | null = null;

    const tick = () => setIndex((prev) => (prev + 1) % ads.length);

    const start = () => {
      if (interval || document.hidden) return;
      interval = setInterval(tick, ROTATE_MS);
    };

    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ads.length]);

  // Prefetch all slot images once (served from blob cache on carousel rotation)
  useEffect(() => {
    ads.forEach((ad) => {
      resolveAdImageSrc(ad.image_path, ad.signed_url, ad.image_url).catch(() => {});
    });
  }, [adIdsKey]);

  if (ads.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="text-center text-white">
          <Megaphone className="mx-auto mb-1 opacity-80" size={24} />
          <p className="text-xs font-medium opacity-90">{fallbackLabel}</p>
        </div>
      </div>
    );
  }

  const currentAd = ads[index];

  const image = (
    <CachedAdImage
      ad={currentAd}
      alt={fallbackLabel}
      className="w-full h-full object-cover"
    />
  );

  const content = currentAd.url?.trim() ? (
    <a
      href={currentAd.url.trim()}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full h-full"
    >
      {image}
    </a>
  ) : (
    image
  );

  return (
    <div className="flex-1 relative overflow-hidden min-h-0">
      <div className="absolute inset-0 transition-opacity duration-500">{content}</div>
      {ads.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
          {ads.map((ad, i) => (
            <button
              key={ad.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Show ${fallbackLabel} image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const PartnerHeader: React.FC<PartnerHeaderProps> = ({
  fallbackMarqueeText = 'Welcome to Partner Dashboard',
  className = '',
}) => {
  const [ads1, setAds1] = useState<PartnerAd[]>([]);
  const [ads2, setAds2] = useState<PartnerAd[]>([]);
  const [headerScrollingText, setHeaderScrollingText] = useState('');

  const fetchPartnerAds = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const selectedApp = localStorage.getItem('selectedApp');
      const appId = selectedApp ? JSON.parse(selectedApp).id : 1;

      const response = await axios.get(`${API_BASE_URL}/partner-ads`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { app_id: appId, limit: 100 },
      });

      if (response.data.success) {
        const allAds: PartnerAd[] = applySignedUrlCacheToAds(response.data.data || []);
        const slot1 = applySignedUrlCacheToAds(
          response.data.ads1 || buildSlotAdsFromList(allAds, 'ads1')
        );
        const slot2 = applySignedUrlCacheToAds(
          response.data.ads2 || buildSlotAdsFromList(allAds, 'ads2')
        );
        setAds1(slot1);
        setAds2(slot2);
        setHeaderScrollingText(response.data.header_scrolling_text || '');
      }
    } catch (error) {
      console.error('Error fetching partner ads:', error);
    }
  }, []);

  useEffect(() => {
    fetchPartnerAds();
  }, [fetchPartnerAds]);

  return (
    <div className={`bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 h-full flex flex-col ${className}`}>
      <div className="flex-1 flex gap-1 min-h-0">
        <AdSlotCarousel ads={ads1} fallbackLabel="Ad Space 1" />
        <AdSlotCarousel ads={ads2} fallbackLabel="Ad Space 2" />
      </div>

      <div className="bg-black/20 py-1.5 overflow-hidden flex-shrink-0">
        {headerScrollingText.trim() ? (
          <div className="animate-marquee whitespace-nowrap">
            <span className="text-white text-sm font-medium mx-8">
              {headerScrollingText.trim()}
            </span>
            <span className="text-white text-sm font-medium mx-8">
              {headerScrollingText.trim()}
            </span>
          </div>
        ) : (
          <p className="text-white/60 text-sm text-center">{fallbackMarqueeText}</p>
        )}
      </div>
    </div>
  );
};
