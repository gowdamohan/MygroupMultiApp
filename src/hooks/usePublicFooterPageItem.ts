import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { FooterPageItem } from '../types/home.types';

export interface FooterPageDetail extends FooterPageItem {
  extra_images?: { id: number; image: string | null }[];
}

interface UsePublicFooterPageItemResult {
  item: FooterPageDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePublicFooterPageItem = (
  type: string,
  id: string | undefined
): UsePublicFooterPageItemResult => {
  const [item, setItem] = useState<FooterPageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!type || !id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/home/page/${type}/${id}`);
      if (response.data.success) {
        setItem(response.data.data || null);
      } else {
        setError(response.data.message || 'Failed to load content');
      }
    } catch {
      setError('Content not found');
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { item, loading, error, refetch: fetchData };
};
