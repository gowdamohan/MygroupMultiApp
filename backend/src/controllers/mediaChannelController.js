import { Op } from 'sequelize';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import {
  MediaChannel,
  AppCategory,
  User,
  GroupCreate,
  Country,
  State,
  District,
  Language
} from '../models/index.js';

/**
 * Get categories by app_id with registration count check
 * GET /api/v1/partner/media-categories/:appId
 */
export const getMediaCategories = async (req, res) => {
  try {
    const { appId } = req.params;
    const userId = req.user?.id; // From auth middleware

    // Get all categories for this app (parent categories only)
    const categories = await AppCategory.findAll({
      where: {
        app_id: appId,
        parent_id: null,
        status: 1
      },
      order: [['sort_order', 'ASC'], ['category_name', 'ASC']]
    });

    // For each category, count existing registrations by this user
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const registrationCount = await MediaChannel.count({
          where: {
            user_id: userId,
            category_id: category.id,
            app_id: appId
          }
        });

        const maxCount = category.registration_count || 1;
        const isDisabled = registrationCount >= maxCount;

        return {
          id: category.id,
          category_name: category.category_name,
          category_type: category.category_type,
          category_image: category.category_image,
          registration_count: maxCount,
          current_registrations: registrationCount,
          is_disabled: isDisabled
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCount
    });
  } catch (error) {
    console.error('Get media categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching media categories',
      error: error.message
    });
  }
};

/**
 * Get parent category by category_id
 * GET /api/v1/partner/media-categories/:categoryId/parent
 */
export const getParentCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await AppCategory.findByPk(categoryId, {
      include: [
        {
          model: AppCategory,
          as: 'parent',
          attributes: ['id', 'category_name']
        }
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: {
        parent_id: category.parent_id,
        parent_name: category.parent?.category_name || null
      }
    });
  } catch (error) {
    console.error('Get parent category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching parent category',
      error: error.message
    });
  }
};

/**
 * Get sub-categories by app_id and parent_id with registration count check
 * GET /api/v1/partner/media-sub-categories/:appId/:parentId
 */
export const getMediaSubCategories = async (req, res) => {
  try {
    const { appId, parentId } = req.params;
    const userId = req.user?.id;

    // Get all sub-categories for this parent category
    const subCategories = await AppCategory.findAll({
      where: {
        app_id: appId,
        parent_id: parentId,
        status: 1
      },
      order: [['sort_order', 'ASC'], ['category_name', 'ASC']]
    });

    // For each sub-category, count existing registrations by this user
    const subCategoriesWithCount = await Promise.all(
      subCategories.map(async (subCat) => {
        const registrationCount = await MediaChannel.count({
          where: {
            user_id: userId,
            category_id: subCat.id,
            app_id: appId
          }
        });

        const maxCount = subCat.registration_count || 1;
        const isDisabled = registrationCount >= maxCount;

        return {
          id: subCat.id,
          category_name: subCat.category_name,
          category_type: subCat.category_type,
          registration_count: maxCount,
          current_registrations: registrationCount,
          is_disabled: isDisabled
        };
      })
    );

    res.json({
      success: true,
      data: subCategoriesWithCount
    });
  } catch (error) {
    console.error('Get media sub-categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching media sub-categories',
      error: error.message
    });
  }
};

/**
 * Get all languages
 * GET /api/v1/partner/languages
 */
export const getLanguages = async (req, res) => {
  try {
    const languages = await Language.findAll({
      attributes: ['id', 'lang_1', 'lang_2', 'country_id'],
      order: [['lang_1', 'ASC']]
    });

    res.json({
      success: true,
      data: languages
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching languages',
      error: error.message
    });
  }
};

/**
 * Helper function to compress image to ~100KB
 */
const compressImage = async (inputPath, outputPath) => {
  try {
    let quality = 80;
    let compressed = false;

    while (!compressed && quality > 10) {
      await sharp(inputPath)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality, progressive: true })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      const fileSizeKB = stats.size / 1024;

      if (fileSizeKB <= 100) {
        compressed = true;
      } else {
        quality -= 10;
        fs.unlinkSync(outputPath); // Delete and try again
      }
    }

    return outputPath;
  } catch (error) {
    console.error('Image compression error:', error);
    throw error;
  }
};

/**
 * Create media channel registration
 * POST /api/v1/partner/media-channel
 */
export const createMediaChannel = async (req, res) => {
  try {
    const userId = req.user?.id;
    const {
      app_id,
      category_id,
      select_type,
      country_id,
      state_id,
      district_id,
      language_id,
      media_name_english,
      media_name_regional,
      periodical_type,
      periodical_schedule
    } = req.body;

    // Validate required fields
    if (!app_id || !category_id || !select_type || !media_name_english) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get category details
    const category = await AppCategory.findByPk(category_id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check registration count limit
    const existingCount = await MediaChannel.count({
      where: {
        user_id: userId,
        category_id: category_id,
        app_id: app_id
      }
    });

    const maxCount = category.registration_count || 1;
    if (existingCount >= maxCount) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxCount} registration(s) allowed for this category`
      });
    }

    // Handle file upload and compression
    let mediaLogoPath = null;
    if (req.file) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'media-logos');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const timestamp = Date.now();
      const filename = `media-logo-${userId}-${timestamp}.jpg`;
      const outputPath = path.join(uploadDir, filename);

      await compressImage(req.file.path, outputPath);

      // Delete original uploaded file
      fs.unlinkSync(req.file.path);

      mediaLogoPath = `/uploads/media-logos/${filename}`;
    }

    // Create media channel record
    const mediaChannel = await MediaChannel.create({
      user_id: userId,
      app_id,
      category_id,
      parent_category_id: category.parent_id,
      media_type: category.category_name,
      select_type,
      country_id: country_id || null,
      state_id: state_id || null,
      district_id: district_id || null,
      language_id: language_id || null,
      media_name_english,
      media_name_regional: media_name_regional || null,
      media_logo: mediaLogoPath,
      periodical_type: periodical_type || null,
      periodical_schedule: periodical_schedule ? JSON.parse(periodical_schedule) : null,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Media channel registered successfully',
      data: mediaChannel
    });
  } catch (error) {
    console.error('Create media channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating media channel',
      error: error.message
    });
  }
};

/**
 * Get all media channels for the logged-in user
 * GET /api/v1/partner/my-channels
 */
export const getMyChannels = async (req, res) => {
  try {
    const userId = req.user.id;

    const channels = await MediaChannel.findAll({
      where: {
        user_id: userId
      },
      attributes: [
        'id',
        'media_logo',
        'media_name_english',
        'media_name_regional',
        'status',
        'created_at'
      ],
      order: [['created_at', 'DESC']]
    });

    // Add placeholder values for followers, ratings, earnings (can be implemented later)
    const channelsWithStats = channels.map(channel => ({
      ...channel.toJSON(),
      followers: 0,
      ratings: 0,
      earnings: 0
    }));

    res.json({
      success: true,
      data: channelsWithStats
    });
  } catch (error) {
    console.error('Get my channels error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching channels',
      error: error.message
    });
  }
};

/**
 * Delete a media channel
 * DELETE /api/v1/partner/my-channels/:id
 */
export const deleteMyChannel = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const channel = await MediaChannel.findOne({
      where: {
        id: id,
        user_id: userId
      }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    await channel.destroy();

    res.json({
      success: true,
      message: 'Channel deleted successfully'
    });
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting channel',
      error: error.message
    });
  }
};
