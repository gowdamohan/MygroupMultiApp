import React, { useState } from 'react';
import { ZoomIn, X } from 'lucide-react';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicGallery } from '../../hooks/usePublicGallery';
import { resolveImageUrl } from '../home/utils';
import '../../styles/home.css';

export const GalleryPage: React.FC = () => {
  const { albums, loading, error } = usePublicGallery();
  const [activeAlbumId, setActiveAlbumId] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; caption?: string | null } | null>(null);

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

          {/* Image grid — same tile pattern as desktop home */}
          {images.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No images in this album.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {images.map((img) => (
                <button
                  key={img.image_id}
                  type="button"
                  onClick={() => img.image_name && setLightboxImage({
                    src: img.image_name,
                    caption: img.image_description,
                  })}
                  className="home-gallery-tile aspect-[4/3]"
                  aria-label={img.image_description || 'View image'}
                >
                  {img.image_name ? (
                    <img
                      src={resolveImageUrl(img.image_name)}
                      alt={img.image_description || 'Gallery image'}
                      className="home-gallery-tile-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-pink-50 flex items-center justify-center">
                      <span className="text-pink-300 text-sm">No image</span>
                    </div>
                  )}
                  <div className="home-gallery-tile-overlay">
                    <span className="home-gallery-tile-zoom">
                      <ZoomIn className="w-5 h-5" />
                    </span>
                    {img.image_description && (
                      <p className="home-gallery-tile-caption">{img.image_description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-8"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setLightboxImage(null)}
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={resolveImageUrl(lightboxImage.src)}
              alt={lightboxImage.caption || 'Gallery'}
              className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            {lightboxImage.caption && (
              <p className="text-center text-white text-sm mt-4 font-medium">{lightboxImage.caption}</p>
            )}
          </div>
        </div>
      )}
    </PublicPageLayout>
  );
};
