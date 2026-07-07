import React from 'react';
import { MobileHeader, getMobileHeaderHeight } from '../../../components/mobile/MobileHeader';
import { BACKEND_URL } from '../../../config/api.config';

/** Mygroup logo — same source as desktop home page */
export const MYGROUP_LOGO_URL = `${BACKEND_URL}/uploads/logo.png`;

interface DesktopHomeHeaderProps {
  darkMode: boolean;
  onDarkModeToggle: () => void;
  showTopIcons?: boolean;
}

/** Shared desktop home navbar — logo, header ads, dark-mode toggle. */
export const DesktopHomeHeader: React.FC<DesktopHomeHeaderProps> = ({
  darkMode,
  onDarkModeToggle,
  showTopIcons = false,
}) => (
  <MobileHeader
    appName="mymedia"
    variant="desktop"
    desktopLayout="home"
    darkMode={darkMode}
    onDarkModeToggle={onDarkModeToggle}
    showTopIcons={showTopIcons}
    showAds
    showDarkModeToggle
    showProfileButton={false}
    showSettingsButton={false}
    showAppDownloadButtons={false}
    customLogo={MYGROUP_LOGO_URL}
  />
);

/** Fixed header offset for page content below the home-layout navbar. */
export const DESKTOP_HOME_HEADER_OFFSET = getMobileHeaderHeight(
  false,
  true,
  false,
  'desktop',
  'home'
);
