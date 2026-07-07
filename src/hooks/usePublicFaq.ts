import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  order_index?: number;
}

interface UsePublicFaqResult {
  faqs: FaqItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePublicFaq = (): UsePublicFaqResult => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/home/faq`);
      if (response.data.success) {
        setFaqs(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to load FAQs');
      }
    } catch {
      setError('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { faqs, loading, error, refetch: fetchData };
};
