import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Cropper, { Area } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Check, ImageIcon } from 'lucide-react';
import { getCroppedImageBlob, blobToFile } from '../../utils/cropImage';

interface ProfilePhotoCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onConfirm: (file: File, previewUrl: string) => void;
  onUseOriginal: (file: File, previewUrl: string) => void;
}

export const ProfilePhotoCropModal: React.FC<ProfilePhotoCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onConfirm,
  onUseOriginal,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      const file = blobToFile(blob, `profile-${Date.now()}.jpg`);
      const previewUrl = URL.createObjectURL(blob);
      onConfirm(file, previewUrl);
    } catch {
      alert('Failed to crop image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUseOriginal = async () => {
    setProcessing(true);
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const ext = blob.type.includes('png') ? 'png' : 'jpg';
      const file = blobToFile(blob, `profile-original-${Date.now()}.${ext}`);
      const previewUrl = imageSrc.startsWith('blob:') || imageSrc.startsWith('data:')
        ? imageSrc
        : URL.createObjectURL(blob);
      onUseOriginal(file, previewUrl);
    } catch {
      alert('Failed to load image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/70"
            onClick={onClose}
          />
          <div
            className="fixed inset-0 z-[201] flex items-end justify-center px-2 pb-2 sm:items-center sm:px-2 sm:pb-2"
            style={{
              paddingBottom: 'max(0.5rem, calc(0.5rem + env(safe-area-inset-bottom, 0px)))',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="flex max-h-[min(88dvh,88vh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-photo-crop-title"
            >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 id="profile-photo-crop-title" className="font-semibold text-gray-800">
                Adjust Profile Photo
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 transition-colors hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Crop area — scales down on short viewports */}
            <div className="relative w-full shrink-0 bg-gray-900 h-[min(42dvh,280px)] min-h-[160px] max-h-[320px] sm:h-[min(36dvh,288px)]">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom — compact on small screens */}
            <div className="shrink-0 border-t border-gray-100 px-4 py-2.5">
              <div className="flex items-center gap-3">
                <ZoomIn size={16} className="shrink-0 text-gray-500" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-teal-600"
                  aria-label="Zoom"
                />
              </div>
              <p className="mt-1.5 text-center text-[11px] text-gray-400 sm:text-xs">
                Drag to reposition · Pinch or slide to zoom
              </p>
            </div>

            {/* Actions — always visible; safe-area for notched / home-indicator devices */}
            <div
              className="flex shrink-0 gap-2 border-t border-gray-100 bg-white px-4 pb-4 pt-3"
            >
              <button
                type="button"
                onClick={handleUseOriginal}
                disabled={processing}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ImageIcon size={16} className="shrink-0" />
                <span className="truncate">Use Original</span>
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={processing}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-600 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                <Check size={16} className="shrink-0" />
                <span className="truncate">{processing ? 'Processing...' : 'Apply Crop'}</span>
              </button>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
