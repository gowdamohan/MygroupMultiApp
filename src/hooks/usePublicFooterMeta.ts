import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { SocialLink } from '../types/home.types';

interface UsePublicFooterMetaResult {
  socialLinks: SocialLink[];
  loading: boolean;
}

export const usePublicFooterMeta = (): UsePublicFooterMetaResult => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/footer/social-media?group_name=corporate`);
        const rows = response.data.data || [];
        setSocialLinks(
          rows.map((row: { id: number; title: string; url: string }) => ({
            id: row.id,
            group_id: 0,
            platform: row.title || 'link',
            url: row.url || '#',
          }))
        );
      } catch {
        setSocialLinks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMeta();
  }, []);

  return { socialLinks, loading };
};
