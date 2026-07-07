import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { FooterPageItem } from '../types/home.types';

interface UsePublicFooterPageResult {
  data: FooterPageItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePublicFooterPage = (type: string): UsePublicFooterPageResult => {
  const [data, setData] = useState<FooterPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!type) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/home/page/${type}`);
      if (response.data.success) {
        setData(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to load data');
      }
    } catch {
      setError('Failed to load page content');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
