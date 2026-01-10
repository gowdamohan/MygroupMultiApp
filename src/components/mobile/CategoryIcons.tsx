import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// TV Icon - Classic television shape
export const TVIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
    <polyline points="17 2 12 7 7 2"></polyline>
  </svg>
);

// Radio Icon - Radio waves emanating from source
export const RadioIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
    <circle cx="12" cy="12" r="2"></circle>
    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
    <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path>
  </svg>
);

// E-Paper Icon - Newspaper style
export const EPaperIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
    <path d="M18 14h-8"></path>
    <path d="M15 18h-5"></path>
    <path d="M10 6h8v4h-8V6Z"></path>
  </svg>
);

// Magazine Icon - Stacked pages/book style
export const MagazineIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
    <polyline points="10 2 10 10 13 7 16 10 16 2"></polyline>
  </svg>
);

// Web Icon - Globe/World wide web
export const WebIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

// YouTube Icon - Play button in rounded rectangle
export const YouTubeIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path>
    <polygon points="10 15 15 12 10 9 10 15"></polygon>
  </svg>
);

// Default Category Icon - Generic media icon
export const DefaultCategoryIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
    <polyline points="17 2 12 7 7 2"></polyline>
  </svg>
);

// Helper function to get the appropriate icon based on category name
export const getCategoryIcon = (categoryName: string): React.FC<IconProps> => {
  const name = categoryName?.toLowerCase() || '';
  
  if (name.includes('tv') || name.includes('television')) return TVIcon;
  if (name.includes('radio')) return RadioIcon;
  if (name.includes('e-paper') || name.includes('epaper') || name.includes('newspaper')) return EPaperIcon;
  if (name.includes('magazine')) return MagazineIcon;
  if (name.includes('web') || name.includes('website')) return WebIcon;
  if (name.includes('youtube') || name.includes('video')) return YouTubeIcon;
  
  return DefaultCategoryIcon;
};

