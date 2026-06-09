import React, { useState, useCallback } from 'react';
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/70"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed inset-x-3 top-1/2 -translate-y-1/2 z-[111] mx-auto max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Adjust Profile Photo</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="relative w-full h-72 bg-gray-900">
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

            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <ZoomIn size={16} className="text-gray-500 shrink-0" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Drag to reposition · Pinch or slide to zoom
              </p>
            </div>

            <div className="flex gap-2 p-4 pt-0">
              <button
                type="button"
                onClick={handleUseOriginal}
                disabled={processing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                <ImageIcon size={16} />
                Use Original
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={processing || !croppedAreaPixels}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
              >
                <Check size={16} />
                {processing ? 'Processing...' : 'Apply Crop'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
