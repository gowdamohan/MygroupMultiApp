import React from 'react';
import { Progress } from '../components/ui/progress';
import type { MediaUploadProgress } from '../utils/mediaDocumentUpload';

interface MediaDocumentUploadProgressProps {
  progress: MediaUploadProgress;
  className?: string;
}

export const MediaDocumentUploadProgress: React.FC<MediaDocumentUploadProgressProps> = ({
  progress,
  className = '',
}) => (
  <div className={`w-full space-y-2 ${className}`}>
    <Progress value={progress.percent} className="h-2 bg-teal-100" />
    <p className="text-sm text-gray-500 text-center">
      {progress.label} {progress.percent}%
    </p>
  </div>
);

export default MediaDocumentUploadProgress;
