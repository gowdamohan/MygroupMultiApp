import React from 'react';

interface UploadProgressBarProps {
  percent: number;
  label?: string;
  className?: string;
}

export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  percent,
  label,
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const displayLabel =
    label ?? (clamped < 35 ? 'Uploading file…' : clamped < 100 ? 'Processing pages…' : 'Complete');

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{displayLabel}</span>
        <span className="font-semibold tabular-nums text-teal-700">{clamped}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-teal-600 transition-all duration-300 ease-out"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};
