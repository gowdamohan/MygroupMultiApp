import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string;
  height?: string;
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'rectangular',
  width = '100%',
  height = '20px',
  count = 1,
  className = ''
}) => {
  const baseStyles = 'shimmer bg-gray-200 animate-pulse';
  
  const variants = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-2xl h-64'
  };
  
  const skeleton = (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={{ width, height: variant !== 'text' && variant !== 'card' ? height : undefined }}
    />
  );
  
  if (count === 1) {
    return skeleton;
  }
  
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{skeleton}</div>
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 shadow-lg">
    <div className="flex items-center gap-4 mb-4">
      <SkeletonLoader variant="circular" width="48px" height="48px" />
      <div className="flex-1">
        <SkeletonLoader variant="text" width="60%" />
        <SkeletonLoader variant="text" width="40%" className="mt-2" />
      </div>
    </div>
    <SkeletonLoader variant="rectangular" height="120px" />
  </div>
);

export const SkeletonTable: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 shadow-lg">
    <SkeletonLoader variant="text" width="30%" height="24px" className="mb-4" />
    <SkeletonLoader count={5} className="mb-3" />
  </div>
);
