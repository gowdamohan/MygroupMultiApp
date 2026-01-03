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
  MediaScheduleSlot
} from '../models/index.js';

/**
 * MYMEDIA CONTROLLER
 * Handles public MyMedia page data fetching
 */

/**
 * Get MyMedia app details
 * GET /api/v1/mymedia/app
 */
export const getMyMediaApp = async (req, res) => {
  try {
    const app = await GroupCreate.findOne({
      where: { name: { [Op.like]: '%mymedia%' } },
      include: [{
        model: CreateDetails,
        as: 'details',
        required: false
      }]
    });

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'MyMedia app not found'
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
    console.error('Error fetching MyMedia app:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MyMedia app',
      error: error.message
    });
  }
};

/**
 * Get categories for MyMedia app (parent categories)
 * GET /api/v1/mymedia/categories
 */
export const getMyMediaCategories = async (req, res) => {
  try {
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

    // Get parent categories for this app
    const categories = await AppCategory.findAll({
      where: {
        app_id: app.id,
        parent_id: null,
        status: 1
      },
      order: [['sort_order', 'ASC'], ['category_name', 'ASC']]
    });

    // Get child categories for each parent
    const categoriesWithChildren = await Promise.all(
      categories.map(async (category) => {
        const children = await AppCategory.findAll({
          where: {
            parent_id: category.id,
            status: 1
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

    // Build where clause - filter by media_type = 'Tv'
    const whereClause = {
      app_id: app.id,
      is_active: 1,
      status: 'approved',
      media_type: 'Tv'
    };

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

