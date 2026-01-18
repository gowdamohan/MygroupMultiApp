import { HeaderAdsManagement, GroupCreate, AppCategory, HeaderAdsPricing, FranchiseHolder, HeaderAdsSlot, HeaderAdsPricingSlave, HeaderAdsPricingMaster } from '../models/index.js';
import { Op } from 'sequelize';
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

// Get pricing data for date range
export const getPricing = async (req, res) => {
  try {
    const { app_id, category_id, start_date, end_date } = req.query;

    // Get franchise holder's country_id if user is a franchise holder
    let countryId = null;
    let pricingSlot = 'General'; // Default to General, can be made configurable
    
    if (req.user && req.user.id) {
      const { FranchiseHolder } = await import('../models/index.js');
      const franchiseHolder = await FranchiseHolder.findOne({
        where: { user_id: req.user.id }
      });
      if (franchiseHolder && franchiseHolder.country) {
        countryId = franchiseHolder.country;
      }
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    const pricingData = [];

    // Get existing bookings from header_ads_slot
    const existingSlots = await HeaderAdsSlot.findAll({
      include: [{
        model: HeaderAdsManagement,
        as: 'headerAd',
        where: {
          app_id,
          category_id
        },
        attributes: []
      }],
      where: {
        selected_date: {
          [Op.between]: [start_date, end_date]
        },
        is_active: 1
      },
      attributes: ['selected_date']
    });

    // Create a set of booked dates
    const bookedDates = new Set(existingSlots.map(slot => slot.selected_date));

    // Step 1: Get pricing from header_ads_pricing_slave table first
    let slavePriceMap = new Map();
    
    if (countryId) {
      // Get master record for this country and pricing slot
      const masterRecord = await HeaderAdsPricingMaster.findOne({
        where: {
          country_id: countryId,
          pricing_slot: pricingSlot,
          ads_type: 'header_ads'
        },
        order: [['created_at', 'DESC']]
      });

      if (masterRecord) {
        // Get slave pricing records for this app/category combination
        const slaveRecords = await HeaderAdsPricingSlave.findAll({
          where: {
            header_ads_pricing_master_id: masterRecord.id,
            app_id: parseInt(app_id),
            category_id: parseInt(category_id),
            selected_date: {
              [Op.between]: [start_date, end_date]
            }
          }
        });

        // Map slave prices by date
        slaveRecords.forEach(record => {
          slavePriceMap.set(record.selected_date, parseFloat(record.my_coins) || 0);
        });

        // Master price as fallback
        const masterPrice = parseFloat(masterRecord.my_coins) || 0;

        // Generate pricing data for all dates in range
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          
          // Use slave price if available, otherwise use master price
          const price = slavePriceMap.has(dateStr) 
            ? slavePriceMap.get(dateStr) 
            : masterPrice;
          
          pricingData.push({
            date: dateStr,
            price: price,
            is_booked: bookedDates.has(dateStr)
          });
        }

        return res.json({
          success: true,
          data: pricingData
        });
      }
    }

    // Step 2: Fallback to header_ads_pricing table (legacy) if no master/slave data
    const pricingRecords = await HeaderAdsPricing.findAll({
      where: {
        app_id,
        category_id,
        ad_date: {
          [Op.between]: [start_date, end_date]
        }
      }
    });

    // Create a map of date to price
    const priceMap = new Map();
    pricingRecords.forEach(record => {
      priceMap.set(record.ad_date, parseFloat(record.price));
    });

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      pricingData.push({
        date: dateStr,
        price: priceMap.get(dateStr) || 0,
        is_booked: bookedDates.has(dateStr)
      });
    }

    res.json({
      success: true,
      data: pricingData
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing',
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
    const { app_id, category_id, link_url, dates } = req.body;
    const userId = req.user.id;
    let file_path = null;

    if (req.file) {
      file_path = `/uploads/header-ads/${req.file.filename}`;
    }

    const selectedDates = typeof dates === 'string' ? JSON.parse(dates) : dates;

    if (!selectedDates || selectedDates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one date must be selected'
      });
    }

    // Get franchise_holder_id from franchise_holder table
    const franchiseHolder = await FranchiseHolder.findOne({
      where: { user_id: userId }
    });

    if (!franchiseHolder) {
      return res.status(400).json({
        success: false,
        message: 'Franchise holder not found for this user'
      });
    }

    // Get pricing for selected dates
    const pricingRecords = await HeaderAdsPricing.findAll({
      where: {
        app_id,
        category_id,
        ad_date: {
          [Op.in]: selectedDates
        }
      }
    });

    // Create price map
    const priceMap = new Map();
    pricingRecords.forEach(record => {
      priceMap.set(record.ad_date, parseFloat(record.price));
    });

    // Calculate total price
    const total_price = selectedDates.reduce((sum, date) => sum + (priceMap.get(date) || 0), 0);

    // Create header ad
    const ad = await HeaderAdsManagement.create({
      app_id,
      category_id,
      file_path,
      link_url,
      total_price,
      status: 'pending',
      franchise_holder_id: franchiseHolder.id,
      created_by: userId
    });

    // Create header_ads_slot records for each selected date
    const slotRecords = selectedDates.map(date => ({
      header_ads_id: ad.id,
      selected_date: date,
      price: priceMap.get(date) || 0,
      impressions: 0,
      clicks: 0,
      is_active: 1
    }));

    await HeaderAdsSlot.bulkCreate(slotRecords);

    // Fetch created ad with associations
    const createdAd = await HeaderAdsManagement.findByPk(ad.id, {
      include: [
        { model: GroupCreate, as: 'app', attributes: ['id', 'name'] },
        { model: AppCategory, as: 'category', attributes: ['id', 'category_name'] },
        { model: HeaderAdsSlot, as: 'slots' }
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
    const { app_id, category_id, url } = req.body;

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
      category_id,
      file_path,
      link_url: url
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

