import { Op } from 'sequelize';
import {
  HeaderAdsPricing,
  HeaderAd,
  GroupCreate,
  AppCategory,
  Country,
  State,
  District,
  User,
  HeaderAdsManagement,
  HeaderAdsManagementCorporate,
  HeaderAdsSlot,
  FranchiseHolder
} from '../models/index.js';
import { getSignedReadUrl } from '../services/wasabiService.js';

/**
 * ============================================
 * HEADER ADS PRICING MANAGEMENT (Corporate Dashboard)
 * ============================================
 */

/**
 * Get pricing for a specific app, category, office level, and date range
 * GET /api/v1/advertisement/pricing
 */
export const getHeaderAdsPricing = async (req, res) => {
  try {
    const { app_id, category_id, office_level, start_date, end_date, ad_slot } = req.query;

    const where = {};
    
    if (app_id) where.app_id = app_id;
    if (category_id) where.category_id = category_id;
    if (office_level) where.office_level = office_level;
    if (ad_slot) where.ad_slot = ad_slot;
    
    // Date range filter
    if (start_date && end_date) {
      where.ad_date = {
        [Op.between]: [start_date, end_date]
      };
    } else if (start_date) {
      where.ad_date = {
        [Op.gte]: start_date
      };
    } else if (end_date) {
      where.ad_date = {
        [Op.lte]: end_date
      };
    }

    const pricing = await HeaderAdsPricing.findAll({
      where,
      include: [
        { model: GroupCreate, as: 'app', attributes: ['id', 'name', 'code'] },
        { model: AppCategory, as: 'category', attributes: ['id', 'name'] }
      ],
      order: [['ad_date', 'ASC'], ['office_level', 'ASC'], ['ad_slot', 'ASC']]
    });

    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('Get header ads pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pricing',
      error: error.message
    });
  }
};

/**
 * Set/Update pricing for multiple dates (bulk update)
 * POST /api/v1/advertisement/pricing/bulk
 */
export const setHeaderAdsPricingBulk = async (req, res) => {
  try {
    const { app_id, category_id, office_level, ad_slot, start_date, end_date, price } = req.body;
    const userId = req.user?.id;

    if (!app_id || !category_id || !office_level || !start_date || !end_date || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'app_id, category_id, office_level, start_date, end_date, and price are required'
      });
    }

    // Generate all dates between start and end
    const dates = [];
    const currentDate = new Date(start_date);
    const endDateObj = new Date(end_date);

    while (currentDate <= endDateObj) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Upsert pricing for each date
    const results = await Promise.all(
      dates.map(async (date) => {
        const [record, created] = await HeaderAdsPricing.upsert({
          app_id,
          category_id,
          ad_date: date,
          office_level,
          ad_slot: ad_slot || 'ads1',
          price,
          created_by: userId
        }, {
          returning: true
        });
        return { date, record, created };
      })
    );

    res.json({
      success: true,
      message: `Pricing set for ${dates.length} days`,
      data: {
        dates_updated: dates.length,
        start_date,
        end_date,
        price
      }
    });
  } catch (error) {
    console.error('Set header ads pricing bulk error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting pricing',
      error: error.message
    });
  }
};

/**
 * Set/Update pricing for a single date
 * POST /api/v1/advertisement/pricing
 */
export const setHeaderAdsPricing = async (req, res) => {
  try {
    const { app_id, category_id, office_level, ad_slot, ad_date, price } = req.body;
    const userId = req.user?.id;

    if (!app_id || !category_id || !office_level || !ad_date || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'app_id, category_id, office_level, ad_date, and price are required'
      });
    }

    const [record, created] = await HeaderAdsPricing.upsert({
      app_id,
      category_id,
      ad_date,
      office_level,
      ad_slot: ad_slot || 'ads1',
      price,
      created_by: userId
    }, {
      returning: true
    });

    res.json({
      success: true,
      message: created ? 'Pricing created' : 'Pricing updated',
      data: record
    });
  } catch (error) {
    console.error('Set header ads pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting pricing',
      error: error.message
    });
  }
};

/**
 * Delete pricing for a date range
 * DELETE /api/v1/advertisement/pricing
 */
export const deleteHeaderAdsPricing = async (req, res) => {
  try {
    const { app_id, category_id, office_level, ad_slot, start_date, end_date } = req.query;

    const where = {};
    if (app_id) where.app_id = app_id;
    if (category_id) where.category_id = category_id;
    if (office_level) where.office_level = office_level;
    if (ad_slot) where.ad_slot = ad_slot;

    if (start_date && end_date) {
      where.ad_date = { [Op.between]: [start_date, end_date] };
    }

    const deleted = await HeaderAdsPricing.destroy({ where });

    res.json({
      success: true,
      message: `Deleted ${deleted} pricing records`,
      data: { deleted }
    });
  } catch (error) {
    console.error('Delete header ads pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting pricing',
      error: error.message
    });
  }
};

/**
 * ============================================
 * HEADER ADS MANAGEMENT
 * ============================================
 */

/**
 * Get all header ads with filters
 * GET /api/v1/advertisement/ads
 */
export const getHeaderAds = async (req, res) => {
  try {
    const {
      app_id, category_id, group_name, status,
      country_id, state_id, district_id,
      start_date, end_date
    } = req.query;

    const where = {};

    if (app_id) where.app_id = app_id;
    if (category_id) where.category_id = category_id;
    if (group_name) where.group_name = group_name;
    if (status) where.status = status;
    if (country_id) where.country_id = country_id;
    if (state_id) where.state_id = state_id;
    if (district_id) where.district_id = district_id;

    // Date range filter for active ads
    if (start_date && end_date) {
      where[Op.and] = [
        { start_date: { [Op.lte]: end_date } },
        { end_date: { [Op.gte]: start_date } }
      ];
    }

    const ads = await HeaderAd.findAll({
      where,
      include: [
        { model: GroupCreate, as: 'app', attributes: ['id', 'name', 'code'] },
        { model: AppCategory, as: 'category', attributes: ['id', 'name'] },
        { model: Country, as: 'country', attributes: ['id', 'name', 'code'] },
        { model: State, as: 'state', attributes: ['id', 'name'] },
        { model: District, as: 'district', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: ads
    });
  } catch (error) {
    console.error('Get header ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ads',
      error: error.message
    });
  }
};

/**
 * Create a new header ad
 * POST /api/v1/advertisement/ads
 */
export const createHeaderAd = async (req, res) => {
  try {
    const {
      app_id, category_id, group_name, ad_type,
      file_url, link_url, title, description,
      start_date, end_date,
      country_id, state_id, district_id
    } = req.body;

    const userId = req.user?.id;
    const file = req.file;

    if (!app_id || !category_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'app_id, category_id, start_date, and end_date are required'
      });
    }

    // Calculate total price from pricing table
    const pricingRecords = await HeaderAdsPricing.findAll({
      where: {
        app_id,
        category_id,
        ad_date: { [Op.between]: [start_date, end_date] }
      }
    });

    const totalPrice = pricingRecords.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);

    // Determine file type
    let fileType = 'image';
    let filePath = null;
    let fileSize = null;

    if (file) {
      filePath = `/uploads/ads/${file.filename}`;
      fileSize = file.size;
      if (file.mimetype === 'image/gif') {
        fileType = 'gif';
      }
    }

    const ad = await HeaderAd.create({
      app_id,
      category_id,
      group_name: group_name || null,
      ad_type: ad_type || 'file',
      file_path: filePath,
      file_url: file_url || null,
      link_url: link_url || null,
      file_type: fileType,
      file_size: fileSize,
      title,
      description,
      start_date,
      end_date,
      country_id: country_id || null,
      state_id: state_id || null,
      district_id: district_id || null,
      total_price: totalPrice,
      status: 'pending',
      created_by: userId
    });

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      data: ad
    });
  } catch (error) {
    console.error('Create header ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ad',
      error: error.message
    });
  }
};

/**
 * Update a header ad
 * PUT /api/v1/advertisement/ads/:id
 */
export const updateHeaderAd = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      file_url, link_url, title, description,
      start_date, end_date, status
    } = req.body;

    const file = req.file;

    const ad = await HeaderAd.findByPk(id);
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    const updateData = {};
    if (file_url !== undefined) updateData.file_url = file_url;
    if (link_url !== undefined) updateData.link_url = link_url;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (status !== undefined) updateData.status = status;

    if (file) {
      updateData.file_path = `/uploads/ads/${file.filename}`;
      updateData.file_size = file.size;
      updateData.file_type = file.mimetype === 'image/gif' ? 'gif' : 'image';
    }

    await ad.update(updateData);

    res.json({
      success: true,
      message: 'Ad updated successfully',
      data: ad
    });
  } catch (error) {
    console.error('Update header ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating ad',
      error: error.message
    });
  }
};

/**
 * Delete a header ad
 * DELETE /api/v1/advertisement/ads/:id
 */
export const deleteHeaderAd = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await HeaderAd.findByPk(id);
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    await ad.destroy();

    res.json({
      success: true,
      message: 'Ad deleted successfully'
    });
  } catch (error) {
    console.error('Delete header ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting ad',
      error: error.message
    });
  }
};

/**
 * Approve/Reject a header ad
 * PATCH /api/v1/advertisement/ads/:id/status
 */
export const updateHeaderAdStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!['pending', 'active', 'inactive', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, active, inactive, or rejected'
      });
    }

    const ad = await HeaderAd.findByPk(id);
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    const updateData = { status };
    if (status === 'active') {
      updateData.approved_by = userId;
      updateData.approved_at = new Date();
    }

    await ad.update(updateData);

    res.json({
      success: true,
      message: `Ad ${status === 'active' ? 'approved' : status}`,
      data: ad
    });
  } catch (error) {
    console.error('Update header ad status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating ad status',
      error: error.message
    });
  }
};

/**
 * Get ads for frontend display (public endpoint)
 * Filters by location and returns active ads only
 * GET /api/v1/advertisement/display
 */
export const getDisplayAds = async (req, res) => {
  try {
    const { app_id, category_id, country_id, state_id, district_id } = req.query;
    const today = new Date().toISOString().split('T')[0];

    if (!app_id || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'app_id and category_id are required'
      });
    }

    // Build priority-based query
    // Priority: branch_office > regional_office > head_office > corporate
    const ads = await HeaderAd.findAll({
      where: {
        app_id,
        category_id,
        status: 'active',
        is_active: 1,
        start_date: { [Op.lte]: today },
        end_date: { [Op.gte]: today },
        [Op.or]: [
          // Match district (branch level)
          { district_id: district_id || null },
          // Match state (regional level)
          { state_id: state_id || null, district_id: null },
          // Match country (head office level)
          { country_id: country_id || null, state_id: null, district_id: null },
          // Corporate level (no location filter)
          { country_id: null, state_id: null, district_id: null }
        ]
      },
      order: [
        // Priority order: more specific location = higher priority
        ['group_name', 'ASC'],
        ['created_at', 'DESC']
      ],
      limit: 4 // 4 slides for carousel
    });

    // Increment impressions
    await Promise.all(ads.map(ad =>
      ad.increment('impressions')
    ));

    res.json({
      success: true,
      data: ads
    });
  } catch (error) {
    console.error('Get display ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching display ads',
      error: error.message
    });
  }
};

/**
 * Track ad click
 * POST /api/v1/advertisement/ads/:id/click
 */
export const trackAdClick = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await HeaderAd.findByPk(id);
    if (ad) {
      await ad.increment('clicks');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Track ad click error:', error);
    res.status(500).json({ success: false });
  }
};

/**
 * Get user's own ads
 * GET /api/v1/advertisement/my-ads
 */
export const getMyAds = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    const where = { user_id: userId };

    if (start_date && end_date) {
      where.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date + 'T23:59:59')]
      };
    }

    const ads = await HeaderAd.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    // Transform to expected format
    const formattedAds = ads.map(ad => ({
      id: ad.id,
      ad_slot: ad.ad_slot,
      ad_date: ad.ad_date,
      amount: parseFloat(ad.price) || 0,
      status: ad.status,
      created_at: ad.created_at
    }));

    res.json({
      success: true,
      data: formattedAds
    });
  } catch (error) {
    console.error('Get my ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ads',
      error: error.message
    });
  }
};

/**
 * ============================================
 * FRANCHISE HEADER ADS
 * ============================================
 */

/**
 * Get franchise header ads pricing
 * GET /api/v1/advertisement/franchise-pricing
 */
export const getFranchiseHeaderAdsPricing = async (req, res) => {
  try {
    const { group_name, start_date, end_date } = req.query;
    const userId = req.user.id;

    // Get user's franchise info
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const where = {};

    if (group_name) where.group_name = group_name;

    // Date range filter
    if (start_date && end_date) {
      where.ad_date = {
        [Op.between]: [start_date, end_date]
      };
    }

    const pricing = await HeaderAdsPricing.findAll({
      where,
      order: [['ad_date', 'ASC']]
    });

    // Transform to expected format
    const formattedPricing = pricing.map(p => ({
      id: p.id,
      date: p.ad_date,
      ad_slot: p.ad_slot,
      price: parseFloat(p.price) || 0,
      is_booked: p.is_booked || 0,
      booked_by: p.booked_by || null
    }));

    res.json({
      success: true,
      data: formattedPricing
    });
  } catch (error) {
    console.error('Get franchise pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing',
      error: error.message
    });
  }
};

/**
 * Book franchise header ad
 * POST /api/v1/advertisement/franchise-book
 */
export const bookFranchiseHeaderAd = async (req, res) => {
  try {
    const { dates, group_name, link_url } = req.body;
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Ad image is required'
      });
    }

    const parsedDates = typeof dates === 'string' ? JSON.parse(dates) : dates;

    if (!parsedDates || parsedDates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one date is required'
      });
    }

    // Get user info
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create header ads for each date
    const createdAds = [];
    for (const date of parsedDates) {
      const ad = await HeaderAd.create({
        user_id: userId,
        app_id: user.group_id,
        group_name: group_name,
        ad_date: date,
        file_path: `/uploads/ads/${file.filename}`,
        link_url: link_url || null,
        status: 'pending',
        created_at: new Date()
      });
      createdAds.push(ad);

      // Update pricing to mark as booked
      await HeaderAdsPricing.update(
        { is_booked: 1, booked_by: userId },
        { where: { ad_date: date, group_name: group_name } }
      );
    }

    res.json({
      success: true,
      message: 'Ads booked successfully',
      data: createdAds
    });
  } catch (error) {
    console.error('Book franchise ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book ad',
      error: error.message
    });
  }
};

/**
 * Get carousel ads for mobile header.
 * Returns exactly 4 ads with slot-based priority order.
 *
 * Primary source: header_ads (HeaderAdsManagement). Fallback: header_ads_management (HeaderAdsManagementCorporate).
 *
 * Priority Slots (group_name):
 * - Slot 1: group_name = 'branch_ads1' (highest)
 * - Slot 2: group_name = 'regional_ads1'
 * - Slot 3: group_name = 'branch_ads2'
 * - Slot 4: group_name = 'head_office_ads1' (lowest)
 *
 * Location: header_ads.franchise_holder_id → franchise_holder (country, state, district).
 * Matching (Op.or): district match → state match → country match → corporate (all null).
 * For each slot, the ad with the best location priority is selected; empty slots use fallback.
 *
 * GET /api/v1/advertisement/carousel
 * Query params:
 * - app_id (required) - Application ID
 * - category_id (required) - App category ID for category-based filtering
 * - country_id (optional) - User's country for location filtering
 * - state_id (optional) - User's state for location filtering
 * - district_id (optional) - User's district for location filtering
 * - selected_date (optional) - Date for slot (default: today YYYY-MM-DD)
 */
export const getCarouselAds = async (req, res) => {
  try {
    const { app_id, category_id, country_id, state_id, district_id, selected_date } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const selectedDate = selected_date || today;

    // Validate required parameters: app_id and category_id are both required
    if (!app_id) {
      return res.status(400).json({
        success: false,
        message: 'app_id is required'
      });
    }
    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: 'category_id is required for category-based filtering'
      });
    }

    // Parse IDs
    const appId = parseInt(app_id, 10);
    const categoryId = parseInt(category_id, 10);
    const countryId = country_id ? parseInt(country_id, 10) : null;
    const stateId = state_id ? parseInt(state_id, 10) : null;
    const districtId = district_id ? parseInt(district_id, 10) : null;

    // ============================================
    // 1) HELPER FUNCTIONS
    // ============================================

    // Helper: get signed URL for Wasabi file path
    const getSigned = async (filePath) => {
      if (!filePath) return null;
      // If already a URL, don't sign
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) return null;
      try {
        const result = await getSignedReadUrl(filePath);
        return result.signedUrl || null;
      } catch (e) {
        console.error('Error getting signed URL:', e);
        return null;
      }
    };

    // Helper: format header_ads row into carousel item (image: signed_url > file_url > file_path)
    const formatHeaderAd = async (ad, groupName) => {
      const filePath = ad.file_path || null;
      const fileUrl = ad.file_url || null;
      const signedUrl = await getSigned(filePath);
      return {
        id: ad.id,
        image: signedUrl || fileUrl || filePath || '',
        file_path: filePath,
        file_url: fileUrl,
        signed_url: signedUrl,
        title: ad.app?.name || ad.title || 'Advertisement',
        url: ad.link_url || '#',
        group_name: groupName,
        source: 'header_ads'
      };
    };

    // Helper: format header_ads_management row into carousel item (signed URL for Wasabi file_path)
    const formatManagementAd = async (ad, slotIndex) => {
      const filePath = ad.file_path || null;
      const fileUrl = ad.url || null;
      let signedUrl = null;
      if (filePath && !filePath.startsWith('http://') && !filePath.startsWith('https://')) {
        try {
          const result = await getSignedReadUrl(filePath);
          signedUrl = result.signedUrl || null;
        } catch (e) {
          console.error('Error getting signed URL for fallback ad:', e);
        }
      }
      const image = signedUrl || fileUrl || filePath || '';
      return {
        id: ad.id,
        image,
        file_path: filePath,
        file_url: fileUrl,
        signed_url: signedUrl,
        title: ad.app?.name || 'Advertisement',
        url: fileUrl || '#',
        group_name: `fallback_slot${slotIndex + 1}`,
        source: 'header_ads_management'
      };
    };

    // Helper: build location conditions for hierarchical matching via FranchiseHolder
    // Uses Sequelize $franchiseHolder.column$ for filtering on associated franchise_holder columns.
    // All conditions combined with Op.or so we get district, state, country, or corporate matches.
    const buildLocationConditions = () => {
      const conditions = [];

      // 1) District-level (most specific): franchise_holder.district = districtId
      if (districtId) {
        conditions.push({ '$franchiseHolder.district$': districtId });
      }

      // 2) State-level: franchise_holder.state = stateId AND district IS NULL
      if (stateId) {
        conditions.push({
          '$franchiseHolder.state$': stateId,
          '$franchiseHolder.district$': null
        });
      }

      // 3) Country-level: franchise_holder.country = countryId AND state IS NULL AND district IS NULL
      if (countryId) {
        conditions.push({
          '$franchiseHolder.country$': countryId,
          '$franchiseHolder.state$': null,
          '$franchiseHolder.district$': null
        });
      }

      // 4) Corporate/National (always include): country IS NULL AND state IS NULL AND district IS NULL
      conditions.push({
        '$franchiseHolder.country$': null,
        '$franchiseHolder.state$': null,
        '$franchiseHolder.district$': null
      });

      return conditions;
    };

    // Helper: get location priority score for sorting (via FranchiseHolder association)
    const getLocationPriority = (ad) => {
      if (!ad || !ad.franchiseHolder) return 1; // No franchise holder = corporate level
      const fh = ad.franchiseHolder;
      if (fh.district && fh.district === districtId) return 4; // District match
      if (fh.state && fh.state === stateId && !fh.district) return 3; // State match
      if (fh.country && fh.country === countryId && !fh.state && !fh.district) return 2; // Country match
      if (!fh.country && !fh.state && !fh.district) return 1; // Corporate/national
      return 0;
    };

    // ============================================
    // 2) DEFINE PRIORITY SLOTS (using group_name field)
    // ============================================
    // Priority order: branch_ads1 > regional_ads1 > branch_ads2 > head_office_ads1
    const prioritySlots = ['branch_ads1', 'regional_ads1', 'branch_ads2', 'head_office_ads1'];
    const carouselAds = [null, null, null, null]; // Initialize with 4 null slots

    // Base where for header_ads (HeaderAdsManagement): app_id, category_id (required), is_active
    const baseWhereClause = {
      status: 'active',
      is_active: 1,
      app_id: appId,
      category_id: categoryId
    };

    // Get location conditions (uses FranchiseHolder association)
    const locationConditions = buildLocationConditions();

    // ============================================
    // 3) FETCH ADS FOR EACH PRIORITY SLOT
    // ============================================
    for (let i = 0; i < prioritySlots.length; i++) {
      const groupName = prioritySlots[i];

      // Fetch all matching ads for this slot with location filtering via FranchiseHolder
      const matchingAds = await HeaderAdsManagement.findAll({
        where: {
          ...baseWhereClause,
          group_name: groupName,
          [Op.or]: locationConditions
        },
        include: [
          { model: GroupCreate, as: 'app', attributes: ['id', 'name'] },
          { model: AppCategory, as: 'category', attributes: ['id', 'category_name'] },
          {
            model: HeaderAdsSlot,
            as: 'slots',
            where: { selected_date: selectedDate, is_active: 1 },
            required: true,
            attributes: ['id', 'selected_date', 'impressions']
          },
          {
            model: FranchiseHolder,
            as: 'franchiseHolder',
            attributes: ['id', 'country', 'state', 'district'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']],
        subQuery: false // Required for $association.column$ syntax to work correctly
      });

      if (matchingAds.length > 0) {
        // Sort by location priority (most specific first)
        const sortedAds = matchingAds.sort((a, b) => {
          return getLocationPriority(b) - getLocationPriority(a);
        });

        // Take the best matching ad
        const bestAd = sortedAds[0];
        const formattedAd = await formatHeaderAd(bestAd, groupName);
        carouselAds[i] = formattedAd;

        // Increment impressions on the slot (non-blocking)
        if (bestAd.slots && bestAd.slots.length > 0) {
          bestAd.slots[0].increment('impressions').catch(e =>
            console.error('Impression increment error:', e)
          );
        }
      }
    }

    // ============================================
    // 4) FETCH FALLBACK ADS FROM header_ads_management (corporate)
    // ============================================
    const fallbackAds = await HeaderAdsManagementCorporate.findAll({
      where: {
        app_id: appId,
        app_category_id: categoryId
      },
      include: [{ model: GroupCreate, as: 'app', attributes: ['id', 'name'] }],
      limit: 4,
      order: [['id', 'DESC']]
    });

    // ============================================
    // 5) FILL EMPTY SLOTS WITH FALLBACK ADS (cycle if fewer fallback ads than empty slots)
    // ============================================
    let fallbackIndex = 0;
    for (let i = 0; i < carouselAds.length; i++) {
      if (carouselAds[i] === null && fallbackAds.length > 0) {
        const fallbackAd = fallbackAds[fallbackIndex % fallbackAds.length];
        carouselAds[i] = await formatManagementAd(fallbackAd, i);
        fallbackIndex++;
      }
    }

    // ============================================
    // 6) ENSURE EXACTLY 4 ADS (repeat if needed)
    // ============================================
    // Filter out any remaining nulls and ensure we have exactly 4
    const validAds = carouselAds.filter(ad => ad !== null);
    const finalAds = [];

    if (validAds.length === 0) {
      // No ads at all - return empty array with message
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: 'No ads available for the specified criteria'
      });
    }

    // Fill exactly 4 slots by repeating available ads
    for (let i = 0; i < 4; i++) {
      finalAds.push(validAds[i % validAds.length]);
    }

    // ============================================
    // 7) RETURN RESPONSE
    // ============================================
    res.json({
      success: true,
      data: finalAds,
      count: finalAds.length
    });
  } catch (error) {
    console.error('Get carousel ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching carousel ads',
      error: error.message
    });
  }
};
