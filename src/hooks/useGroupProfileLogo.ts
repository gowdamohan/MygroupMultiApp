import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

interface UseGroupProfileLogoResult {
  logoUrl: string | null;
  loading: boolean;
}

/**
 * Fetches my_group_profile.logo as a Wasabi signed URL for the desktop header.
 * Pass `providedLogoUrl` when already available (e.g. from home mobile-data).
 */
export const useGroupProfileLogo = (providedLogoUrl?: string | null): UseGroupProfileLogoResult => {
  const [logoUrl, setLogoUrl] = useState<string | null>(providedLogoUrl || null);
  const [loading, setLoading] = useState(!providedLogoUrl);

  useEffect(() => {
    if (providedLogoUrl) {
      setLogoUrl(providedLogoUrl);
      setLoading(false);
      return;
    }

    const fetchLogo = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/home/group-profile`);
        const profile = response.data?.data;
        setLogoUrl(profile?.logo || null);
      } catch {
        setLogoUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLogo();
  }, [providedLogoUrl]);

  return { logoUrl, loading };
};
