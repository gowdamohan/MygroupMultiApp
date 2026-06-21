import {
  GroupCreate,
  CreateDetails,
  FooterPage,
  GalleryList,
  GalleryImagesMaster,
  MainAds
} from '../models/index.js';
import { resolveStorageReadUrl } from '../services/wasabiService.js';

/**
 * HOME CONTROLLER
 * All image paths stored as Wasabi keys are resolved to signed read-URLs
 * before being returned to the client.
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

/** Resolve a single image path to a signed URL (or local path). */
const resolveImg = (path) => resolveStorageReadUrl(path, 3600);

/** Map footer_page rows → plain objects with signed image URLs. */
const formatFooterItems = async (rows) =>
  Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      footer_page_type: r.footer_page_type,
      title: r.title || null,
      tag_line: r.tag_line || null,
      image: r.image ? await resolveImg(r.image) : null,
      content: r.content || null,
      url: r.url || null,
      event_date: r.event_date || null,
      year: r.year || null,
      group_name: r.group_name || null,
    }))
  );

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
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch download app links', error: error.message });
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
      GroupCreate.findAll({ where: { apps_name: 'My Apps' },         include: includeDetails, order: orderBy }),
      GroupCreate.findAll({ where: { apps_name: 'My Company' },      include: includeDetails, order: orderBy }),
      GroupCreate.findAll({ where: { apps_name: 'My Onine Apps' },   include: includeDetails, order: orderBy }),
      GroupCreate.findAll({ where: { apps_name: 'My Offline Apps' }, include: includeDetails, order: orderBy }),
    ]);

    const topIcon = {
      myapps:    formatApps(myApps),
      myCompany: formatApps(myCompany),
      online:    formatApps(onlineApps),
      offline:   formatApps(offlineApps),
    };

    /* ── 3. Main ads — active row from main_ads table ── */
    const mainAdsRow = await MainAds.findOne({
      where: { is_active: 1 },
      order: [['id', 'DESC']],
    });

    const mainAds = mainAdsRow
      ? {
          id: mainAdsRow.id,
          // Center carousel ad
          main_ad_path:   mainAdsRow.main_ad_path   ? await resolveImg(mainAdsRow.main_ad_path)   : null,
          main_ad_url:    mainAdsRow.main_ad_url    || null,
          // Side panel ads
          side_ad_1_path: mainAdsRow.side_ad_1_path ? await resolveImg(mainAdsRow.side_ad_1_path) : null,
          side_ad_1_url:  mainAdsRow.side_ad_1_url  || null,
          side_ad_2_path: mainAdsRow.side_ad_2_path ? await resolveImg(mainAdsRow.side_ad_2_path) : null,
          side_ad_2_url:  mainAdsRow.side_ad_2_url  || null,
          side_ad_3_path: mainAdsRow.side_ad_3_path ? await resolveImg(mainAdsRow.side_ad_3_path) : null,
          side_ad_3_url:  mainAdsRow.side_ad_3_url  || null,
        }
      : null;

    /* ── 4. footer_page sections (group_name = 'corporate') ── */
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
      FooterPage.findAll({ where: fpWhere('testimonials'), order: [['id', 'ASC']] }),
    ]);

    // Resolve signed image URLs for all footer_page sections in parallel
    const [clients, eventsList, newsroomList, awardsList, testimonialsList] = await Promise.all([
      formatFooterItems(clientsRows),
      formatFooterItems(eventsRows),
      formatFooterItems(newsroomRows),
      formatFooterItems(awardsRows),
      formatFooterItems(testimonialsRows),
    ]);

    /* ── 5. Gallery (latest album's images — signed URLs) ── */
    const latestAlbum = await GalleryList.findOne({ order: [['gallery_id', 'DESC']] });
    const galleryImages = latestAlbum
      ? await Promise.all(
          (
            await GalleryImagesMaster.findAll({
              where: { gallery_id: latestAlbum.gallery_id },
              order: [['image_id', 'ASC']],
              limit: 30,
            })
          ).map(async (img) => ({
            image_id: img.image_id,
            gallery_id: img.gallery_id,
            image_name: img.image_name ? await resolveImg(img.image_name) : null,
            image_description: img.image_description || null,
            gallery_name: latestAlbum.gallery_name || null,
            group_id: img.group_id || null,
          }))
        )
      : [];

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

      // Legacy single-item shims (mobile / backward compat)
      aboutUs: clients,
      newsroom: newsroomList[0]
        ? { id: newsroomList[0].id, title: newsroomList[0].title, description: newsroomList[0].content, image: newsroomList[0].image }
        : null,
      awards: awardsList[0]
        ? { id: awardsList[0].id, title: awardsList[0].title, description: awardsList[0].content, image: awardsList[0].image }
        : null,
      event: eventsList[0]
        ? { id: eventsList[0].id, title: eventsList[0].title, description: eventsList[0].content, image: eventsList[0].image }
        : null,
      gallery: galleryImages[0]
        ? { image_id: galleryImages[0].image_id, gallery_id: galleryImages[0].gallery_id, image_name: galleryImages[0].image_name, title: galleryImages[0].image_description }
        : null,
      testimonials: [],
    };

    res.json({ success: true, data: homeData, message: 'Mobile home data fetched successfully' });
  } catch (error) {
    console.error('Error fetching mobile home data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mobile home data',
      error: error.message,
    });
  }
};
