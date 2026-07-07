import React, { useState } from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicGallery } from '../../hooks/usePublicGallery';
import { resolveImageUrl } from '../home/utils';

export const GalleryPage: React.FC = () => {
  const { albums, loading, error } = usePublicGallery();
  const [activeAlbumId, setActiveAlbumId] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const activeAlbum = albums.find((a) => a.gallery_id === activeAlbumId) ?? albums[0] ?? null;
  const images = activeAlbum?.images ?? [];

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch { return dateStr; }
  };

  return (
    <PublicPageLayout
      title="Gallery"
      subtitle="Explore moments from our events, programmes, and milestones"
      accentColor="#ec4899"
      loading={loading}
      error={error}
    >
      {albums.length === 0 ? (
        <p className="text-center text-gray-400 py-16">No gallery albums yet.</p>
      ) : (
        <div className="space-y-8">
          {/* Album tabs */}
          <div className="flex flex-wrap gap-2">
            {albums.map((album) => (
              <button
                key={album.gallery_id}
                type="button"
                onClick={() => setActiveAlbumId(album.gallery_id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  (activeAlbum?.gallery_id === album.gallery_id)
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:text-pink-600'
                }`}
              >
                {album.gallery_name || `Album ${album.gallery_id}`}
              </button>
            ))}
          </div>

          {/* Album header */}
          {activeAlbum && (
            <div className="bg-white rounded-2xl border border-pink-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">{activeAlbum.gallery_name}</h2>
              {activeAlbum.gallery_date && (
                <p className="text-sm text-pink-500 mt-1 font-medium">{formatDate(activeAlbum.gallery_date)}</p>
              )}
              {activeAlbum.gallery_description && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{activeAlbum.gallery_description}</p>
              )}
            </div>
          )}

          {/* Image grid */}
          {images.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No images in this album.</p>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {images.map((img) => (
                <button
                  key={img.image_id}
                  type="button"
                  onClick={() => img.image_name && setLightboxImage(img.image_name)}
                  className="block w-full break-inside-avoid group rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all"
                >
                  {img.image_name ? (
                    <img
                      src={resolveImageUrl(img.image_name)}
                      alt={img.image_description || 'Gallery image'}
                      className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-48 bg-pink-50 flex items-center justify-center">
                      <span className="text-pink-300 text-sm">No image</span>
                    </div>
                  )}
                  {img.image_description && (
                    <p className="text-xs text-gray-500 p-3 bg-white text-left">{img.image_description}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
          onKeyDown={(e) => e.key === 'Escape' && setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none"
            onClick={() => setLightboxImage(null)}
            aria-label="Close"
          >
            &times;
          </button>
          <img
            src={resolveImageUrl(lightboxImage)}
            alt="Gallery"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </PublicPageLayout>
  );
};
