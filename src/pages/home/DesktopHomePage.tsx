import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Megaphone } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { MobileHeader, getMobileHeaderHeight } from '../../components/mobile/MobileHeader';
import { useHomeData } from '../../hooks/useHomeData';
import { TestimonialsCarousel } from './sections/TestimonialsCarousel';
import { HomeFooter } from './sections/HomeFooter';
import { resolveImageUrl, getAppLink } from './utils';
import { AppDetails } from '../../types/home.types';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import '../../styles/home.css';

const DARK_MODE_KEY = 'home_dark_mode';
// showTopIcons=true → 36 + 80 + 52 = 168 px
const DESKTOP_HEADER_OFFSET = getMobileHeaderHeight(true, true, true, 'desktop', 'home');

/* ─────────────────────────────────────────────────────────────
   Left-sidebar: one app-category section (title + icon strip)
───────────────────────────────────────────────────────────── */
interface SidebarSectionProps {
  title: string;
  apps: AppDetails[];
  darkMode: boolean;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, apps, darkMode }) => {
  if (!apps?.length) return null;
  return (
    <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
      <h3
        className={`text-[11px] font-bold px-3 pt-2.5 pb-0.5 uppercase tracking-wider ${
          darkMode ? 'text-teal-400' : 'text-[#057284]'
        }`}
      >
        {title}
      </h3>
      <div className="home-app-strip">
        {apps.map((app) => (
          <Link
            key={app.id}
            to={getAppLink(app)}
            className="flex-shrink-0 flex flex-col items-center gap-1 w-[52px] group"
          >
            <div
              className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}
            >
              <img
                src={resolveImageUrl(app.icon)}
                alt={app.name}
                className="w-7 h-7 object-contain"
              />
            </div>
            <span
              className={`text-[9px] text-center leading-tight line-clamp-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              {app.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Ad image card — used for both main-area and side-ad slots
   Shows real image OR a styled yellow placeholder
───────────────────────────────────────────────────────────── */
interface AdCardProps {
  image?: string;
  url?: string;
  title?: string;
  /** Badge text shown top-right (e.g. "AD" or "FEATURED") */
  badge?: string;
  height: number | string;
  darkMode: boolean;
  /** Extra Tailwind classes on the wrapper */
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
      {/* Dark gradient overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/12 transition-all duration-300" />
      {/* Badge */}
      <span className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
        {badge}
      </span>
      {/* "Visit →" on hover */}
      {url && url !== '#' && (
        <span className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-gray-800 text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
          <ExternalLink size={10} /> Visit
        </span>
      )}
    </div>
  ) : (
    /* ── Placeholder when no image loaded yet ── */
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
   Right-column stacked side-ad panel (col-4)
   Shows 3 stacked AdCards with section header
───────────────────────────────────────────────────────────── */
interface SideAdPanelProps {
  ads: { image: string; url?: string }[];
  darkMode: boolean;
}

const SideAdPanel: React.FC<SideAdPanelProps> = ({ ads, darkMode }) => (
  <div className="flex flex-col gap-4 p-4">
    {/* Section header */}
    <div className="flex items-center gap-2">
      <Megaphone size={13} className={darkMode ? 'text-gray-400' : 'text-gray-400'} />
      <span className={`text-[10px] font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Related Ads
      </span>
      <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    </div>

    {/* Ad slots — always 3; use placeholder if data is missing */}
    {[0, 1, 2].map((i) => (
      <AdCard
        key={i}
        image={ads[i]?.image}
        url={ads[i]?.url}
        title={`Side Ad ${i + 1}`}
        badge="AD"
        height={190}
        darkMode={darkMode}
        className="flex-shrink-0"
      />
    ))}
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
    return () => {
      document.body.classList.remove('dark-mode');
    };
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
  const sideAds = [
    homeData.mainAds?.ads1 ? { image: homeData.mainAds.ads1, url: homeData.mainAds.ads1_url } : null,
    homeData.mainAds?.ads2 ? { image: homeData.mainAds.ads2, url: homeData.mainAds.ads2_url } : null,
    homeData.mainAds?.ads3 ? { image: homeData.mainAds.ads3, url: homeData.mainAds.ads3_url } : null,
  ].filter(Boolean) as { image: string; url?: string }[];

  const mainAdsSlides = sideAds;

  const tickerItems = [
    ...(homeData.newsroomList ?? []).map((n) => n.title),
    ...(homeData.awardsList ?? []).map((a) => a.title),
    ...(homeData.eventsList ?? []).map((e) => e.title),
  ].filter((t): t is string => !!t);
  const tickerDoubled = tickerItems.length > 0 ? [...tickerItems, ...tickerItems] : [];

  const myCompanyFiltered = homeData.topIcon.myCompany.filter((a) => a.name !== 'Mygroup');

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
        showProfileButton={true}
        showSettingsButton={false}
        showAppDownloadButtons={false}
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
            PORTAL GRID  — col-2 : col-6 : col-4
            ┌── col-2 ──┬──────── col-6 ────────┬── col-4 ──┐
            │ App sbar  │  Main Page Ad carousel │ Side Ads  │
            │ My Apps   │  (full-height, no hdg) │  Ad 1     │
            │ MyCompany ├───────────────────────┤  Ad 2     │
            │ Online    │  Our Clients           │  Ad 3     │
            │ Offline   │  Events slide          │           │
            └───────────┴───────────────────────┴───────────┘
            All columns stretch to the same row height.
        ══════════════════════════════════════════ */}
        <div
          className={`border-b ${border}`}
          style={{ display: 'grid', gridTemplateColumns: '2fr 6fr 4fr', alignItems: 'stretch' }}
        >

          {/* ── COL-2: Left sidebar — app categories (full column height) ── */}
          <aside
            className={`home-portal-sidebar border-r ${border} ${cardBg} home-section-transition`}
            style={{ height: '100%' }}
          >
            <SidebarSection
              title="My Apps"
              apps={homeData.topIcon.myapps}
              darkMode={darkMode}
            />
            <SidebarSection
              title="MyCompany Apps"
              apps={myCompanyFiltered}
              darkMode={darkMode}
            />
            <SidebarSection
              title="Online Apps"
              apps={homeData.topIcon.online}
              darkMode={darkMode}
            />
            <SidebarSection
              title="Offline Apps"
              apps={homeData.topIcon.offline}
              darkMode={darkMode}
            />
          </aside>

          {/* ── COL-6: Center — Main Page Ad carousel fills full column height ── */}
          <div className={`flex flex-col ${cardBg} home-section-transition`} style={{ height: '100%' }}>
            {/* Carousel wrapper — grows to fill all available column height */}
            <div className="p-3 flex flex-col" style={{ height: '100%' }}>
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

          {/* ── COL-4: Right sidebar — stacked Side Ads (full column height) ── */}
          <aside
            className={`home-portal-sidebar border-l ${border} ${cardBg} home-section-transition`}
            style={{ height: '100%' }}
          >
            <SideAdPanel ads={sideAds} darkMode={darkMode} />
          </aside>
        </div>

        {/* ══════════════════════════════════════════
            SECTION 1 — OUR CLIENTS logo slide
            source: footer_page WHERE footer_page_type='clients' AND group_name='corporate'
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
            SECTION 2 — EVENTS images slide
            source: footer_page WHERE footer_page_type='events' AND group_name='corporate'
        ══════════════════════════════════════════ */}
        {homeData.eventsList && homeData.eventsList.length > 0 && (
          <>
            <div className="home-portal-divider" />
            <section className={`border-b ${border} px-6 py-5 ${cardBg} home-section-transition`}>
              <h3 className={`text-xs font-bold mb-4 uppercase tracking-widest ${headTxt}`}>Events</h3>
              <Swiper
                modules={[Autoplay, Navigation, Pagination]}
                slidesPerView={3}
                spaceBetween={16}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                navigation
                pagination={{ clickable: true }}
                loop={homeData.eventsList.length > 3}
                className="home-swiper events-strip-carousel"
                breakpoints={{
                  1280: { slidesPerView: 4 },
                  1024: { slidesPerView: 3 },
                  640:  { slidesPerView: 2 },
                }}
              >
                {homeData.eventsList.map((ev) => (
                  <SwiperSlide key={ev.id}>
                    <div className={`rounded-xl overflow-hidden shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      {ev.image ? (
                        <img
                          src={resolveImageUrl(ev.image)}
                          alt={ev.title || 'Event'}
                          className="w-full object-cover"
                          style={{ height: 160 }}
                        />
                      ) : (
                        <div
                          className={`w-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}
                          style={{ height: 160 }}
                        >
                          <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-indigo-400'}`}>No Image</span>
                        </div>
                      )}
                      <div className="p-3">
                        {ev.title && (
                          <p className={`text-xs font-semibold leading-snug line-clamp-2 ${headTxt}`}>{ev.title}</p>
                        )}
                        {ev.tag_line && (
                          <p className={`text-[10px] mt-1 ${mutedTxt}`}>{ev.tag_line}</p>
                        )}
                        {ev.event_date && (
                          <p className={`text-[10px] mt-1 ${mutedTxt}`}>{ev.event_date}</p>
                        )}
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════
            SECTION 3 — NEWSROOM + AWARDS sliding cards
            source: footer_page WHERE footer_page_type IN ('newsroom','awards') AND group_name='corporate'
        ══════════════════════════════════════════ */}
        {((homeData.newsroomList && homeData.newsroomList.length > 0) ||
          (homeData.awardsList && homeData.awardsList.length > 0)) && (() => {
          const slides = [
            ...(homeData.newsroomList ?? []).map((n) => ({ ...n, _type: 'newsroom' as const })),
            ...(homeData.awardsList ?? []).map((a) => ({ ...a, _type: 'awards' as const })),
          ];
          return (
            <>
              <div className="home-portal-divider" />
              <section className={`border-b ${border} px-6 py-5 ${altBg} home-section-transition`}>
                <h3 className={`text-xs font-bold mb-4 uppercase tracking-widest ${headTxt}`}>
                  Newsroom &amp; Awards
                </h3>
                <Swiper
                  modules={[Autoplay, Navigation, Pagination]}
                  slidesPerView={3}
                  spaceBetween={16}
                  autoplay={{ delay: 4000, disableOnInteraction: false }}
                  navigation
                  pagination={{ clickable: true }}
                  loop={slides.length > 3}
                  className="home-swiper newsroom-awards-carousel"
                  breakpoints={{
                    1280: { slidesPerView: 4 },
                    1024: { slidesPerView: 3 },
                    640:  { slidesPerView: 2 },
                  }}
                >
                  {slides.map((item) => (
                    <SwiperSlide key={`${item._type}-${item.id}`}>
                      <div className={`rounded-xl overflow-hidden shadow-sm h-full flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        {item.image ? (
                          <img
                            src={resolveImageUrl(item.image)}
                            alt={item.title || item._type}
                            className="w-full object-cover flex-shrink-0"
                            style={{ height: 148 }}
                          />
                        ) : (
                          <div
                            className={`w-full flex items-center justify-center flex-shrink-0 ${
                              item._type === 'newsroom'
                                ? darkMode ? 'bg-blue-900/40' : 'bg-blue-50'
                                : darkMode ? 'bg-amber-900/40' : 'bg-amber-50'
                            }`}
                            style={{ height: 148 }}
                          >
                            <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                              item._type === 'newsroom'
                                ? darkMode ? 'text-blue-400' : 'text-blue-400'
                                : darkMode ? 'text-amber-400' : 'text-amber-500'
                            }`}>
                              {item._type}
                            </span>
                          </div>
                        )}
                        <div className="p-3 flex flex-col gap-1 flex-1">
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${
                            item._type === 'newsroom'
                              ? 'text-blue-500'
                              : 'text-amber-500'
                          }`}>
                            {item._type === 'newsroom' ? 'Newsroom' : 'Award'}
                          </span>
                          {item.title && (
                            <p className={`text-xs font-semibold leading-snug line-clamp-2 ${headTxt}`}>{item.title}</p>
                          )}
                          {item.tag_line && (
                            <p className={`text-[10px] ${mutedTxt} line-clamp-1`}>{item.tag_line}</p>
                          )}
                          {item.content && (
                            <p className={`text-[10px] ${mutedTxt} line-clamp-2 mt-auto`}>{item.content}</p>
                          )}
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </section>
            </>
          );
        })()}

        {/* ══════════════════════════════════════════
            SECTION 4 — GALLERY grid
            source: gallery_list + gallery_images_master
        ══════════════════════════════════════════ */}
        {homeData.galleryImages && homeData.galleryImages.length > 0 && (
          <>
            <div className="home-portal-divider" />
            <section className={`border-b ${border} px-6 py-5 ${cardBg} home-section-transition`}>
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
              <Swiper
                modules={[Autoplay, Navigation]}
                slidesPerView={5}
                spaceBetween={10}
                autoplay={{ delay: 2500, disableOnInteraction: false }}
                navigation
                loop={homeData.galleryImages.length > 5}
                className="gallery-strip-carousel"
                breakpoints={{
                  1280: { slidesPerView: 6 },
                  1024: { slidesPerView: 5 },
                  768:  { slidesPerView: 4 },
                  640:  { slidesPerView: 3 },
                }}
              >
                {homeData.galleryImages.map((img) => (
                  <SwiperSlide key={img.image_id}>
                    <div className="rounded-lg overflow-hidden shadow-sm group cursor-pointer" style={{ height: 130 }}>
                      <img
                        src={resolveImageUrl(img.image_name)}
                        alt={img.image_description || 'Gallery'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════
            SECTION 5 — TESTIMONIALS sliding cards
            source: footer_page WHERE footer_page_type='testimonials' AND group_name='corporate'
        ══════════════════════════════════════════ */}
        <div className="home-portal-divider" />
        <TestimonialsCarousel
          testimonialsList={homeData.testimonialsList}
          darkMode={darkMode}
        />

        {/* ══════════════════════════════════════════
            FOOTER — 6-column links + socials + copyright
        ══════════════════════════════════════════ */}
        <HomeFooter socialLinks={homeData.socialLink} copyRight={homeData.copyRight} />
      </main>
    </div>
  );
};
