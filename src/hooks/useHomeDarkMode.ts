import { useState, useEffect } from 'react';

export const HOME_DARK_MODE_KEY = 'home_dark_mode';

export const useHomeDarkMode = () => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(HOME_DARK_MODE_KEY) === '1';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem(HOME_DARK_MODE_KEY, darkMode ? '1' : '0');
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return { darkMode, toggleDarkMode };
};
