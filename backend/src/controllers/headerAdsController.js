import { HeaderAdsManagement, GroupCreate, AppCategory } from '../models/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ============================================
 * HEADER ADS MANAGEMENT
 * ============================================
 */

// Get all "My Apps" apps
export const getMyApps = async (req, res) => {
  try {
    const apps = await GroupCreate.findAll({
      where: { apps_name: 'My Apps' },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: apps
    });
  } catch (error) {
    console.error('Error fetching My Apps:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch apps',
      error: error.message
    });
  }
};

// Get categories by app_id (only parent categories)
export const getCategoriesByApp = async (req, res) => {
  try {
    const { appId } = req.params;

    const categories = await AppCategory.findAll({
      where: { 
        app_id: appId,
        parent_id: null 
      },
      attributes: ['id', 'category_name'],
      order: [['category_name', 'ASC']]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get all header ads grouped by app and category
export const getHeaderAds = async (req, res) => {
  try {
    const ads = await HeaderAdsManagement.findAll({
      include: [
        {
          model: GroupCreate,
          as: 'app',
          attributes: ['id', 'name']
        },
        {
          model: AppCategory,
          as: 'category',
          attributes: ['id', 'category_name']
        }
      ],
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      data: ads
    });
  } catch (error) {
    console.error('Error fetching header ads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch header ads',
      error: error.message
    });
  }
};

// Create header ad
export const createHeaderAd = async (req, res) => {
  try {
    const { app_id, app_category_id, url } = req.body;
    let file_path = null;

    // Handle file upload
    if (req.file) {
      file_path = `/uploads/header-ads/${req.file.filename}`;
    }

    const ad = await HeaderAdsManagement.create({
      app_id,
      app_category_id,
      file_path,
      url
    });

    // Fetch the created ad with associations
    const createdAd = await HeaderAdsManagement.findByPk(ad.id, {
      include: [
        {
          model: GroupCreate,
          as: 'app',
          attributes: ['id', 'name']
        },
        {
          model: AppCategory,
          as: 'category',
          attributes: ['id', 'category_name']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Header ad created successfully',
      data: createdAd
    });
  } catch (error) {
    console.error('Error creating header ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create header ad',
      error: error.message
    });
  }
};

// Update header ad
export const updateHeaderAd = async (req, res) => {
  try {
    const { id } = req.params;
    const { app_id, app_category_id, url } = req.body;

    const ad = await HeaderAdsManagement.findByPk(id);
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Header ad not found'
      });
    }

    let file_path = ad.file_path;

    // Handle file upload
    if (req.file) {
      // Delete old file if exists
      if (ad.file_path) {
        const oldFilePath = path.join(__dirname, '../../public', ad.file_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      file_path = `/uploads/header-ads/${req.file.filename}`;
    }

    await ad.update({
      app_id,
      app_category_id,
      file_path,
      url
    });

    // Fetch updated ad with associations
    const updatedAd = await HeaderAdsManagement.findByPk(id, {
      include: [
        {
          model: GroupCreate,
          as: 'app',
          attributes: ['id', 'name']
        },
        {
          model: AppCategory,
          as: 'category',
          attributes: ['id', 'category_name']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Header ad updated successfully',
      data: updatedAd
    });
  } catch (error) {
    console.error('Error updating header ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update header ad',
      error: error.message
    });
  }
};

// Delete header ad
export const deleteHeaderAd = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await HeaderAdsManagement.findByPk(id);
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Header ad not found'
      });
    }

    // Delete file if exists
    if (ad.file_path) {
      const filePath = path.join(__dirname, '../../public', ad.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await ad.destroy();

    res.json({
      success: true,
      message: 'Header ad deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting header ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete header ad',
      error: error.message
    });
  }
};

