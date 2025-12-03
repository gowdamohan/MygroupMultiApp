import CompanyAdsManagement from '../models/CompanyAdsManagement.js';
import GroupCreate from '../models/GroupCreate.js';
import AppCategory from '../models/AppCategory.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all "My Company" apps
export const getMyCompanyApps = async (req, res) => {
  try {
    const apps = await GroupCreate.findAll({
      where: { apps_name: 'My Company' },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: apps
    });
  } catch (error) {
    console.error('Error fetching My Company apps:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch apps'
    });
  }
};

// Get categories by app ID (parent categories only)
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
      message: 'Failed to fetch categories'
    });
  }
};

// Get all company ads
export const getCompanyAds = async (req, res) => {
  try {
    const ads = await CompanyAdsManagement.findAll({
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
    console.error('Error fetching company ads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company ads'
    });
  }
};

// Create company ad
export const createCompanyAd = async (req, res) => {
  try {
    const { app_id, app_category_id, url } = req.body;
    let file_path = null;

    if (req.file) {
      file_path = `/uploads/company-ads/${req.file.filename}`;
    }

    const ad = await CompanyAdsManagement.create({
      app_id,
      app_category_id,
      file_path,
      url
    });

    // Fetch the created ad with associations
    const createdAd = await CompanyAdsManagement.findByPk(ad.id, {
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

    res.status(201).json({
      success: true,
      message: 'Company ad created successfully',
      data: createdAd
    });
  } catch (error) {
    console.error('Error creating company ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create company ad'
    });
  }
};

// Update company ad
export const updateCompanyAd = async (req, res) => {
  try {
    const { id } = req.params;
    const { app_id, app_category_id, url } = req.body;

    const ad = await CompanyAdsManagement.findByPk(id);
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Company ad not found'
      });
    }

    let file_path = ad.file_path;

    // If new file uploaded, delete old file and update path
    if (req.file) {
      if (ad.file_path) {
        const oldFilePath = path.join(__dirname, '../../public', ad.file_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      file_path = `/uploads/company-ads/${req.file.filename}`;
    }

    await ad.update({
      app_id,
      app_category_id,
      file_path,
      url
    });

    // Fetch updated ad with associations
    const updatedAd = await CompanyAdsManagement.findByPk(id, {
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
      message: 'Company ad updated successfully',
      data: updatedAd
    });
  } catch (error) {
    console.error('Error updating company ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company ad'
    });
  }
};

// Delete company ad
export const deleteCompanyAd = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await CompanyAdsManagement.findByPk(id);
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Company ad not found'
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
      message: 'Company ad deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting company ad:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete company ad'
    });
  }
};
