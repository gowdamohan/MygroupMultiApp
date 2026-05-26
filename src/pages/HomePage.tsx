import React, { useState, useEffect } from 'react';
import { MobileHomePage } from './mobile/MobileHomePage';
import { DesktopHomePage } from './home/DesktopHomePage';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

export const HomePage: React.FC = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileHomePage />;
  }

  return <DesktopHomePage />;
};
