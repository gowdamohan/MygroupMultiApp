import { Op } from 'sequelize';
import {
  MediaChannel,
  AppCategory,
  GroupCreate,
  CreateDetails,
  Country,
  State,
  District,
  Language,
  MediaSchedule,
  MediaScheduleSlot,
  MediaInteractions,
  MediaSocialLinks,
  MediaAwards,
  MediaNewsletters,
  MediaTeam,
  MediaGalleryAlbums,
  MediaGalleryImages,
  MediaDocuments,
  MediaSwitcher,
  MediaOfflineMedia,
  MediaChannelDocument,
  HeaderAdsManagement,
  CompanyAdsManagement
} from '../models/index.js';

/**
 * MYMEDIA CONTROLLER
 * Handles public MyMedia page data fetching
 */

/**
 * Get app details by name or default to MyMedia
 * GET /api/v1/mymedia/app
 * Query params: name (optional) - app name to search for
 */
export const getMyMediaApp = async (req, res) => {
  try {
    const { name } = req.query;

    // Build where clause - search by name if provided, otherwise default to mymedia
    const searchName = name || 'mymedia';

    const app = await GroupCreate.findOne({
      where: { name: { [Op.like]: `%${searchName}%` } },
      include: [{
        model: CreateDetails,
        as: 'details',
        required: false
      }]
    });

    if (!app) {
      return res.status(404).json({
        success: false,
        message: `App '${searchName}' not found`
      });
    }

    res.json({
      success: true,
      data: {
        id: app.id,
        name: app.name,
        apps_name: app.apps_name,
        icon: app.details?.icon || '',
        logo: app.details?.logo || '',
        name_image: app.details?.name_image || ''
      }
    });
  } catch (error) {
    console.error('Error fetching app:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch app',
      error: error.message
    });
  }
};

/**
 * Get categories for MyMedia app (parent categories)
 * GET /api/v1/mymedia/categories
 * Query params: appId (optional - if not provided, uses MyMedia app)
 */
export const getMyMediaCategories = async (req, res) => {
  try {
    const { appId } = req.query;
    let targetAppId;

    if (appId) {
      // Use provided app ID
      targetAppId = parseInt(appId);
    } else {
      // Find MyMedia app as fallback
      const app = await GroupCreate.findOne({
        where: { name: { [Op.like]: '%mymedia%' } }
      });

      if (!app) {
        return res.status(404).json({
          success: false,
          message: 'MyMedia app not found'
        });
      }
      targetAppId = app.id;
    }

    // Get parent categories for this app, excluding addon categories
    const categories = await AppCategory.findAll({
      where: {
        app_id: targetAppId,
        parent_id: null,
        status: 1,
        [Op.or]: [
          { category_type: { [Op.ne]: 'addon' } },
          { category_type: null },
          { category_type: '' }
        ]
      },
      order: [['sort_order', 'ASC'], ['category_name', 'ASC']]
    });

    // Get child categories for each parent (also excluding addon types)
    const categoriesWithChildren = await Promise.all(
      categories.map(async (category) => {
        const children = await AppCategory.findAll({
          where: {
            parent_id: category.id,
            status: 1,
            [Op.or]: [
              { category_type: { [Op.ne]: 'addon' } },
              { category_type: null },
              { category_type: '' }
            ]
          },
          order: [['sort_order', 'ASC'], ['category_name', 'ASC']]
        });
        return {
          id: category.id,
          category_name: category.category_name,
          category_type: category.category_type,
          category_image: category.category_image,
          parent_id: category.parent_id,
          children: children.map(c => ({
            id: c.id,
            category_name: c.category_name,
            category_type: c.category_type,
            category_image: c.category_image,
            parent_id: c.parent_id
          }))
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithChildren
    });
  } catch (error) {
    console.error('Error fetching MyMedia categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

/**
 * Get addon categories for an app (for settings popup)
 * GET /api/v1/mymedia/addon-categories
 * Query params: appId (required)
 */
export const getAddonCategories = async (req, res) => {
  try {
    const { appId } = req.query;

    if (!appId) {
      return res.status(400).json({
        success: false,
        message: 'appId query parameter is required'
      });
    }

    // Get addon categories for this app
    const addonCategories = await AppCategory.findAll({
      where: {
        app_id: parseInt(appId),
        status: 1,
        category_type: 'addon'
      },
      order: [['sort_order', 'ASC'], ['category_name', 'ASC']]
    });

    res.json({
      success: true,
      data: addonCategories.map(c => ({
        id: c.id,
        category_name: c.category_name,
        category_type: c.category_type,
        category_image: c.category_image,
        parent_id: c.parent_id
      }))
    });
  } catch (error) {
    console.error('Error fetching addon categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addon categories',
      error: error.message
    });
  }
};

/**
 * Get all languages
 * GET /api/v1/mymedia/languages
 */
export const getMyMediaLanguages = async (req, res) => {
  try {
    const { country_id } = req.query;
    
    const whereClause = {};
    if (country_id) {
      whereClause.country_id = country_id;
    }

    const languages = await Language.findAll({
      where: whereClause,
      attributes: ['id', 'lang_1', 'lang_2', 'country_id'],
      order: [['lang_1', 'ASC']]
    });

    res.json({
      success: true,
      data: languages
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch languages',
      error: error.message
    });
  }
};

/**
 * Get media channels with filters
 * GET /api/v1/mymedia/channels
 * Query params: type, country_id, state_id, district_id, category_id, language_id
 */
export const getMyMediaChannels = async (req, res) => {
  try {
    const { type, country_id, state_id, district_id, category_id, language_id } = req.query;

    // First find MyMedia app
    const app = await GroupCreate.findOne({
      where: { name: { [Op.like]: '%mymedia%' } }
    });

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'MyMedia app not found'
      });
    }

    // Find the 'Tv' category in app_categories for this app
    const tvCategory = await AppCategory.findOne({
      where: {
        app_id: app.id,
        category_name: { [Op.like]: '%Tv%' },
        status: 1
      }
    });

    // Build where clause
    const whereClause = {
      app_id: app.id,
      is_active: 1,
      status: 'approved'
    };

    // Filter by Tv category if found, otherwise fallback to media_type
    if (tvCategory) {
      whereClause.parent_category_id = tvCategory.id;
    } else {
      whereClause.media_type = 'Tv';
    }

    if (type) whereClause.select_type = type;
    if (country_id) whereClause.country_id = country_id;
    if (state_id) whereClause.state_id = state_id;
    if (district_id) whereClause.district_id = district_id;
    if (category_id) whereClause.category_id = category_id;
    if (language_id) whereClause.language_id = language_id;

    const channels = await MediaChannel.findAll({
      where: whereClause,
      attributes: [
        'id', 'media_logo', 'media_name_english', 'media_name_regional',
        'select_type', 'category_id', 'parent_category_id', 'language_id'
      ],
      include: [
        {
          model: AppCategory,
          as: 'category',
          attributes: ['id', 'category_name', 'category_type']
        },
        {
          model: Language,
          as: 'language',
          attributes: ['id', 'lang_1', 'lang_2'],
          required: false
        }
      ],
      order: [['media_name_english', 'ASC']]
    });

    res.json({
      success: true,
      data: channels
    });
  } catch (error) {
    console.error('Error fetching media channels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch channels',
      error: error.message
    });
  }
};

/**
 * Get schedules for a channel
 * GET /api/v1/mymedia/schedules/:channelId
 * Query params: weekStart (YYYY-MM-DD), day (0-6 for specific day)
 */
export const getMyMediaSchedules = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { weekStart, day } = req.query;

    // Verify channel exists and is active
    const channel = await MediaChannel.findOne({
      where: {
        id: channelId,
        is_active: 1
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found or not active'
      });
    }

    // Calculate week range
    const startDate = weekStart ? new Date(weekStart) : new Date();
    startDate.setHours(0, 0, 0, 0);
    const dayOfWeek = startDate.getDay();
    const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startDate.setDate(diff);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const weekStartStr = startDate.toISOString().split('T')[0];
    const weekEndStr = endDate.toISOString().split('T')[0];

    // Build where clause for schedules
    const scheduleWhere = {
      media_channel_id: channelId,
      [Op.or]: [
        { original_schedule_id: null },
        { schedule_date: { [Op.between]: [weekStartStr, weekEndStr] } }
      ]
    };

    // If specific day is requested, filter by day_of_week
    if (day !== undefined && day !== null && day !== '') {
      scheduleWhere.day_of_week = parseInt(day);
    }

    const schedules = await MediaSchedule.findAll({
      where: scheduleWhere,
      include: [{
        model: MediaScheduleSlot,
        as: 'slots',
        required: false,
        order: [['start_time', 'ASC']]
      }],
      order: [['schedule_date', 'ASC']]
    });

    // Format schedule data
    const formattedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      title: schedule.title,
      media_file: schedule.media_file,
      schedule_date: schedule.schedule_date,
      day_of_week: schedule.day_of_week,
      slots: (schedule.slots || []).map(slot => ({
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_recurring: slot.is_recurring,
        status: slot.status
      }))
    }));

    res.json({
      success: true,
      data: {
        channel: {
          id: channel.id,
          name: channel.media_name_english,
          logo: channel.media_logo
        },
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        schedules: formattedSchedules
      }
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedules',
      error: error.message
    });
  }
};

/**
 * Get channels by parent category name (E-Paper, Magazine, TV, Radio, etc.)
 * GET /api/v1/mymedia/channels-by-category/:categoryName
 * Query params: type, country_id, state_id, district_id, language_id
 */
export const getChannelsByCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;
    const { type, country_id, state_id, district_id, language_id, page = 1, limit = 20 } = req.query;

    // Find MyMedia app
    const app = await GroupCreate.findOne({
      where: { name: { [Op.like]: '%mymedia%' } }
    });

    if (!app) {
      return res.status(404).json({ success: false, message: 'MyMedia app not found' });
    }

    // Find the parent category by name
    const parentCategory = await AppCategory.findOne({
      where: {
        app_id: app.id,
        category_name: { [Op.like]: `%${categoryName}%` },
        parent_id: null,
        status: 1
      }
    });

    if (!parentCategory) {
      return res.status(404).json({ success: false, message: `Category '${categoryName}' not found` });
    }

    // Build where clause
    const whereClause = {
      app_id: app.id,
      parent_category_id: parentCategory.id,
      is_active: 1,
      status: 'active'
    };

    if (type) whereClause.select_type = type;
    if (country_id) whereClause.country_id = country_id;
    if (state_id) whereClause.state_id = state_id;
    if (district_id) whereClause.district_id = district_id;
    if (language_id) whereClause.language_id = language_id;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: channels } = await MediaChannel.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'media_logo', 'media_name_english', 'media_name_regional',
        'select_type', 'category_id', 'parent_category_id', 'language_id',
        'country_id', 'state_id', 'district_id', 'periodical_type'
      ],
      include: [
        { model: AppCategory, as: 'category', attributes: ['id', 'category_name'] },
        { model: Language, as: 'language', attributes: ['id', 'lang_1'], required: false },
        { model: Country, as: 'country', attributes: ['id', 'country'], required: false },
        { model: State, as: 'state', attributes: ['id', 'state'], required: false },
        { model: MediaInteractions, as: 'interactions', attributes: ['views_count', 'followers_count', 'likes_count'], required: false }
      ],
      order: [['media_name_english', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        channels,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching channels by category:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch channels', error: error.message });
  }
};

/**
 * Get channel details with all related data
 * GET /api/v1/mymedia/channel/:channelId
 */
export const getChannelDetails = async (req, res) => {
  try {
    const { channelId } = req.params;

    const channel = await MediaChannel.findOne({
      where: { id: channelId, is_active: 1 },
      include: [
        { model: AppCategory, as: 'category', attributes: ['id', 'category_name', 'category_type'] },
        { model: AppCategory, as: 'parentCategory', attributes: ['id', 'category_name'] },
        { model: Language, as: 'language', attributes: ['id', 'lang_1', 'lang_2'], required: false },
        { model: Country, as: 'country', attributes: ['id', 'country'], required: false },
        { model: State, as: 'state', attributes: ['id', 'state'], required: false },
        { model: District, as: 'district', attributes: ['id', 'district'], required: false },
        { model: MediaInteractions, as: 'interactions', required: false }
      ]
    });

    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Fetch related data in parallel
    const [socialLinks, awards, newsletters, team, albums, switcher] = await Promise.all([
      MediaSocialLinks.findAll({ where: { media_channel_id: channelId, is_active: 1 } }),
      MediaAwards.findAll({ where: { media_channel_id: channelId, is_active: 1 }, order: [['sort_order', 'ASC']] }),
      MediaNewsletters.findAll({ where: { media_channel_id: channelId, is_active: 1 }, order: [['sort_order', 'ASC']] }),
      MediaTeam.findAll({ where: { media_channel_id: channelId, is_active: 1 }, order: [['sort_order', 'ASC']] }),
      MediaGalleryAlbums.findAll({ where: { media_channel_id: channelId, is_active: 1 }, order: [['sort_order', 'ASC']] }),
      MediaSwitcher.findOne({ where: { media_channel_id: channelId } })
    ]);

    // Get offline media if switcher exists
    let offlineMedia = null;
    if (switcher && switcher.offline_media_id) {
      offlineMedia = await MediaOfflineMedia.findByPk(switcher.offline_media_id);
    }

    res.json({
      success: true,
      data: {
        channel: channel.toJSON(),
        socialLinks,
        awards,
        newsletters,
        team,
        gallery: albums,
        switcher: switcher ? { ...switcher.toJSON(), offlineMedia } : null
      }
    });
  } catch (error) {
    console.error('Error fetching channel details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch channel details', error: error.message });
  }
};

/**
 * Get documents for E-Paper/Magazine channel
 * GET /api/v1/mymedia/channel/:channelId/documents
 * Query params: year, month, page, limit
 */
export const getChannelDocuments = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { year, month, page = 1, limit = 50 } = req.query;

    // Build where clause for MediaChannelDocument (E-Paper/Magazine issues)
    const whereClause = { media_channel_id: channelId, status: 1 };
    if (year) whereClause.document_year = parseInt(year);
    if (month) whereClause.document_month = parseInt(month);

    // Get total count for pagination
    const totalCount = await MediaChannelDocument.count({ where: whereClause });

    // Fetch documents with pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const channelDocuments = await MediaChannelDocument.findAll({
      where: whereClause,
      order: [['document_year', 'DESC'], ['document_month', 'DESC'], ['document_date', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Format documents for frontend consumption
    const formattedDocuments = channelDocuments.map(doc => ({
      id: doc.id,
      title: doc.file_name || `Issue ${doc.document_date}/${doc.document_month}/${doc.document_year}`,
      document_type: doc.document_path?.split('.').pop()?.toUpperCase() || 'PDF',
      file_url: doc.document_url,
      thumbnail_url: null, // Could be added for PDF preview
      file_size: doc.file_size,
      year: doc.document_year,
      month: doc.document_month,
      date: doc.document_date,
      created_at: doc.created_at
    }));

    // Calculate pagination info
    const hasMore = offset + channelDocuments.length < totalCount;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        documents: formattedDocuments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages,
          hasMore
        }
      }
    });
  } catch (error) {
    console.error('Error fetching channel documents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents', error: error.message });
  }
};

/**
 * Get gallery images for an album
 * GET /api/v1/mymedia/gallery/:albumId/images
 */
export const getGalleryImages = async (req, res) => {
  try {
    const { albumId } = req.params;

    const images = await MediaGalleryImages.findAll({
      where: { album_id: albumId, is_active: 1 },
      order: [['sort_order', 'ASC']]
    });

    res.json({ success: true, data: images });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch gallery images', error: error.message });
  }
};

/**
 * Get TV stream URL for a channel
 * GET /api/v1/mymedia/channel/:channelId/stream
 */
export const getChannelStream = async (req, res) => {
  try {
    const { channelId } = req.params;

    const switcher = await MediaSwitcher.findOne({
      where: { media_channel_id: channelId }
    });

    if (!switcher) {
      return res.status(404).json({ success: false, message: 'Stream not configured' });
    }

    let streamUrl = null;
    let offlineMedia = null;

    switch (switcher.active_source) {
      case 'live':
        streamUrl = switcher.live_url;
        break;
      case 'mymedia':
        streamUrl = switcher.mymedia_url;
        break;
      case 'offline':
        if (switcher.offline_media_id) {
          offlineMedia = await MediaOfflineMedia.findByPk(switcher.offline_media_id);
          streamUrl = offlineMedia?.media_file_url;
        }
        break;
    }

    res.json({
      success: true,
      data: {
        activeSource: switcher.active_source,
        streamUrl,
        offlineMedia
      }
    });
  } catch (error) {
    console.error('Error fetching channel stream:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stream', error: error.message });
  }
};

/**
 * Increment view count for a channel
 * POST /api/v1/mymedia/channel/:channelId/view
 */
export const incrementViewCount = async (req, res) => {
  try {
    const { channelId } = req.params;

    const [interaction, created] = await MediaInteractions.findOrCreate({
      where: { media_channel_id: channelId },
      defaults: { views_count: 1 }
    });

    if (!created) {
      await interaction.increment('views_count');
    }

    res.json({ success: true, data: { views_count: interaction.views_count + (created ? 0 : 1) } });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    res.status(500).json({ success: false, message: 'Failed to increment view count' });
  }
};

/**
 * Get top icons for an app
 * GET /api/v1/apps/:appId/top-icons
 */
export const getAppTopIcons = async (req, res) => {
  try {
    const { appId } = req.params;

    // Get all apps in the same group (apps_name) as the requested app
    const app = await GroupCreate.findByPk(appId, {
      include: [{
        model: CreateDetails,
        as: 'details',
        required: false
      }]
    });

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'App not found'
      });
    }

    // Get all apps with the same apps_name (e.g., "My Apps")
    const topIcons = await GroupCreate.findAll({
      where: {
        apps_name: app.apps_name,
        id: { [Op.ne]: appId } // Exclude current app
      },
      include: [{
        model: CreateDetails,
        as: 'details',
        required: false
      }],
      order: [['order_by', 'ASC'], ['id', 'ASC']]
    });

    const formattedIcons = topIcons.map(icon => ({
      id: icon.id,
      name: icon.name,
      icon: icon.details?.icon || '',
      url: icon.details?.url || `/mobile/${icon.name.toLowerCase().replace(/\s+/g, '-')}`
    }));

    res.json({
      success: true,
      data: formattedIcons
    });
  } catch (error) {
    console.error('Error fetching top icons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top icons',
      error: error.message
    });
  }
};

/**
 * Get ads/carousel for an app
 * GET /api/v1/apps/:appId/ads
 */
export const getAppAds = async (req, res) => {
  try {
    const { appId } = req.params;

    // Get header ads for the app
    const headerAds = await HeaderAdsManagement.findAll({
      where: { app_id: appId }
    });

    // Get company ads for the app
    const companyAds = await CompanyAdsManagement.findAll({
      where: { app_id: appId }
    });

    // Combine and format ads
    const allAds = [
      ...headerAds.map(ad => ({
        id: ad.id,
        type: 'header',
        image: ad.file_path || '',
        title: `Header Ad ${ad.id}`,
        url: ad.url || '#'
      })),
      ...companyAds.map(ad => ({
        id: ad.id,
        type: 'company',
        image: ad.file_path || '',
        title: `Company Ad ${ad.id}`,
        url: ad.url || '#'
      }))
    ];

    res.json({
      success: true,
      data: allAds
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ads',
      error: error.message
    });
  }
};

