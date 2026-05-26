import React, { useState, useEffect } from 'react';
import { MobileHeader, getMobileHeaderHeight } from '../../components/mobile/MobileHeader';
import { useHomeData } from '../../hooks/useHomeData';
import { MyAppsSection } from './sections/MyAppsSection';
import { AboutUsCarousel } from './sections/AboutUsCarousel';
import { AppGridSection } from './sections/AppGridSection';
import { FooterContentCarousel } from './sections/FooterContentCarousel';
import { NavigationButtons } from './sections/NavigationButtons';
import { TestimonialsCarousel } from './sections/TestimonialsCarousel';
import { HomeFooter } from './sections/HomeFooter';
import '../../styles/home.css';

const DARK_MODE_KEY = 'home_dark_mode';
const DESKTOP_HEADER_OFFSET = getMobileHeaderHeight(false, true, true, 'desktop', 'home');

export const DesktopHomePage: React.FC = () => {
  const { data: homeData, loading, error } = useHomeData();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DARK_MODE_KEY) === '1';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem(DARK_MODE_KEY, darkMode ? '1' : '0');
    return () => {
      document.body.classList.remove('dark-mode');
    };
  }, [darkMode]);

  const pageBg = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const mutedText = darkMode ? 'text-gray-400' : 'text-gray-600';

  if (loading) {
    return (
      <div className={`desktop-home flex items-center justify-center min-h-screen transition-colors duration-300 ${pageBg}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-200 border-t-purple-600" />
          <p className={`text-sm font-medium ${mutedText}`}>Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (error || !homeData) {
    return (
      <div className={`desktop-home flex items-center justify-center min-h-screen transition-colors duration-300 ${pageBg}`}>
        <p className={mutedText}>{error || 'No data available'}</p>
      </div>
    );
  }

  return (
    <div className={`desktop-home min-h-screen transition-colors duration-300 ${pageBg}`}>
      <MobileHeader
        appName="mymedia"
        variant="desktop"
        desktopLayout="home"
        darkMode={darkMode}
        showTopIcons={false}
        showAds
        showDarkModeToggle={false}
        showProfileButton={false}
        showSettingsButton={false}
        showAppDownloadButtons
      />

      <main
        style={{ paddingTop: `${DESKTOP_HEADER_OFFSET}px` }}
        className="desktop-home-main transition-colors duration-300"
      >
        <MyAppsSection apps={homeData.topIcon.myapps} id="myApps" layout="desktop" />

        <AboutUsCarousel aboutData={homeData.aboutUs} darkMode={darkMode} />

        <AppGridSection
          id="myCompany"
          title="My Company"
          apps={homeData.topIcon.myCompany}
          excludeNames={['Mygroup']}
          darkMode={darkMode}
          layout="desktop"
        />

        <AppGridSection
          id="onlineApps"
          title="My Online Apps"
          apps={homeData.topIcon.online}
          darkMode={darkMode}
          variant="alt"
          layout="desktop"
        />

        <AppGridSection
          id="offlineApps"
          title="My Offline Apps"
          apps={homeData.topIcon.offline}
          darkMode={darkMode}
          layout="desktop"
        />

        <FooterContentCarousel
          newsroom={homeData.newsroom}
          awards={homeData.awards}
          event={homeData.event}
          gallery={homeData.gallery}
          darkMode={darkMode}
        />

        <NavigationButtons darkMode={darkMode} layout="desktop" />

        <TestimonialsCarousel testimonials={homeData.testimonials} darkMode={darkMode} />

        <HomeFooter socialLinks={homeData.socialLink} copyRight={homeData.copyRight} />
      </main>
    </div>
  );
};
