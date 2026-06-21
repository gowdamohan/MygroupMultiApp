import {
  GroupCreate,
  CreateDetails,
  FooterPage,
  GalleryList,
  GalleryImagesMaster,
  MainAds
} from '../models/index.js';

/**
 * HOME CONTROLLER
 * Handles mobile / desktop home page data fetching.
 *
 * All section data (clients, events, newsroom, awards, testimonials) comes from
 *   footer_page WHERE group_name = 'corporate'
 * Gallery comes from gallery_list + gallery_images_master.
 */

// ─── helpers ──────────────────────────────────────────────────────────────────

const formatApps = (apps) =>
  apps.map((app) => ({
    id: app.id,
    create_id: app.id,
    name: app.name,
    icon: app.details?.icon || '',
    logo: app.details?.logo || '',
    name_image: app.details?.name_image || '',
    url: app.details?.url || '#',
    description: app.details?.description || '',
    background_color: app.details?.background_color || '#ffffff',
    status: 1,
  }));

const formatFooterItems = (rows) =>
  rows.map((r) => ({
    id: r.id,
    footer_page_type: r.footer_page_type,
    title: r.title || null,
    tag_line: r.tag_line || null,
    image: r.image || null,
    content: r.content || null,
    url: r.url || null,
    event_date: r.event_date || null,
    year: r.year || null,
    group_name: r.group_name || null,
  }));

// ─── Download app links ────────────────────────────────────────────────────────

export const getDownloadApps = async (_req, res) => {
  try {
    res.json({
      success: true,
      data: {
        ios: process.env.IOS_APP_STORE_URL || 'https://apps.apple.com/app/placeholder',
        android:
          process.env.ANDROID_PLAY_STORE_URL ||
          'https://play.google.com/store/apps/details?id=com.placeholder',
      },
    });
  } catch (error) {
    console.error('Error fetching download apps:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch download app links', error: error.message });
  }
};

// ─── Mobile / Desktop home page data ─────────────────────────────────────────

export const getMobileHomeData = async (_req, res) => {
  try {
    /* ── 1. Logo / group info (static placeholder) ── */
    const logo = { id: 1, name_image: '/uploads/logo.png', logo: '/uploads/icon.png' };

    /* ── 2. Top-nav icon lists ── */
    const includeDetails = [{ model: CreateDetails, as: 'details', required: false }];
    const orderBy = [['order_by', 'ASC'], ['id', 'ASC']];

    const [myApps, myCompany, onlineApps, offlineApps] = await Promise.all([
      GroupCreate.findAll({ where: { apps_name: 'My Apps' },          include: includeDetails, order: orderBy }),
      GroupCreate.findAll({ where: { apps_name: 'My Company' },       include: includeDetails, order: orderBy }),
      GroupCreate.findAll({ where: { apps_name: 'My Onine Apps' },    include: includeDetails, order: orderBy }),
      GroupCreate.findAll({ where: { apps_name: 'My Offline Apps' },  include: includeDetails, order: orderBy }),
    ]);

    const topIcon = {
      myapps:   formatApps(myApps),
      myCompany: formatApps(myCompany),
      online:   formatApps(onlineApps),
      offline:  formatApps(offlineApps),
    };

    /* ── 3. footer_page sections (group_name = 'corporate') ── */
    const fpWhere = (type) => ({ footer_page_type: type, group_name: 'corporate' });

    const [
      clientsRows,
      eventsRows,
      newsroomRows,
      awardsRows,
      testimonialsRows,
    ] = await Promise.all([
      FooterPage.findAll({ where: fpWhere('clients'),      order: [['id', 'ASC']] }),
      FooterPage.findAll({ where: fpWhere('events'),       order: [['id', 'DESC']], limit: 30 }),
      FooterPage.findAll({ where: fpWhere('newsroom'),     order: [['id', 'DESC']], limit: 30 }),
      FooterPage.findAll({ where: fpWhere('awards'),       order: [['id', 'DESC']], limit: 30 }),
      FooterPage.findAll({ where: fpWhere('testimonials'), order: [['id', 'ASC']]  }),
    ]);

    const clients       = formatFooterItems(clientsRows);
    const eventsList    = formatFooterItems(eventsRows);
    const newsroomList  = formatFooterItems(newsroomRows);
    const awardsList    = formatFooterItems(awardsRows);
    const testimonialsList = formatFooterItems(testimonialsRows);

    /* ── 4. Gallery (latest album's images) ── */
    const latestAlbum = await GalleryList.findOne({ order: [['gallery_id', 'DESC']] });
    const galleryImages = latestAlbum
      ? (await GalleryImagesMaster.findAll({
          where: { gallery_id: latestAlbum.gallery_id },
          order: [['image_id', 'ASC']],
          limit: 30,
        })).map((img) => ({
          image_id: img.image_id,
          gallery_id: img.gallery_id,
          image_name: img.image_name,
          image_description: img.image_description || null,
          gallery_name: latestAlbum.gallery_name || null,
          group_id: img.group_id || null,
        }))
      : [];

    /* ── 5. Main ads — fetch the active row from main_ads table ── */
    const mainAdsRow = await MainAds.findOne({
      where: { is_active: 1 },
      order: [['id', 'DESC']]
    });
    const mainAds = mainAdsRow ? {
      id: mainAdsRow.id,
      main_ad_path:  mainAdsRow.main_ad_path  || null,
      main_ad_url:   mainAdsRow.main_ad_url   || null,
      side_ad_1_path: mainAdsRow.side_ad_1_path || null,
      side_ad_1_url:  mainAdsRow.side_ad_1_url  || null,
      side_ad_2_path: mainAdsRow.side_ad_2_path || null,
      side_ad_2_url:  mainAdsRow.side_ad_2_url  || null,
      side_ad_3_path: mainAdsRow.side_ad_3_path || null,
      side_ad_3_url:  mainAdsRow.side_ad_3_url  || null,
    } : null;

    /* ── Build response ── */
    const homeData = {
      logo,
      topIcon,
      socialLink: [],
      copyRight: null,
      mainAds,

      // footer_page arrays (corporate)
      clients,
      eventsList,
      newsroomList,
      awardsList,
      testimonialsList,
      galleryImages,

      // Legacy single-item shims (mobile / FooterContentCarousel compat)
      aboutUs: clients,                          // re-use clients for mobile "about us" logos
      newsroom: newsroomRows[0]
        ? { id: newsroomRows[0].id, title: newsroomRows[0].title, description: newsroomRows[0].content, image: newsroomRows[0].image }
        : null,
      awards: awardsRows[0]
        ? { id: awardsRows[0].id, title: awardsRows[0].title, description: awardsRows[0].content, image: awardsRows[0].image }
        : null,
      event: eventsRows[0]
        ? { id: eventsRows[0].id, title: eventsRows[0].title, description: eventsRows[0].content, image: eventsRows[0].image }
        : null,
      gallery: galleryImages[0]
        ? { image_id: galleryImages[0].image_id, gallery_id: galleryImages[0].gallery_id, image_name: galleryImages[0].image_name, title: galleryImages[0].image_description }
        : null,
      testimonials: [],   // legacy Testimonial[] – not used on desktop (uses testimonialsList)
    };

    res.json({ success: true, data: homeData, message: 'Mobile home data fetched successfully' });
  } catch (error) {
    console.error('Error fetching mobile home data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch mobile home data', error: error.message });
  }
};
