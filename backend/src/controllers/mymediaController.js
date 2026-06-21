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
  CompanyAdsManagement,
  UserRegistration,
  MediaComments
} from '../models/index.js';
import { getSignedReadUrl, resolveStorageReadUrl, getObjectStream, extractWasabiKey } from '../services/wasabiService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper: Generate signed URL for a media_logo stored in Wasabi
 */
const getMediaLogoUrl = async (mediaLogo) => {
  if (!mediaLogo) return null;
  if (mediaLogo.startsWith('/')) return mediaLogo; // local path
  try {
    const signed = await getSignedReadUrl(mediaLogo, 3600);
    if (signed.success) return signed.signedUrl;
  } catch (e) {
    console.error('Signed URL for media_logo failed:', e);
  }
  return null;
};

const toEmbedUrl = (url) => {
  const t = (url || '').trim();
  if (!t) return '';
  const ytMatch = t.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&playsinline=1`;
  if (/youtube\.com\/embed\//i.test(t)) {
    return t.includes('autoplay') ? t : `${t}${t.includes('?') ? '&' : '?'}autoplay=1`;
  }
  return t;
};

const isEmbeddableUrl = (url) => {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes('youtube.com') || u.includes('youtu.be') || u.includes('vimeo.com') || u.includes('dailymotion.com') || u.includes('/embed');
};

/** Resolve DB path or URL to a browser-playable URL (signed Wasabi when needed). */
const resolvePlayableMediaUrl = async (raw, expiresIn = 3600) => {
  return resolveStorageReadUrl(raw, expiresIn);
};

/**
 * MYMEDIA CONTROLLER
 * Handles public MyMedia page data fetching
 */

/** Resolve app id from query (appId or appName) with MyMedia fallback */
const resolveTargetAppId = async (req) => {
  const { appId, appName } = req.query;
  if (appId) {
    const id = parseInt(appId, 10);
    if (!Number.isNaN(id)) return id;
  }
  if (appName) {
    const app = await GroupCreate.findOne({
      where: { name: { [Op.like]: `%${appName}%` } }
    });
    if (app) return app.id;
  }
  const fallback = await GroupCreate.findOne({
    where: { name: { [Op.like]: '%mymedia%' } }
  });
  return fallback?.id ?? null;
};

/**
 * Viewer default location from user_registration_form (FK → country_tbl, state_tbl, district_tbl)
 * GET /api/v1/mymedia/viewer-location
 * Requires auth
 */
export const getViewerLocation = async (req, res) => {
  try {
    const registration = await UserRegistration.findOne({
      where: { user_id: req.user.id },
      include: [
        { model: Country, as: 'setCountryData', required: false },
        { model: State, as: 'setStateData', required: false },
        { model: District, as: 'setDistrictData', required: false },
        { model: Country, as: 'countryData', required: false },
        { model: State, as: 'stateData', required: false },
        { model: District, as: 'districtData', required: false }
      ]
    });

    if (!registration) {
      return res.json({
        success: true,
        data: { country_id: null, state_id: null, district_id: null }
      });
    }

    const reg = registration.toJSON();
    const toInt = (v) => {
      if (v == null || v === '') return null;
      const n = parseInt(String(v), 10);
      return Number.isNaN(n) ? null : n;
    };

    let countryId = toInt(reg.set_country) ?? toInt(reg.country) ?? null;
    let stateId = toInt(reg.set_state) ?? toInt(reg.state) ?? null;
    let districtId = toInt(reg.set_district) ?? toInt(reg.district) ?? null;

    if (!countryId && reg.nationality) {
      const nat = String(reg.nationality).trim();
      const byNat = await Country.findOne({
        where: {
          [Op.or]: [{ nationality: nat }, { country: nat }]
        }
      });
      if (byNat) countryId = byNat.id;
    }

    let country = null;
    let state = null;
    let district = null;

    if (countryId) {
      country = await Country.findByPk(countryId);
      if (!country) countryId = null;
    }

    if (countryId && stateId) {
      state = await State.findOne({ where: { id: stateId, country_id: countryId } });
      if (!state) stateId = null;
    }

    if (stateId && districtId) {
      district = await District.findOne({ where: { id: districtId, state_id: stateId } });
      if (!district) districtId = null;
    }

    res.json({
      success: true,
      data: {
        country_id: country?.id ?? null,
        state_id: state?.id ?? null,
        district_id: district?.id ?? null,
        country_name: country?.country ?? reg.setCountryData?.country ?? reg.countryData?.country ?? null,
        state_name: state?.state ?? reg.setStateData?.state ?? reg.stateData?.state ?? null,
        district_name: district?.district ?? reg.setDistrictData?.district ?? reg.districtData?.district ?? null
      }
    });
  } catch (error) {
    console.error('Error fetching viewer location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch viewer location',
      error: error.message
    });
  }
};

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
 * - status uses 'active' (media_channel.status ENUM: pending, active, inactive, rejected)
 * - category_id = footer parent (TV, Radio, etc.); parent_category_id = subcategory filter
 */
export const getMyMediaChannels = async (req, res) => {
  try {
    const { type, country_id, state_id, district_id, category_id, parent_category_id, language_id, include_latest_document } = req.query;

    const targetAppId = await resolveTargetAppId(req);
    if (!targetAppId) {
      return res.status(404).json({
        success: false,
        message: 'App not found'
      });
    }

    // Build where clause: app_id, is_active, and status = 'active' (schema has pending|active|inactive|rejected, not 'approved')
    const whereClause = {
      app_id: targetAppId,
      is_active: 1,
      status: 'active'
    };

    if (type) whereClause.select_type = type;
    if (country_id) whereClause.country_id = parseInt(country_id, 10);
    if (state_id) whereClause.state_id = parseInt(state_id, 10);
    if (district_id) whereClause.district_id = parseInt(district_id, 10);
    if (category_id) whereClause.category_id = parseInt(category_id, 10);
    if (parent_category_id) whereClause.parent_category_id = parseInt(parent_category_id, 10);
    if (language_id) whereClause.language_id = parseInt(language_id, 10);

    const channels = await MediaChannel.findAll({
      where: whereClause,
      attributes: [
        'id', 'media_logo', 'media_name_english', 'media_name_regional',
        'select_type', 'category_id', 'parent_category_id', 'language_id', 'media_url'
      ],
      include: [
        {
          model: AppCategory,
          as: 'category',
          attributes: ['id', 'category_name', 'category_type', 'parent_id']
        },
        {
          model: AppCategory,
          as: 'parentCategory',
          attributes: ['id', 'category_name', 'category_type', 'parent_id'],
          required: false
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

    if (process.env.NODE_ENV !== 'production') {
      console.log('[mymedia/channels]', { appId: targetAppId, whereClause, count: channels.length });
    }

    // Optional: attach latest document per channel (E-Paper / Magazine list cards)
    let latestDocByChannel = {};
    if (include_latest_document === '1' && channels.length > 0) {
      const channelIds = channels.map((c) => c.id);
      const docWhere = { media_channel_id: { [Op.in]: channelIds }, status: 1 };
      const { year, month } = req.query;
      if (year) docWhere.document_year = parseInt(year, 10);
      if (month) docWhere.document_month = parseInt(month, 10);

      const allDocs = await MediaChannelDocument.findAll({
        where: docWhere,
        order: [
          ['media_channel_id', 'ASC'],
          ['document_year', 'DESC'],
          ['document_month', 'DESC'],
          ['document_date', 'DESC']
        ]
      });

      for (const doc of allDocs) {
        if (!latestDocByChannel[doc.media_channel_id]) {
          const fileUrl = await resolveStorageReadUrl(doc.document_path || doc.document_url, 3600);
          latestDocByChannel[doc.media_channel_id] = {
            id: doc.id,
            title: doc.file_name || `Issue ${doc.document_date}/${doc.document_month}/${doc.document_year}`,
            file_url: fileUrl,
            year: doc.document_year,
            month: doc.document_month,
            date: doc.document_date
          };
        }
      }
    }

    // Add signed URLs for Wasabi-stored media logos
    const channelsWithUrls = await Promise.all(channels.map(async (channel) => {
      const json = channel.toJSON();
      const mediaLogoUrl = await getMediaLogoUrl(json.media_logo);
      return {
        ...json,
        media_logo_url: mediaLogoUrl || json.media_logo,
        latest_document: latestDocByChannel[channel.id] || null
      };
    }));

    res.json({
      success: true,
      data: channelsWithUrls
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

const toDateOnlyString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getWeekRangeForDate = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStartStr: toDateOnlyString(monday),
    weekEndStr: toDateOnlyString(sunday)
  };
};

/**
 * Get schedules for a channel on a specific calendar day
 * GET /api/v1/mymedia/schedules/:channelId
 * Query params: scheduleDate (YYYY-MM-DD, preferred), weekStart + day (legacy)
 */
export const getMyMediaSchedules = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { scheduleDate, weekStart, day } = req.query;

    const channel = await MediaChannel.findOne({
      where: { id: channelId, is_active: 1 }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found or not active'
      });
    }

    let targetDateStr;
    if (scheduleDate) {
      targetDateStr = scheduleDate;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (day !== undefined && day !== null && day !== '') {
        const offset = parseInt(day, 10) - today.getDay();
        const d = new Date(today);
        d.setDate(d.getDate() + offset);
        targetDateStr = toDateOnlyString(d);
      } else {
        targetDateStr = toDateOnlyString(today);
      }
    }

    const targetDate = new Date(`${targetDateStr}T12:00:00`);
    const dayOfWeek = targetDate.getDay();
    const { weekStartStr, weekEndStr } = weekStart
      ? getWeekRangeForDate(weekStart)
      : getWeekRangeForDate(targetDateStr);

    const schedules = await MediaSchedule.findAll({
      where: {
        media_channel_id: channelId,
        [Op.or]: [
          { original_schedule_id: null },
          { schedule_date: { [Op.between]: [weekStartStr, weekEndStr] } }
        ]
      },
      include: [{
        model: MediaScheduleSlot,
        as: 'slots',
        required: false
      }],
      order: [['schedule_date', 'ASC']]
    });

    const formattedSchedules = [];

    for (const schedule of schedules) {
      const slots = (schedule.slots || []).slice().sort((a, b) =>
        String(a.start_time).localeCompare(String(b.start_time))
      );
      if (!slots.length) continue;

      const isMaster = schedule.original_schedule_id === null;

      if (isMaster) {
        if (schedule.day_of_week !== dayOfWeek) continue;

        const hasOverride = schedules.some(
          (s) => s.original_schedule_id === schedule.id && s.schedule_date === targetDateStr
        );
        if (hasOverride) continue;
      } else if (schedule.schedule_date !== targetDateStr) {
        continue;
      }

      const mediaFileUrl = schedule.media_file
        ? await resolvePlayableMediaUrl(schedule.media_file)
        : null;

      formattedSchedules.push({
        id: schedule.id,
        title: schedule.title,
        media_file: schedule.media_file,
        media_file_url: mediaFileUrl,
        schedule_date: targetDateStr,
        day_of_week: schedule.day_of_week,
        slots: slots.map((slot) => ({
          id: slot.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_recurring: slot.is_recurring,
          status: slot.status
        }))
      });
    }

    res.json({
      success: true,
      data: {
        channel: {
          id: channel.id,
          name: channel.media_name_english,
          logo: channel.media_logo
        },
        scheduleDate: targetDateStr,
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
    const { type, country_id, state_id, district_id, language_id, parent_category_id, page = 1, limit = 20 } = req.query;

    const targetAppId = await resolveTargetAppId(req);
    if (!targetAppId) {
      return res.status(404).json({ success: false, message: 'App not found' });
    }

    // Find the parent category by name
    const parentCategory = await AppCategory.findOne({
      where: {
        app_id: targetAppId,
        category_name: { [Op.like]: `%${categoryName}%` },
        parent_id: null,
        status: 1
      }
    });

    if (!parentCategory) {
      return res.status(404).json({ success: false, message: `Category '${categoryName}' not found` });
    }

    // media_channel.category_id = footer parent; parent_category_id = subcategory
    const whereClause = {
      app_id: targetAppId,
      category_id: parentCategory.id,
      is_active: 1,
      status: 'active'
    };

    if (type) whereClause.select_type = type;
    if (country_id) whereClause.country_id = country_id;
    if (state_id) whereClause.state_id = state_id;
    if (district_id) whereClause.district_id = district_id;
    if (language_id) whereClause.language_id = language_id;
    if (parent_category_id) whereClause.parent_category_id = parseInt(parent_category_id, 10);

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

    // Add signed URLs for Wasabi-stored media logos
    const channelsWithUrls = await Promise.all(channels.map(async (channel) => {
      const json = channel.toJSON();
      const mediaLogoUrl = await getMediaLogoUrl(json.media_logo);
      return { ...json, media_logo_url: mediaLogoUrl || json.media_logo };
    }));

    res.json({
      success: true,
      data: {
        channels: channelsWithUrls,
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

    // Add signed URL for Wasabi-stored media logo
    const channelJson = channel.toJSON();
    const mediaLogoUrl = await getMediaLogoUrl(channelJson.media_logo);
    channelJson.media_logo_url = mediaLogoUrl || channelJson.media_logo;

    // Sign newsletter file URLs for private Wasabi bucket
    const signedNewsletters = await Promise.all(newsletters.map(async (nl) => {
      const json = nl.toJSON();
      json.file_url = await resolveStorageReadUrl(nl.file_path || nl.file_url, 3600);
      return json;
    }));

    res.json({
      success: true,
      data: {
        channel: channelJson,
        socialLinks,
        awards,
        newsletters: signedNewsletters,
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
    if (year) whereClause.document_year = parseInt(year, 10);
    if (month) whereClause.document_month = parseInt(month, 10);

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

    // Format documents for frontend consumption (signed Wasabi URLs — bucket is private)
    const formattedDocuments = await Promise.all(channelDocuments.map(async (doc) => {
      const fileUrl = await resolveStorageReadUrl(doc.document_path || doc.document_url, 3600);
      return {
        id: doc.id,
        title: doc.file_name || `Issue ${doc.document_date}/${doc.document_month}/${doc.document_year}`,
        document_type: doc.document_path?.split('.').pop()?.toUpperCase() || 'PDF',
        file_url: fileUrl,
        thumbnail_url: null,
        file_size: doc.file_size,
        year: doc.document_year,
        month: doc.document_month,
        date: doc.document_date,
        created_at: doc.created_at
      };
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
 * Stream E-Paper/Magazine PDF inline (same-origin — works in mobile browsers + PDF.js).
 * GET /api/v1/mymedia/document/:documentId/stream
 */
export const streamChannelDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const doc = await MediaChannelDocument.findOne({
      where: { id: documentId, status: 1 },
      attributes: ['document_path', 'file_name']
    });

    if (!doc?.document_path) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const storagePath = doc.document_path;
    const filename = doc.file_name || 'document.pdf';
    const safeName = filename.replace(/[^\w.\-() ]+/g, '_');

    if (storagePath.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, '../../public', storagePath.replace(/^\/+/, ''));
      if (!fs.existsSync(localPath)) {
        return res.status(404).json({ success: false, message: 'File not found on server' });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
      return fs.createReadStream(localPath).pipe(res);
    }

    const wasabiKey = extractWasabiKey(storagePath) || storagePath.replace(/^\/+/, '');
    const result = await getObjectStream(wasabiKey);

    res.setHeader('Content-Type', result.ContentType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    if (result.ContentLength) {
      res.setHeader('Content-Length', String(result.ContentLength));
    }
    result.Body.pipe(res);
  } catch (error) {
    console.error('Error streaming document:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to stream document' });
    }
  }
};

/**
 * Get gallery images for an album (with signed Wasabi URLs)
 * GET /api/v1/mymedia/gallery/:albumId/images
 */
export const getGalleryImages = async (req, res) => {
  try {
    const { albumId } = req.params;

    const images = await MediaGalleryImages.findAll({
      where: { album_id: albumId, is_active: 1 },
      order: [['sort_order', 'ASC']]
    });

    // Resolve signed URLs for Wasabi-stored images
    const signedImages = await Promise.all(images.map(async (img) => {
      const json = img.toJSON();
      json.image_url = await resolveStorageReadUrl(img.image_path || img.image_url, 3600);
      json.thumbnail_url = img.thumbnail_path || img.thumbnail_url
        ? await resolveStorageReadUrl(img.thumbnail_path || img.thumbnail_url, 3600)
        : json.image_url;
      return json;
    }));

    res.json({ success: true, data: signedImages });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch gallery images', error: error.message });
  }
};

/**
 * Get reviews for a channel
 * GET /api/v1/mymedia/channel/:channelId/reviews
 * Query params: page, limit
 */
export const getChannelReviews = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await MediaComments.findAndCountAll({
      where: {
        media_channel_id: channelId,
        parent_id: null,
        is_active: 1
      },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Compute aggregate rating stats
    const ratingRows = await MediaComments.findAll({
      where: { media_channel_id: channelId, parent_id: null, is_active: 1, rating: { [Op.ne]: null } },
      attributes: ['rating']
    });

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;
    for (const r of ratingRows) {
      const v = parseInt(r.rating);
      if (v >= 1 && v <= 5) {
        ratingCounts[v] = (ratingCounts[v] || 0) + 1;
        ratingSum += v;
      }
    }
    const ratingTotal = ratingRows.length;
    const averageRating = ratingTotal > 0 ? (ratingSum / ratingTotal).toFixed(1) : null;

    res.json({
      success: true,
      data: {
        reviews: rows,
        pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) },
        stats: { average: averageRating ? parseFloat(averageRating) : null, total: ratingTotal, counts: ratingCounts }
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
};

/**
 * Post a review for a channel
 * POST /api/v1/mymedia/channel/:channelId/reviews
 * Body: { rating (1-5), reviewer_name, comment_text, reviewer_email? }
 */
export const postChannelReview = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { rating, reviewer_name, comment_text, reviewer_email } = req.body;

    if (!comment_text || comment_text.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Comment must be at least 3 characters' });
    }
    if (rating !== undefined && (parseInt(rating) < 1 || parseInt(rating) > 5)) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const review = await MediaComments.create({
      media_channel_id: channelId,
      user_id: null,
      comment_text: comment_text.trim(),
      rating: rating ? parseInt(rating) : null,
      reviewer_name: reviewer_name?.trim() || 'Anonymous',
      reviewer_email: reviewer_email?.trim() || null,
      is_active: 1
    });

    // Update comments_count in interactions
    await MediaInteractions.findOrCreate({ where: { media_channel_id: channelId }, defaults: {} });
    await MediaInteractions.increment('comments_count', { where: { media_channel_id: channelId } });

    res.json({ success: true, data: review });
  } catch (error) {
    console.error('Error posting review:', error);
    res.status(500).json({ success: false, message: 'Failed to post review', error: error.message });
  }
};

/**
 * Get TV stream URL for a channel
 * GET /api/v1/mymedia/channel/:channelId/stream
 */
export const getChannelStream = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { mediaFile } = req.query;

    if (mediaFile) {
      const resolved = await resolvePlayableMediaUrl(String(mediaFile));
      if (!resolved) {
        return res.status(404).json({ success: false, message: 'Media file not found' });
      }
      const playbackType = isEmbeddableUrl(resolved) || isEmbeddableUrl(String(mediaFile))
        ? 'iframe'
        : /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(String(mediaFile))
          ? 'audio'
          : 'video';
      return res.json({
        success: true,
        data: {
          activeSource: 'schedule',
          playbackType,
          streamUrl: resolved,
          embedUrl: playbackType === 'iframe' ? toEmbedUrl(resolved) || toEmbedUrl(String(mediaFile)) : null,
          offlineMedia: null
        }
      });
    }

    const switcher = await MediaSwitcher.findOne({
      where: { media_channel_id: channelId }
    });

    if (!switcher) {
      return res.status(404).json({ success: false, message: 'Stream not configured' });
    }

    let streamUrl = null;
    let embedUrl = null;
    let playbackType = 'none';
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
          if (offlineMedia) {
            const om = offlineMedia.toJSON();
            const resolvedFile = await resolvePlayableMediaUrl(om.media_file_url || om.media_file_path);
            om.media_file_url = resolvedFile || om.media_file_url;
            if (om.thumbnail_path) {
              om.thumbnail_url = await resolvePlayableMediaUrl(om.thumbnail_url || om.thumbnail_path) || om.thumbnail_url;
            }
            offlineMedia = om;
            streamUrl = om.media_file_url;
            playbackType = om.media_type === 'audio' ? 'audio' : 'video';
          }
        }
        break;
      default:
        break;
    }

    if (switcher.active_source === 'live' || switcher.active_source === 'mymedia') {
      const raw = streamUrl || '';
      if (isEmbeddableUrl(raw)) {
        playbackType = 'iframe';
        embedUrl = toEmbedUrl(raw);
        streamUrl = embedUrl;
      } else if (raw) {
        streamUrl = await resolvePlayableMediaUrl(raw);
        playbackType = 'video';
      }
    }

    if (!streamUrl && !embedUrl) {
      return res.status(404).json({ success: false, message: 'No playable stream for this channel' });
    }

    res.json({
      success: true,
      data: {
        activeSource: switcher.active_source,
        playbackType,
        streamUrl,
        embedUrl,
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
      await interaction.reload();
    }

    res.json({ success: true, data: { views_count: interaction.views_count } });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    res.status(500).json({ success: false, message: 'Failed to increment view count' });
  }
};

/**
 * Toggle like for a channel
 * POST /api/v1/mymedia/channel/:channelId/like
 * Body: { action: 'like' | 'unlike' }
 */
export const toggleLike = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { action } = req.body;

    const [interaction] = await MediaInteractions.findOrCreate({
      where: { media_channel_id: channelId },
      defaults: { likes_count: 0 }
    });

    if (action === 'unlike') {
      await interaction.decrement('likes_count');
    } else {
      await interaction.increment('likes_count');
    }
    await interaction.reload();

    res.json({ success: true, data: { likes_count: interaction.likes_count } });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
};

/**
 * Toggle follow for a channel
 * POST /api/v1/mymedia/channel/:channelId/follow
 * Body: { action: 'follow' | 'unfollow' }
 */
export const toggleFollow = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { action } = req.body;

    const [interaction] = await MediaInteractions.findOrCreate({
      where: { media_channel_id: channelId },
      defaults: { followers_count: 0 }
    });

    if (action === 'unfollow') {
      await interaction.decrement('followers_count');
    } else {
      await interaction.increment('followers_count');
    }
    await interaction.reload();

    res.json({ success: true, data: { followers_count: interaction.followers_count } });
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle follow' });
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

