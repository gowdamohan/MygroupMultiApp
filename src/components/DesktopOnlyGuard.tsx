import React, { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';
import { useIsMobile } from './ui/use-mobile';

const DARK_MODE_KEY = 'home_dark_mode';

interface DesktopOnlyGuardProps {
  children: React.ReactNode;
}

export const DesktopOnlyGuard: React.FC<DesktopOnlyGuardProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DARK_MODE_KEY) === '1' || document.body.classList.contains('dark-mode');
  });

  useEffect(() => {
    const syncDarkMode = () => {
      setDarkMode(
        localStorage.getItem(DARK_MODE_KEY) === '1' || document.body.classList.contains('dark-mode'),
      );
    };
    syncDarkMode();
    window.addEventListener('storage', syncDarkMode);
    return () => window.removeEventListener('storage', syncDarkMode);
  }, []);

  if (isMobile) {
    const pageBg = darkMode ? 'bg-gray-900' : 'bg-gray-50';
    const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
    const headingText = darkMode ? 'text-white' : 'text-gray-900';
    const mutedText = darkMode ? 'text-gray-400' : 'text-gray-600';

    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 px-4 ${pageBg}`}
      >
        <div
          className={`max-w-md w-full mx-auto px-6 py-10 text-center rounded-2xl shadow-lg transition-colors duration-300 ${cardBg}`}
        >
          <div
            className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
              darkMode ? 'bg-gray-700' : 'bg-purple-50'
            }`}
          >
            <Monitor className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className={`text-xl font-bold mb-3 ${headingText}`}>Desktop Only</h1>
          <p className={`text-sm leading-relaxed ${mutedText}`}>
            This page is only accessible on a desktop device. Please switch to a computer to
            continue.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
