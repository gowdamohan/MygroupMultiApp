import {
  GroupCreate,
  CreateDetails,
  FooterPage,
  GalleryList,
  GalleryImagesMaster
} from '../models/index.js';

/**
 * HOME CONTROLLER
 * Handles mobile home page data fetching
 */

// Get download app links (iOS App Store & Android Play Store)
export const getDownloadApps = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        ios: process.env.IOS_APP_STORE_URL || 'https://apps.apple.com/app/placeholder',
        android: process.env.ANDROID_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.placeholder'
      }
    });
  } catch (error) {
    console.error('Error fetching download apps:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch download app links',
      error: error.message
    });
  }
};

// Get mobile home page data
export const getMobileHomeData = async (req, res) => {
  try {
    // 1. Get logo/group information (placeholder - will be implemented)
    const logo = {
      id: 1,
      name_image: '/uploads/logo.png',
      logo: '/uploads/icon.png'
    };

    // 2. Get top navigation icon list (My Apps, My Company, Online, Offline)
    const myApps = await GroupCreate.findAll({
      where: { apps_name: 'My Apps' },
      attributes: ['id', 'name', 'api_dashboard_url', 'order_by'],
      include: [{
        model: CreateDetails,
        as: 'details',
        required: false
      }],
      order: [['order_by', 'ASC'], ['id', 'ASC']]
    });

    const myCompany = await GroupCreate.findAll({
      where: { apps_name: 'My Company' },
      include: [{
        model: CreateDetails,
        as: 'details',
        required: false
      }],
      order: [['order_by', 'ASC'], ['id', 'ASC']]
    });

    const onlineApps = await GroupCreate.findAll({
      where: { apps_name: 'My Onine Apps' },
      include: [{
        model: CreateDetails,
        as: 'details',
        required: false
      }],
      order: [['order_by', 'ASC'], ['id', 'ASC']]
    });

    const offlineApps = await GroupCreate.findAll({
      where: { apps_name: 'My Offline Apps' },
      include: [{
        model: CreateDetails,
        as: 'details',
        required: false
      }],
      order: [['order_by', 'ASC'], ['id', 'ASC']]
    });

    // Format app data
    const formatApps = (apps) => {
      return apps.map(app => ({
        id: app.id,
        create_id: app.id,
        name: app.name,
        icon: app.details?.icon || '',
        logo: app.details?.logo || '',
        name_image: app.details?.name_image || '',
        url: app.details?.url || '#',
        description: app.details?.description || '',
        background_color: app.details?.background_color || '#ffffff',
        status: 1
      }));
    };

    const topIcon = {
      myapps: formatApps(myApps),
      myCompany: formatApps(myCompany),
      online: formatApps(onlineApps),
      offline: formatApps(offlineApps)
    };

    // 3. Social links (placeholder - will be implemented)
    const socialLink = [];

    // 4. About Us (placeholder - will be implemented)
    const aboutUs = [];

    // 5. Main Ads (placeholder - will be implemented)
    const mainAds = null;

    // 6. Latest content (placeholder - will be implemented)
    const newsroom = null;
    const awards = null;
    const event = null;

    // 7. Gallery (placeholder - will be implemented)
    const gallery = null;

    // 8. Testimonials (placeholder - will be implemented)
    const testimonials = [];

    // 9. Copyright (placeholder - will be implemented)
    const copyRight = null;

    // Construct response
    const homeData = {
      logo,
      topIcon,
      socialLink,
      copyRight,
      aboutUs,
      mainAds,
      newsroom,
      awards,
      event,
      gallery,
      testimonials
    };

    res.json({
      success: true,
      data: homeData,
      message: 'Mobile home data fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching mobile home data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mobile home data',
      error: error.message
    });
  }
};

