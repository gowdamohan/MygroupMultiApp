import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  fullScreen = false,
  text
}) => {
  const sizes = {
    sm: 20,
    md: 32,
    lg: 48,
    xl: 64
  };
  
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 size={sizes[size]} className="animate-spin text-primary-600" />
      {text && <p className="text-gray-600">{text}</p>}
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }
  
  return spinner;
};
