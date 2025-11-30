import React from 'react';

export default function GridLayout({ 
  children,
  cols = 3,
  gap = 'gap-6',
  responsive = true
}) {
  const gridCols = responsive 
    ? `grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols}`
    : `grid-cols-${cols}`;

  return (
    <div className={`grid ${gridCols} ${gap}`}>
      {children}
    </div>
  );
}

// Preset: Stats Grid (4 columns)
export function StatsGridLayout({ children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {children}
    </div>
  );
}

// Preset: Card Grid (3 columns)
export function CardGridLayout({ children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  );
}

// Preset: App Grid (4 columns)
export function AppGridLayout({ children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {children}
    </div>
  );
}

// Preset: List Grid (2 columns)
export function ListGridLayout({ children }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {children}
    </div>
  );
}

// Preset: Masonry-like Grid
export function MasonryLayout({ children }) {
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
      {children}
    </div>
  );
}

