import { HeaderAdsManagement, HeaderAdsManagementCorporate, GroupCreate, AppCategory, HeaderAdsPricing, FranchiseHolder, HeaderAdsSlot, HeaderAdsPricingSlave, HeaderAdsPricingMaster, User, UserGroup, Group } from '../models/index.js';
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
      order: [['order_by', 'ASC'], ['name', 'ASC']]
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

// Get pricing data for date range with office level multiplier
// Accepts optional group_name parameter: head_office_ads1, regional_ads1, branch_ads1, branch_ads2
export const getPricing = async (req, res) => {
  try {
    const { app_id, category_id, start_date, end_date, office_level, group_name } = req.query;

    // If group_name is provided, extract office_level from it
    let effectiveOfficeLevel = office_level;
    if (group_name && !office_level) {
      if (group_name.startsWith('head_office')) {
        effectiveOfficeLevel = 'head_office';
      } else if (group_name.startsWith('regional')) {
        effectiveOfficeLevel = 'regional';
      } else if (group_name.startsWith('branch')) {
        effectiveOfficeLevel = 'branch';
      }
    }

    // Get franchise holder's country_id if user is a franchise holder
    let countryId = null;
    let franchiseHolderId = null;
    let franchiseHolder = null;
    let pricingSlot = 'General'; // Default to General, can be made configurable

    if (req.user && req.user.id) {
      const { FranchiseHolder: FH, State, District, User, Group } = await import('../models/index.js');
      franchiseHolder = await FH.findOne({
        where: { user_id: req.user.id }
      });
      if (franchiseHolder) {
        franchiseHolderId = franchiseHolder.id;
        if (franchiseHolder.country) {
          countryId = franchiseHolder.country;
        }
      }

      // Calculate multiplier based on office level
      let multiplier = 1;
      // Use effectiveOfficeLevel (from group_name) if available, otherwise use office_level
      let actualOfficeLevel = effectiveOfficeLevel || office_level;

      if (!actualOfficeLevel && franchiseHolder) {
        // Get user's group to determine office level
        const user = await User.findByPk(req.user.id, {
          include: [{
            model: Group,
            as: 'groups',
            through: { attributes: [] },
            attributes: ['name']
          }]
        });

        if (user && user.groups && user.groups.length > 0) {
          const groupName = user.groups[0].name;
          if (groupName === 'head_office') actualOfficeLevel = 'head_office';
          else if (groupName === 'regional') actualOfficeLevel = 'regional';
          else actualOfficeLevel = 'branch';
        }
      }

      // Calculate multiplier based on office level
      if (actualOfficeLevel === 'head_office' && franchiseHolder && franchiseHolder.country) {
        // Head Office: state_count × district_count
        const states = await State.findAll({
          where: { country_id: franchiseHolder.country },
          attributes: ['id']
        });
        const stateCount = states.length || 1;

        const stateIds = states.map(s => s.id);
        let districtCount = 1;
        if (stateIds.length > 0) {
          districtCount = await District.count({
            where: { state_id: { [Op.in]: stateIds } }
          }) || 1;
        }

        multiplier = stateCount * districtCount;
      } else if (actualOfficeLevel === 'regional' && franchiseHolder && franchiseHolder.state) {
        // Regional Office: district_count for their state
        multiplier = await District.count({
          where: { state_id: franchiseHolder.state }
        }) || 1;
      }
      // Branch office: multiplier = 1

      req.calculatedMultiplier = multiplier;
      req.officeLevel = actualOfficeLevel;
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    const pricingData = [];
    const multiplier = req.calculatedMultiplier || 1;

    // Get existing bookings from header_ads_slot
    const existingSlots = await HeaderAdsSlot.findAll({
      include: [{
        model: HeaderAdsManagement,
        as: 'headerAd',
        where: {
          app_id,
          category_id,
          ...(franchiseHolderId ? { franchise_holder_id: franchiseHolderId } : {})
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

        // Generate pricing data for all dates in range with multiplier applied
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];

          // Use slave price if available, otherwise use master price
          const basePrice = slavePriceMap.has(dateStr)
            ? slavePriceMap.get(dateStr)
            : masterPrice;

          // Apply multiplier to get final price
          const finalPrice = basePrice * multiplier;

          pricingData.push({
            date: dateStr,
            base_price: basePrice,
            multiplier: multiplier,
            price: finalPrice,
            is_booked: bookedDates.has(dateStr)
          });
        }

        return res.json({
          success: true,
          office_level: req.officeLevel,
          multiplier: multiplier,
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
      const basePrice = priceMap.get(dateStr) || 0;
      const finalPrice = basePrice * multiplier;

      pricingData.push({
        date: dateStr,
        base_price: basePrice,
        multiplier: multiplier,
        price: finalPrice,
        is_booked: bookedDates.has(dateStr)
      });
    }

    res.json({
      success: true,
      office_level: req.officeLevel,
      multiplier: multiplier,
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
// Accepts optional query parameters: group_name, franchise_holder_id
export const getHeaderAds = async (req, res) => {
  try {
    const { group_name, franchise_holder_id } = req.query;

    // Build where clause based on query parameters
    const whereClause = {};

    // Filter by group_name if provided
    // Valid values: head_office_ads1, regional_ads1, branch_ads1, branch_ads2
    if (group_name) {
      whereClause.group_name = group_name;
    }

    // Filter by franchise_holder_id if provided
    if (franchise_holder_id) {
      whereClause.franchise_holder_id = parseInt(franchise_holder_id, 10);
    }

    // If user is logged in and no franchise_holder_id provided, filter by their franchise
    if (!franchise_holder_id && req.user && req.user.id) {
      const franchiseHolder = await FranchiseHolder.findOne({
        where: { user_id: req.user.id }
      });
      if (franchiseHolder) {
        whereClause.franchise_holder_id = franchiseHolder.id;
      }
    }

    const ads = await HeaderAdsManagement.findAll({
      where: whereClause,
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
        },
        {
          model: HeaderAdsSlot,
          as: 'slots',
          attributes: ['id', 'selected_date', 'price', 'impressions', 'clicks', 'is_active']
        }
      ],
      order: [['created_at', 'DESC']]
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

/**
 * ============================================
 * CORPORATE HEADER ADS MANAGEMENT (SIMPLE)
 * ============================================
 */

export const getHeaderAdsManagement = async (req, res) => {
  try {
    const ads = await HeaderAdsManagementCorporate.findAll({
      include: [
        { model: GroupCreate, as: 'app', attributes: ['id', 'name'] },
        { model: AppCategory, as: 'category', attributes: ['id', 'category_name'] }
      ],
      order: [['id', 'DESC']]
    });

    res.json({ success: true, data: ads });
  } catch (error) {
    console.error('Error fetching header ads management:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch header ads management',
      error: error.message
    });
  }
};

export const saveHeaderAdsManagement = async (req, res) => {
  try {
    const { app_id, app_category_id, url } = req.body;

    if (!app_id || !app_category_id) {
      return res.status(400).json({
        success: false,
        message: 'app_id and app_category_id are required'
      });
    }

    let file_path = null;
    if (req.file) {
      file_path = `/uploads/header-ads/${req.file.filename}`;
    }

    const existing = await HeaderAdsManagementCorporate.findOne({
      where: { app_id, app_category_id }
    });

    if (existing) {
      await existing.update({
        file_path: file_path || existing.file_path,
        url: url ?? existing.url
      });

      return res.json({
        success: true,
        message: 'Header ad updated successfully',
        data: existing
      });
    }

    const created = await HeaderAdsManagementCorporate.create({
      app_id,
      app_category_id,
      file_path,
      url
    });

    res.status(201).json({
      success: true,
      message: 'Header ad created successfully',
      data: created
    });
  } catch (error) {
    console.error('Error saving header ads management:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save header ad',
      error: error.message
    });
  }
};

// Get header ads by group_name with priority (public endpoint for mobile)
export const getHeaderAdsByGroup = async (req, res) => {
  try {
    const { app_id, limit = 4, franchise_holder_id } = req.query;
    const limitValue = parseInt(limit, 10) || 4;
    let franchiseHolderId = franchise_holder_id ? parseInt(franchise_holder_id, 10) : null;
    if (Number.isNaN(franchiseHolderId)) {
      franchiseHolderId = null;
    }
    
    // Priority order: branch_ads1, regional_ads1, branch_ads2, head_office_ads1, corporate_ads1 (fallback)
    const groupNames = ['branch_ads1', 'regional_ads1', 'branch_ads2', 'head_office_ads1'];
    const ads = [];
    const foundGroups = new Set();
    
    const baseWhere = {
      status: 'active',
      is_active: 1
    };
    
    if (app_id) {
      baseWhere.app_id = parseInt(app_id);
    }

    // If franchise_holder_id is provided, fetch ads scoped to that franchise
    if (franchiseHolderId) {
      const scopedAds = await HeaderAdsManagement.findAll({
        where: {
          ...baseWhere,
          franchise_holder_id: franchiseHolderId
        },
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
        order: [['created_at', 'DESC']],
        limit: limitValue
      });

      const formattedAds = scopedAds.map(ad => {
        const adJson = ad.toJSON();
        return {
          id: adJson.id,
          app_id: adJson.app_id,
          category_id: adJson.category_id,
          file_path: adJson.file_path || adJson.file_url,
          link_url: adJson.link_url,
          group_name: adJson.group_name,
          app: adJson.app,
          category: adJson.category
        };
      });

      return res.json({
        success: true,
        data: formattedAds
      });
    }

    // Fetch ads for each group in priority order
    for (const groupName of groupNames) {
      if (ads.length >= limitValue) break;
      
      const groupAds = await HeaderAdsManagement.findAll({
        where: {
          ...baseWhere,
          group_name: groupName
        },
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
        order: [['created_at', 'DESC']],
        limit: limitValue - ads.length
      });

      // Process and add ads
      for (const ad of groupAds) {
        if (ads.length >= limitValue) break;
        const adJson = ad.toJSON();
        ads.push({
          id: adJson.id,
          app_id: adJson.app_id,
          category_id: adJson.category_id,
          file_path: adJson.file_path || adJson.file_url,
          link_url: adJson.link_url,
          group_name: adJson.group_name,
          app: adJson.app,
          category: adJson.category
        });
        foundGroups.add(groupName);
      }
    }

    // Fill remaining slots with corporate_ads1 as fallback
    if (ads.length < limitValue) {
      const corporateAds = await HeaderAdsManagement.findAll({
        where: {
          ...baseWhere,
          group_name: 'corporate_ads1'
        },
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
        order: [['created_at', 'DESC']],
        limit: limitValue - ads.length
      });

      for (const ad of corporateAds) {
        if (ads.length >= limitValue) break;
        const adJson = ad.toJSON();
        ads.push({
          id: adJson.id,
          app_id: adJson.app_id,
          category_id: adJson.category_id,
          file_path: adJson.file_path || adJson.file_url,
          link_url: adJson.link_url,
          group_name: adJson.group_name,
          app: adJson.app,
          category: adJson.category
        });
      }
    }

    res.json({
      success: true,
      data: ads
    });
  } catch (error) {
    console.error('Error fetching header ads by group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch header ads by group',
      error: error.message
    });
  }
};

// Create header ad
export const createHeaderAd = async (req, res) => {
  try {
    const { app_id, category_id, link_url, dates, ad_slot } = req.body;
    const userId = req.user.id;
    let file_path = null;

    if (req.file) {
      file_path = `/uploads/header-ads/${req.file.filename}`;
    }

    const selectedDates = typeof dates === 'string' ? JSON.parse(dates) : dates;
    const adSlot = ad_slot || 'ads1'; // Default to ads1 if not provided

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

    // Get group name from user's groups through users_groups relationship
    // Get user's groups using the belongsToMany relationship
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] }, // Exclude join table attributes
          attributes: ['name']
        }
      ]
    });

    let groupName = 'corporate'; // default
    if (user && user.groups && user.groups.length > 0) {
      // Get the first group (users typically have one primary group)
      groupName = user.groups[0].name;
    }

    // Format group_name as {group_name}_{ad_slot}
    const group_name = `${groupName}_${adSlot}`;

    // Get pricing for selected dates using slave/master pricing hierarchy
    // First, get franchise holder's country_id
    const countryId = franchiseHolder.country || null;
    
    // Initialize price map
    const priceMap = new Map();
    
    if (countryId) {
      // Try to get pricing from slave/master tables
      const masterRecord = await HeaderAdsPricingMaster.findOne({
        where: {
          country_id: countryId,
          pricing_slot: 'General', // Default to General
          ads_type: 'header_ads'
        },
        order: [['created_at', 'DESC']]
      });

      if (masterRecord) {
        const masterPrice = parseFloat(masterRecord.my_coins) || 0;
        
        // Get slave pricing records for this app/category combination
        const slaveRecords = await HeaderAdsPricingSlave.findAll({
          where: {
            header_ads_pricing_master_id: masterRecord.id,
            app_id: parseInt(app_id),
            category_id: parseInt(category_id),
            selected_date: {
              [Op.in]: selectedDates
            }
          }
        });

        // Create price map from slave records
        slaveRecords.forEach(record => {
          priceMap.set(record.selected_date, parseFloat(record.my_coins) || 0);
        });

        // Fill in missing dates with master price
        selectedDates.forEach(date => {
          if (!priceMap.has(date)) {
            priceMap.set(date, masterPrice);
          }
        });
      }
    }

    // Fallback to legacy HeaderAdsPricing table if no slave/master data
    if (priceMap.size === 0) {
      const pricingRecords = await HeaderAdsPricing.findAll({
        where: {
          app_id,
          category_id,
          ad_date: {
            [Op.in]: selectedDates
          }
        }
      });

      pricingRecords.forEach(record => {
        priceMap.set(record.ad_date, parseFloat(record.price) || 0);
      });
    }

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
      created_by: userId,
      group_name: group_name
    });

    // Create header_ads_slot records for each selected date with individual prices
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

