import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { HomeData } from '../types/home.types';

interface UseHomeDataResult {
  data: HomeData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useHomeData = (): UseHomeDataResult => {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHomeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/home/mobile-data`);
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load home data');
      }
    } catch (err) {
      console.error('Error fetching home data:', err);
      setError('Failed to load home data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  return { data, loading, error, refetch: fetchHomeData };
};
