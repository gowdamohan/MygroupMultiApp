import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Megaphone, Calendar, Newspaper, Trophy } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { MobileHeader } from '../../components/mobile/MobileHeader';
import { useHomeData } from '../../hooks/useHomeData';
import { TestimonialsCarousel } from './sections/TestimonialsCarousel';
import { HomeFooter } from './sections/HomeFooter';
import { resolveImageUrl, getAppLink } from './utils';
import { BACKEND_URL } from '../../config/api.config';
import { AppDetails } from '../../types/home.types';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import '../../styles/home.css';

const DARK_MODE_KEY = 'home_dark_mode';

/** Mygroup logo served from backend/public/uploads/logo.png — Row B logo cell */
const MYGROUP_LOGO_URL = `${BACKEND_URL}/uploads/logo.png`;

/* ─────────────────────────────────────────────────────────────
   Left-sidebar: one app-category section (title + icon grid)
───────────────────────────────────────────────────────────── */
interface SidebarSectionProps {
  title: string;
  apps: AppDetails[];
  darkMode: boolean;
  emptyLabel?: string;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, apps, darkMode, emptyLabel }) => (
  <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
    <h3
      className={`text-[11px] font-bold px-3 pt-2.5 pb-1.5 uppercase tracking-wider ${
        darkMode ? 'text-teal-400' : 'text-[#057284]'
      }`}
    >
      {title}
    </h3>
    {apps?.length > 0 ? (
      <div className="grid grid-cols-4 gap-x-1 gap-y-3 px-2 pb-3">
        {apps.map((app) => (
          <Link
            key={app.id}
            to={getAppLink(app)}
            className="flex flex-col items-center gap-1 group"
          >
            <div
              className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}
            >
              {app.icon ? (
                <img
                  src={resolveImageUrl(app.icon)}
                  alt={app.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <span className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  {app.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <span
              className={`text-[9px] text-center leading-tight line-clamp-2 w-full ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              {app.name}
            </span>
          </Link>
        ))}
      </div>
    ) : (
      <p className={`text-[9px] px-3 pb-3 italic ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
        {emptyLabel || 'No apps yet'}
      </p>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Ad image card — used for both main-area and side-ad slots
───────────────────────────────────────────────────────────── */
interface AdCardProps {
  image?: string;
  url?: string;
  title?: string;
  badge?: string;
  height: number | string;
  darkMode: boolean;
  className?: string;
}

const AdCard: React.FC<AdCardProps> = ({
  image,
  url,
  title,
  badge = 'AD',
  height,
  darkMode,
  className = '',
}) => {
  const content = image ? (
    <div className="relative w-full h-full">
      <img
        src={resolveImageUrl(image)}
        alt={title || 'Advertisement'}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/12 transition-all duration-300" />
      <span className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
        {badge}
      </span>
      {url && url !== '#' && (
        <span className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-gray-800 text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
          <ExternalLink size={10} /> Visit
        </span>
      )}
    </div>
  ) : (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2 relative"
      style={{
        background: darkMode
          ? 'linear-gradient(135deg, #374151, #1f2937)'
          : 'linear-gradient(135deg, #fde68a, #fbbf24)',
      }}
    >
      <Megaphone size={28} className={darkMode ? 'text-gray-400' : 'text-amber-700'} />
      <span className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-amber-900'}`}>
        Advertisement
      </span>
      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-amber-800/70'}`}>
        Your ad here
      </span>
      <span className="absolute top-2 right-2 bg-black/20 text-white/80 text-[9px] font-bold px-1.5 py-0.5 rounded">
        {badge}
      </span>
    </div>
  );

  const sharedClass = `block rounded-xl overflow-hidden shadow-md group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${className}`;

  return url && url !== '#' ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={sharedClass} style={{ height }}>
      {content}
    </a>
  ) : (
    <div className={sharedClass} style={{ height }}>
      {content}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Right-column stacked side-ad panel — flexes to fill full column height
───────────────────────────────────────────────────────────── */
interface SideAdPanelProps {
  ads: { image: string; url?: string }[];
  darkMode: boolean;
}

const SideAdPanel: React.FC<SideAdPanelProps> = ({ ads, darkMode }) => (
  <div className="flex flex-col h-full p-3 gap-2">
    {/* Section header */}
    <div className="flex items-center gap-2 flex-shrink-0 py-1">
      <Megaphone size={13} className={darkMode ? 'text-gray-400' : 'text-gray-400'} />
      <span className={`text-[10px] font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Related Ads
      </span>
      <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    </div>

    {/* Ad slots — flex-1 each so they share the remaining column height equally */}
    <div className="flex flex-col flex-1 gap-2 min-h-0">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex-1 min-h-0">
          <AdCard
            image={ads[i]?.image}
            url={ads[i]?.url}
            title={`Side Ad ${i + 1}`}
            badge="AD"
            height="100%"
            darkMode={darkMode}
          />
        </div>
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Main page component
───────────────────────────────────────────────────────────── */
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
    return () => { document.body.classList.remove('dark-mode'); };
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const pageBg  = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg  = darkMode ? 'bg-gray-800' : 'bg-white';
  const altBg   = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const border  = darkMode ? 'border-gray-700' : 'border-gray-200';
  const headTxt = darkMode ? 'text-white'   : 'text-gray-900';
  const mutedTxt = darkMode ? 'text-gray-400' : 'text-gray-500';

  if (loading) {
    return (
      <div className={`desktop-home flex items-center justify-center min-h-screen ${pageBg}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-200 border-t-purple-600" />
          <p className={`text-sm font-medium ${mutedTxt}`}>Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (error || !homeData) {
    return (
      <div className={`desktop-home flex items-center justify-center min-h-screen ${pageBg}`}>
        <p className={mutedTxt}>{error || 'No data available'}</p>
      </div>
    );
  }

  /* ── Derived data ── */
  const mainAdsSlides = homeData.mainAds?.main_ad_path
    ? [{ image: homeData.mainAds.main_ad_path, url: homeData.mainAds.main_ad_url ?? undefined }]
    : [];

  const sideAds = [
    homeData.mainAds?.side_ad_1_path ? { image: homeData.mainAds.side_ad_1_path, url: homeData.mainAds.side_ad_1_url ?? undefined } : null,
    homeData.mainAds?.side_ad_2_path ? { image: homeData.mainAds.side_ad_2_path, url: homeData.mainAds.side_ad_2_url ?? undefined } : null,
    homeData.mainAds?.side_ad_3_path ? { image: homeData.mainAds.side_ad_3_path, url: homeData.mainAds.side_ad_3_url ?? undefined } : null,
  ].filter(Boolean) as { image: string; url?: string }[];

  const rawTicker = homeData.mainAds?.scrooling_text;
  const tickerItems: string[] = rawTicker
    ? rawTicker.split(/[|\n]+/).map((s) => s.trim()).filter(Boolean)
    : [
        ...(homeData.newsroomList ?? []).map((n) => n.title),
        ...(homeData.awardsList ?? []).map((a) => a.title),
        ...(homeData.eventsList ?? []).map((e) => e.title),
      ].filter((t): t is string => !!t);
  const tickerDoubled = tickerItems.length > 0 ? [...tickerItems, ...tickerItems] : [];

  const myCompanyFiltered = homeData.topIcon.myCompany.filter((a) => a.name !== 'Mygroup');

  /* ── Mygroup logo: direct path from backend/public/uploads ── */
  const mygroupLogo = MYGROUP_LOGO_URL;

  /* ── Check if any of the 3 events-section lists have content ── */
  const hasEventsSection =
    (homeData.eventsList?.length ?? 0) > 0 ||
    (homeData.newsroomList?.length ?? 0) > 0 ||
    (homeData.awardsList?.length ?? 0) > 0;

  return (
    <div className={`desktop-home min-h-screen transition-colors duration-300 ${pageBg}`}>

      {/* ══════════════════════════════════════════
          HEADER — 3 rows (Row A: teal icons strip,
          Row B: logo + 2 header ads, Row C: brand bar)
      ══════════════════════════════════════════ */}
      <MobileHeader
        appName="mymedia"
        variant="desktop"
        desktopLayout="home"
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
        showTopIcons={true}
        showAds
        showDarkModeToggle
        showProfileButton={false}
        showSettingsButton={false}
        showAppDownloadButtons={false}
        customLogo={mygroupLogo}
      />

      <main className="desktop-home-main transition-colors duration-300">

        {/* ══════════════════════════════════════════
            TICKER — scrolling news/announcement strip
        ══════════════════════════════════════════ */}
        {tickerItems.length > 0 && (
          <div
            className={`w-full overflow-hidden border-b ${border} ${
              darkMode ? 'bg-gray-800' : 'bg-blue-50'
            } py-2 px-3 flex items-center gap-3`}
          >
            <span
              className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded"
              style={{ background: 'linear-gradient(-45deg, #ac32e4, #7918f2, #4801ff)', color: '#fff' }}
            >
              LATEST
            </span>
            <div className="overflow-hidden flex-1">
              <div className="home-ticker-track">
                {tickerDoubled.map((item, i) => (
                  <span
                    key={i}
                    className={`text-xs mr-16 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    ● {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            PORTAL GRID  — 220px : flex-1 : 280px
            Fixed sidebar widths prevent blank side gaps.
            All columns stretch to equal row height (min 500px).
            ┌── 220px ──┬──────── flex-1 ────────┬── 280px ──┐
            │ App sbar  │  Main Page Ad carousel  │ Side Ads  │
            │ My Apps   │  (fills full height)    │  Ad 1     │
            │ MyCompany │                         │  Ad 2     │
            │ Online    │                         │  Ad 3     │
            │ Offline   │                         │           │
            └───────────┴───────────────────────┴────────────┘
        ══════════════════════════════════════════ */}
        <div
          className={`border-b ${border}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 1fr 280px',
            alignItems: 'stretch',
            minHeight: 500,
          }}
        >

          {/* ── COL-1: Left sidebar — all four app categories ── */}
          <aside
            className={`home-portal-sidebar border-r ${border} ${cardBg} home-section-transition`}
            style={{ height: '100%' }}
          >
            <SidebarSection
              title="My Apps"
              apps={homeData.topIcon.myapps}
              darkMode={darkMode}
              emptyLabel="No apps configured"
            />
            <SidebarSection
              title="My Company"
              apps={myCompanyFiltered}
              darkMode={darkMode}
              emptyLabel="No company apps"
            />
            <SidebarSection
              title="Online Apps"
              apps={homeData.topIcon.online}
              darkMode={darkMode}
              emptyLabel="No online apps"
            />
            <SidebarSection
              title="Offline Apps"
              apps={homeData.topIcon.offline}
              darkMode={darkMode}
              emptyLabel="No offline apps"
            />
          </aside>

          {/* ── COL-2: Center — Main Page Ad carousel (full column height) ── */}
          <div
            className={`flex flex-col ${cardBg} home-section-transition`}
            style={{ height: '100%' }}
          >
            <div className="flex flex-col p-3" style={{ height: '100%' }}>
              {mainAdsSlides.length > 0 ? (
                <Swiper
                  modules={[Autoplay, Pagination, Navigation]}
                  autoplay={{ delay: 4500, disableOnInteraction: false }}
                  pagination={{ clickable: true }}
                  navigation
                  loop={mainAdsSlides.length > 1}
                  className="home-swiper rounded-2xl overflow-hidden shadow-lg"
                  style={{ flex: 1, minHeight: 0 }}
                >
                  {mainAdsSlides.map((ad, i) => (
                    <SwiperSlide key={i}>
                      <AdCard
                        image={ad.image}
                        url={ad.url}
                        title={`Main Ad ${i + 1}`}
                        badge="FEATURED"
                        height="100%"
                        darkMode={darkMode}
                        className="!rounded-none !shadow-none !translate-y-0"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <div className="rounded-2xl overflow-hidden shadow-lg" style={{ flex: 1, minHeight: 0 }}>
                  <AdCard
                    badge="FEATURED"
                    height="100%"
                    darkMode={darkMode}
                    className="!rounded-none !shadow-none !translate-y-0"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── COL-3: Right sidebar — side ads flexed to full column height ── */}
          <aside
            className={`home-portal-sidebar border-l ${border} ${cardBg} home-section-transition`}
            style={{ height: '100%' }}
          >
            <SideAdPanel ads={sideAds} darkMode={darkMode} />
          </aside>
        </div>

        {/* ══════════════════════════════════════════
            SECTION 1 — OUR CLIENTS logo slide
        ══════════════════════════════════════════ */}
        {homeData.clients && homeData.clients.length > 0 && (
          <section className={`border-b ${border} px-6 py-5 ${altBg} home-section-transition`}>
            <h3 className={`text-xs font-bold mb-4 uppercase tracking-widest ${headTxt}`}>Our Clients</h3>
            <Swiper
              modules={[Autoplay]}
              slidesPerView="auto"
              spaceBetween={16}
              autoplay={{ delay: 1800, disableOnInteraction: false }}
              loop={homeData.clients.length > 6}
              className="clients-logo-carousel"
            >
              {homeData.clients.map((item) => (
                <SwiperSlide key={item.id} style={{ width: 'auto' }}>
                  {item.image ? (
                    <div className="h-14 w-28 flex items-center justify-center">
                      <img
                        src={resolveImageUrl(item.image)}
                        alt={item.title || 'Client'}
                        className="max-h-full max-w-full object-contain grayscale hover:grayscale-0 transition-all duration-300"
                      />
                    </div>
                  ) : (
                    <div
                      className={`h-14 w-28 flex items-center justify-center rounded-lg text-[10px] font-semibold ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.title}
                    </div>
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        {/* ══════════════════════════════════════════
            SECTION 2 — EVENTS | NEWSROOM | AWARDS  (3-column division)
            source: footer_page WHERE footer_page_type IN ('events','newsroom','awards')
                    AND group_name='corporate'
        ══════════════════════════════════════════ */}
        {hasEventsSection && (
          <>
            <div className="home-portal-divider" />
            <section className={`border-b ${border} px-6 py-5 ${cardBg} home-section-transition`}>
              {/* Section header row */}
              <div className="flex items-center gap-3 mb-5">
                <h3 className={`text-xs font-bold uppercase tracking-widest ${headTxt}`}>
                  Events &amp; News
                </h3>
                <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              </div>

              {/* 3-column grid */}
              <div className="grid grid-cols-3 gap-6">

                {/* ── Column 1: EVENTS ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={14} className="text-indigo-500 flex-shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">Events</span>
                    <div className={`flex-1 h-px ${darkMode ? 'bg-indigo-900/50' : 'bg-indigo-100'}`} />
                  </div>
                  <div className="space-y-2.5">
                    {(homeData.eventsList ?? []).length > 0 ? (
                      (homeData.eventsList ?? []).slice(0, 5).map((ev) => (
                        <div
                          key={ev.id}
                          className={`flex gap-2.5 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                            darkMode ? 'bg-gray-700/60' : 'bg-indigo-50/60'
                          }`}
                        >
                          {ev.image ? (
                            <img
                              src={resolveImageUrl(ev.image)}
                              alt={ev.title || 'Event'}
                              className="w-[68px] h-[68px] object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-[68px] h-[68px] flex-shrink-0 flex items-center justify-center ${
                                darkMode ? 'bg-indigo-900/40' : 'bg-indigo-100'
                              }`}
                            >
                              <Calendar size={20} className="text-indigo-400" />
                            </div>
                          )}
                          <div className="py-2 pr-2 min-w-0 flex flex-col justify-center">
                            {ev.title && (
                              <p className={`text-xs font-semibold leading-snug line-clamp-2 ${headTxt}`}>
                                {ev.title}
                              </p>
                            )}
                            {ev.event_date && (
                              <p className={`text-[10px] mt-1 font-medium text-indigo-500`}>
                                {new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                            {ev.tag_line && (
                              <p className={`text-[10px] mt-0.5 ${mutedTxt} line-clamp-1`}>{ev.tag_line}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className={`text-xs italic ${mutedTxt}`}>No events found</p>
                    )}
                  </div>
                </div>

                {/* ── Column 2: NEWSROOM ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Newspaper size={14} className="text-blue-500 flex-shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">Newsroom</span>
                    <div className={`flex-1 h-px ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`} />
                  </div>
                  <div className="space-y-2.5">
                    {(homeData.newsroomList ?? []).length > 0 ? (
                      (homeData.newsroomList ?? []).slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className={`flex gap-2.5 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                            darkMode ? 'bg-gray-700/60' : 'bg-blue-50/60'
                          }`}
                        >
                          {item.image ? (
                            <img
                              src={resolveImageUrl(item.image)}
                              alt={item.title || 'News'}
                              className="w-[68px] h-[68px] object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-[68px] h-[68px] flex-shrink-0 flex items-center justify-center ${
                                darkMode ? 'bg-blue-900/40' : 'bg-blue-100'
                              }`}
                            >
                              <Newspaper size={20} className="text-blue-400" />
                            </div>
                          )}
                          <div className="py-2 pr-2 min-w-0 flex flex-col justify-center">
                            {item.title && (
                              <p className={`text-xs font-semibold leading-snug line-clamp-2 ${headTxt}`}>
                                {item.title}
                              </p>
                            )}
                            {item.tag_line && (
                              <p className={`text-[10px] mt-1 ${mutedTxt} line-clamp-1`}>{item.tag_line}</p>
                            )}
                            {item.content && (
                              <p className={`text-[10px] mt-0.5 ${mutedTxt} line-clamp-1`}>{item.content}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className={`text-xs italic ${mutedTxt}`}>No newsroom entries found</p>
                    )}
                  </div>
                </div>

                {/* ── Column 3: AWARDS ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy size={14} className="text-amber-500 flex-shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Awards</span>
                    <div className={`flex-1 h-px ${darkMode ? 'bg-amber-900/50' : 'bg-amber-100'}`} />
                  </div>
                  <div className="space-y-2.5">
                    {(homeData.awardsList ?? []).length > 0 ? (
                      (homeData.awardsList ?? []).slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className={`flex gap-2.5 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                            darkMode ? 'bg-gray-700/60' : 'bg-amber-50/60'
                          }`}
                        >
                          {item.image ? (
                            <img
                              src={resolveImageUrl(item.image)}
                              alt={item.title || 'Award'}
                              className="w-[68px] h-[68px] object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-[68px] h-[68px] flex-shrink-0 flex items-center justify-center ${
                                darkMode ? 'bg-amber-900/40' : 'bg-amber-100'
                              }`}
                            >
                              <Trophy size={20} className="text-amber-400" />
                            </div>
                          )}
                          <div className="py-2 pr-2 min-w-0 flex flex-col justify-center">
                            {item.title && (
                              <p className={`text-xs font-semibold leading-snug line-clamp-2 ${headTxt}`}>
                                {item.title}
                              </p>
                            )}
                            {item.year && (
                              <p className={`text-[10px] mt-1 font-medium text-amber-500`}>{item.year}</p>
                            )}
                            {item.tag_line && (
                              <p className={`text-[10px] mt-0.5 ${mutedTxt} line-clamp-1`}>{item.tag_line}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className={`text-xs italic ${mutedTxt}`}>No awards found</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════
            SECTION 3 — GALLERY masonry grid
            source: gallery_list + gallery_images_master
        ══════════════════════════════════════════ */}
        {homeData.galleryImages && homeData.galleryImages.length > 0 && (
          <>
            <div className="home-portal-divider" />
            <section className={`border-b ${border} px-6 py-5 ${altBg} home-section-transition`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xs font-bold uppercase tracking-widest ${headTxt}`}>Gallery</h3>
                <Link
                  to="/gallery"
                  className={`text-[10px] font-semibold px-3 py-1 rounded-full border transition-colors ${
                    darkMode
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  View All →
                </Link>
              </div>
              {/* Masonry grid — CSS columns for natural image heights */}
              <div className="home-gallery-masonry">
                {homeData.galleryImages.slice(0, 16).map((img) => (
                  <div
                    key={img.image_id}
                    className={`home-gallery-item rounded-xl overflow-hidden shadow-sm group cursor-pointer hover:shadow-lg transition-shadow`}
                  >
                    <img
                      src={resolveImageUrl(img.image_name)}
                      alt={img.image_description || img.gallery_name || 'Gallery'}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {img.image_description && (
                      <div
                        className={`absolute inset-x-0 bottom-0 px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                          darkMode ? 'bg-black/70' : 'bg-black/50'
                        }`}
                      >
                        <p className="text-[10px] text-white line-clamp-1">{img.image_description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════
            SECTION 4 — TESTIMONIALS sliding cards
        ══════════════════════════════════════════ */}
        <div className="home-portal-divider" />
        <TestimonialsCarousel
          testimonialsList={homeData.testimonialsList}
          darkMode={darkMode}
        />

        {/* ══════════════════════════════════════════
            FOOTER — column links + socials + copyright
        ══════════════════════════════════════════ */}
        <HomeFooter
          socialLinks={homeData.socialLink}
          copyRight={homeData.copyRight}
          eventsList={homeData.eventsList}
          newsroomList={homeData.newsroomList}
          awardsList={homeData.awardsList}
          clients={homeData.clients}
        />
      </main>
    </div>
  );
};
