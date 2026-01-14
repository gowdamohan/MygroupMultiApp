import { HeaderAdsPricingMaster, HeaderAdsPricingSlave, Country, GroupCreate, AppCategory } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * ============================================
 * HEADER ADS PRICING MANAGEMENT
 * ============================================
 */

// Get all countries with currency info
export const getCountries = async (req, res) => {
  try {
    const countries = await Country.findAll({
      attributes: [
        'id',
        ['country', 'name'],
        ['currency', 'currency_code'],
        ['country_flag', 'flag_icon']
      ],
      where: { status: 1 },
      order: [['country', 'ASC']],
      raw: true
    });

    const countriesWithSymbol = countries.map(country => {
      const symbolMap = {
        'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
        'AUD': 'A$', 'CAD': 'C$', 'CHF': 'CHF', 'CNY': '¥', 'SEK': 'kr'
      };
      return {
        ...country,
        currency_symbol: symbolMap[country.currency_code] || country.currency_code || '$'
      };
    });

    res.json({
      success: true,
      data: countriesWithSymbol
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch countries',
      error: error.message
    });
  }
};

// Get pricing master data
export const getPricingMaster = async (req, res) => {
  try {
    const { country_id, pricing_slot } = req.query;

    const where = { ads_type: 'header_ads' };
    if (country_id) where.country_id = country_id;
    if (pricing_slot) where.pricing_slot = pricing_slot;

    const masters = await HeaderAdsPricingMaster.findAll({
      where,
      include: [
        { model: Country, as: 'country', attributes: ['id', 'name', 'currency_code'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: masters
    });
  } catch (error) {
    console.error('Error fetching pricing master:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing master',
      error: error.message
    });
  }
};

// Create pricing master and generate slave records
export const createPricingMaster = async (req, res) => {
  try {
    const { country_id, pricing_slot, my_coins } = req.body;

    if (!country_id || !pricing_slot || !my_coins) {
      return res.status(400).json({
        success: false,
        message: 'country_id, pricing_slot, and my_coins are required'
      });
    }

    // Create master record only
    const master = await HeaderAdsPricingMaster.create({
      country_id,
      pricing_slot,
      my_coins,
      ads_type: 'header_ads'
    });

    res.json({
      success: true,
      message: 'Pricing master created successfully',
      data: master
    });
  } catch (error) {
    console.error('Error creating pricing master:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pricing master',
      error: error.message
    });
  }
};

// Get pricing slave data for display
export const getPricingSlave = async (req, res) => {
  try {
    const { country_id, pricing_slot, start_date, end_date } = req.query;

    // Get master pricing
    const masterWhere = { ads_type: 'header_ads' };
    if (country_id) masterWhere.country_id = country_id;
    if (pricing_slot) masterWhere.pricing_slot = pricing_slot;

    const master = await HeaderAdsPricingMaster.findOne({
      where: masterWhere,
      order: [['created_at', 'DESC']]
    });

    if (!master) {
      return res.json({ success: true, data: { master_price: 0, slaves: [] } });
    }

    // Check if slave table has any data
    const slaveCount = await HeaderAdsPricingSlave.count();
    
    // Get slave overrides if table has data
    let slaves = [];
    if (slaveCount > 0) {
      const slaveWhere = { header_ads_pricing_master_id: master.id };
      if (start_date && end_date) {
        slaveWhere.selected_date = { [Op.between]: [start_date, end_date] };
      }

      slaves = await HeaderAdsPricingSlave.findAll({
        where: slaveWhere,
        include: [
          { model: GroupCreate, as: 'app', attributes: ['id', 'name'] },
          { model: AppCategory, as: 'category', attributes: ['id', 'category_name'] }
        ]
      });
    }

    res.json({
      success: true,
      data: {
        master_price: master.my_coins,
        slaves: slaves
      }
    });
  } catch (error) {
    console.error('Error fetching pricing slave:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing slave',
      error: error.message
    });
  }
};

// Update individual slave pricing
export const updateSlavePricing = async (req, res) => {
  try {
    const { app_id, category_id, selected_date, my_coins, country_id, pricing_slot } = req.body;

    if (!app_id || !category_id || !selected_date || !my_coins) {
      return res.status(400).json({
        success: false,
        message: 'app_id, category_id, selected_date, and my_coins are required'
      });
    }

    // Get master record
    const master = await HeaderAdsPricingMaster.findOne({
      where: {
        country_id,
        pricing_slot,
        ads_type: 'header_ads'
      },
      order: [['created_at', 'DESC']]
    });

    if (!master) {
      return res.status(404).json({
        success: false,
        message: 'Master pricing not found'
      });
    }

    // Upsert slave record
    const [slave, created] = await HeaderAdsPricingSlave.upsert({
      header_ads_pricing_master_id: master.id,
      app_id,
      category_id,
      selected_date,
      my_coins: parseFloat(my_coins)
    }, {
      returning: true
    });

    res.json({
      success: true,
      message: created ? 'Pricing created successfully' : 'Pricing updated successfully',
      data: slave
    });
  } catch (error) {
    console.error('Error updating slave pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pricing',
      error: error.message
    });
  }
};

export default {
  getCountries,
  getPricingMaster,
  createPricingMaster,
  getPricingSlave,
  updateSlavePricing
};
