import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { GalleryImageItem } from '../types/home.types';

export interface GalleryAlbum {
  gallery_id: number;
  gallery_name: string;
  gallery_description?: string | null;
  gallery_date?: string | null;
  images: GalleryImageItem[];
}

interface UsePublicGalleryResult {
  albums: GalleryAlbum[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePublicGallery = (): UsePublicGalleryResult => {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/home/gallery`);
      if (response.data.success) {
        setAlbums(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to load gallery');
      }
    } catch {
      setError('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { albums, loading, error, refetch: fetchData };
};
