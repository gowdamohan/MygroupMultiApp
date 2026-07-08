import React from 'react';
import { MobileHeader, getMobileHeaderHeight } from '../../../components/mobile/MobileHeader';
import { useGroupProfileLogo } from '../../../hooks/useGroupProfileLogo';

interface DesktopHomeHeaderProps {
  darkMode: boolean;
  onDarkModeToggle: () => void;
  showTopIcons?: boolean;
  /** Pre-fetched signed logo URL from home mobile-data (avoids extra request). */
  logoUrl?: string | null;
}

/** Shared desktop home navbar — logo, header ads, dark-mode toggle. */
export const DesktopHomeHeader: React.FC<DesktopHomeHeaderProps> = ({
  darkMode,
  onDarkModeToggle,
  showTopIcons = false,
  logoUrl: providedLogoUrl,
}) => {
  const { logoUrl } = useGroupProfileLogo(providedLogoUrl);

  return (
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
      customLogo={logoUrl || undefined}
    />
  );
};

/** Fixed header offset for page content below the home-layout navbar. */
export const DESKTOP_HOME_HEADER_OFFSET = getMobileHeaderHeight(
  false,
  true,
  false,
  'desktop',
  'home'
);
