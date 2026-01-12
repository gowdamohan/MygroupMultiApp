import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, BACKEND_URL } from '../../config/api.config';

interface HeaderAd {
  id: number;
  file_path: string;
  file_url: string;
  link_url: string;
  office_level: string;
}

interface HeaderAdsProps {
  appId: number;
  categoryId: number;
  countryId?: number;
  stateId?: number;
  districtId?: number;
  className?: string;
}

export const HeaderAds: React.FC<HeaderAdsProps> = ({
  appId,
  categoryId,
  countryId,
  stateId,
  districtId,
  className = ''
}) => {
  const [ads1, setAds1] = useState<HeaderAd[]>([]);
  const [ads2, setAds2] = useState<HeaderAd[]>([]);
  const [currentIndex1, setCurrentIndex1] = useState(0);
  const [currentIndex2, setCurrentIndex2] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, [appId, categoryId, countryId, stateId, districtId]);

  useEffect(() => {
    if (ads1.length <= 1 && ads2.length <= 1) return;

    const interval = setInterval(() => {
      if (ads1.length > 1) setCurrentIndex1(prev => (prev + 1) % ads1.length);
      if (ads2.length > 1) setCurrentIndex2(prev => (prev + 1) % ads2.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [ads1.length, ads2.length]);

  const fetchAds = async () => {
    try {
      const params: Record<string, any> = {
        app_id: appId,
        app_category_id: categoryId
      };
      if (countryId) params.country_id = countryId;
      if (stateId) params.state_id = stateId;
      if (districtId) params.district_id = districtId;

      const [res1, res2] = await Promise.all([
        axios.get(`${API_BASE_URL}/advertisement/display`, { params: { ...params, ad_slot: 'ads1' } }),
        axios.get(`${API_BASE_URL}/advertisement/display`, { params: { ...params, ad_slot: 'ads2' } })
      ]);

      if (res1.data.success) setAds1(res1.data.data);
      if (res2.data.success) setAds2(res2.data.data);
    } catch (err) {
      console.error('Error fetching header ads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = async (ad: HeaderAd) => {
    try {
      await axios.post(`${API_BASE_URL}/advertisement/ads/${ad.id}/click`);
    } catch (err) {
      console.error('Error tracking click:', err);
    }
    if (ad.link_url) {
      window.open(ad.link_url, '_blank');
    }
  };

  const renderAdSlot = (ads: HeaderAd[], currentIndex: number, placeholder: string) => {
    if (loading) {
      return <div className="flex-1 h-20 bg-gray-100 animate-pulse rounded-lg"></div>;
    }

    if (ads.length === 0) {
      return (
        <div className="flex-1 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-400 text-sm">{placeholder}</span>
        </div>
      );
    }

    const ad = ads[currentIndex];
    const imgSrc = ad.file_url?.startsWith('http') 
      ? ad.file_url 
      : `${BACKEND_URL}${ad.file_url || ad.file_path}`;

    return (
      <div
        onClick={() => handleAdClick(ad)}
        className="flex-1 h-20 overflow-hidden rounded-lg cursor-pointer relative"
      >
        <img
          src={imgSrc}
          alt="Header Ad"
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
        {ads.length > 1 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {ads.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex gap-4 ${className}`}>
      {renderAdSlot(ads1, currentIndex1, 'Ad Slot 1')}
      {renderAdSlot(ads2, currentIndex2, 'Ad Slot 2')}
    </div>
  );
};

