import { HeaderAdsPricingMaster, HeaderAdsPricingSlave, Country, GroupCreate, AppCategory, FranchiseHolder, State, District, User, Group } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

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
    const { country_id, pricing_slot, ads_type } = req.query;

    const where = {};
    if (country_id) where.country_id = country_id;
    if (pricing_slot) where.pricing_slot = pricing_slot;
    if (ads_type) where.ads_type = ads_type;

    const masters = await HeaderAdsPricingMaster.findAll({
      where,
      include: [
        { model: Country, as: 'country', attributes: ['id', ['country', 'name'], ['currency', 'currency_code']] }
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

// Get all pricing master for display cards (all ads types for a country)
export const getAllPricingMasterByCountry = async (req, res) => {
  try {
    const { country_id } = req.query;

    if (!country_id) {
      return res.status(400).json({
        success: false,
        message: 'country_id is required'
      });
    }

    const masters = await HeaderAdsPricingMaster.findAll({
      where: { country_id },
      attributes: ['id', 'pricing_slot', 'ads_type', 'my_coins', 'country_id'],
      order: [['pricing_slot', 'ASC'], ['ads_type', 'ASC']]
    });

    // Group by pricing_slot
    const grouped = {
      General: {
        header_ads: null,
        popup_ads: null,
        middle_ads: null
      },
      Capitals: {
        header_ads: null,
        popup_ads: null,
        middle_ads: null
      }
    };

    masters.forEach(master => {
      if (grouped[master.pricing_slot] && grouped[master.pricing_slot][master.ads_type] !== undefined) {
        grouped[master.pricing_slot][master.ads_type] = {
          id: master.id,
          my_coins: parseFloat(master.my_coins) || 0
        };
      }
    });

    res.json({
      success: true,
      data: grouped
    });
  } catch (error) {
    console.error('Error fetching all pricing master:', error);
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
    const { country_id, pricing_slot, ads_type, my_coins } = req.body;

    if (!country_id || !pricing_slot || !ads_type || my_coins === undefined || my_coins === null) {
      return res.status(400).json({
        success: false,
        message: 'country_id, pricing_slot, ads_type, and my_coins are required'
      });
    }

    // Find existing record with the specific combination
    const existingMaster = await HeaderAdsPricingMaster.findOne({
      where: {
        country_id,
        pricing_slot,
        ads_type
      }
    });

    let master;
    let created;

    if (existingMaster) {
      // Update existing record
      await existingMaster.update({
        my_coins: parseFloat(my_coins)
      });
      master = existingMaster;
      created = false;
    } else {
      // Create new record
      master = await HeaderAdsPricingMaster.create({
        country_id,
        pricing_slot,
        ads_type,
        my_coins: parseFloat(my_coins)
      });
      created = true;
    }

    res.json({
      success: true,
      message: created ? 'Pricing master created successfully' : 'Pricing master updated successfully',
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

    // Get master pricing for header_ads only
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

    // Get master record for header_ads only
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

/**
 * Get franchise holder location info with pricing multipliers
 * For Head Office: my_coins × state_count × district_count
 * For Regional Office: my_coins × district_count (for their state)
 * For Branch Office: my_coins (no multiplier)
 */
export const getFranchiseLocationPricing = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get franchise holder with location data
    const franchiseHolder = await FranchiseHolder.findOne({
      where: { user_id: userId },
      include: [
        { model: Country, as: 'countryData', attributes: ['id', 'country'] },
        { model: State, as: 'stateData', attributes: ['id', 'state'] },
        { model: District, as: 'districtData', attributes: ['id', 'district'] }
      ]
    });

    if (!franchiseHolder) {
      return res.status(404).json({
        success: false,
        message: 'Franchise holder not found'
      });
    }

    // Get user's group to determine office level
    const user = await User.findByPk(userId, {
      include: [{
        model: Group,
        as: 'groups',
        through: { attributes: [] },
        attributes: ['name']
      }]
    });

    let officeLevel = 'branch'; // default
    if (user && user.groups && user.groups.length > 0) {
      const groupName = user.groups[0].name;
      if (groupName === 'head_office') officeLevel = 'head_office';
      else if (groupName === 'regional') officeLevel = 'regional';
      else if (groupName === 'branch') officeLevel = 'branch';
    }

    // Calculate counts based on office level
    let stateCount = 1;
    let districtCount = 1;
    let countryCount = 1;

    if (officeLevel === 'head_office' && franchiseHolder.country) {
      // Head Office: Get all states for their country and all districts
      const states = await State.findAll({
        where: { country_id: franchiseHolder.country },
        attributes: ['id']
      });
      stateCount = states.length || 1;

      // Get all districts for all states in the country
      const stateIds = states.map(s => s.id);
      if (stateIds.length > 0) {
        const districts = await District.count({
          where: { state_id: { [Op.in]: stateIds } }
        });
        districtCount = districts || 1;
      }
    } else if (officeLevel === 'regional' && franchiseHolder.state) {
      // Regional Office: Get all districts for their state
      const districts = await District.count({
        where: { state_id: franchiseHolder.state }
      });
      districtCount = districts || 1;
    }
    // Branch office: no multiplier (stateCount = 1, districtCount = 1)

    res.json({
      success: true,
      data: {
        franchise_holder_id: franchiseHolder.id,
        office_level: officeLevel,
        country_id: franchiseHolder.country,
        country_name: franchiseHolder.countryData?.country || null,
        state_id: franchiseHolder.state,
        state_name: franchiseHolder.stateData?.state || null,
        district_id: franchiseHolder.district,
        district_name: franchiseHolder.districtData?.district || null,
        counts: {
          country_count: countryCount,
          state_count: stateCount,
          district_count: districtCount
        },
        multiplier: countryCount * stateCount * districtCount
      }
    });
  } catch (error) {
    console.error('Error getting franchise location pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get franchise location pricing',
      error: error.message
    });
  }
};

/**
 * Get pricing with location-based multiplier applied
 * This calculates: base_my_coins × location_multiplier
 */
export const getPricingWithMultiplier = async (req, res) => {
  try {
    const { app_id, category_id, start_date, end_date, office_level } = req.query;
    const userId = req.user.id;

    // Get franchise holder
    const franchiseHolder = await FranchiseHolder.findOne({
      where: { user_id: userId }
    });

    if (!franchiseHolder) {
      return res.status(404).json({
        success: false,
        message: 'Franchise holder not found'
      });
    }

    // Get user's group to determine office level if not provided
    let actualOfficeLevel = office_level;
    if (!actualOfficeLevel) {
      const user = await User.findByPk(userId, {
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
    let multiplier = 1;

    if (actualOfficeLevel === 'head_office' && franchiseHolder.country) {
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
    } else if (actualOfficeLevel === 'regional' && franchiseHolder.state) {
      // Regional Office: district_count for their state
      multiplier = await District.count({
        where: { state_id: franchiseHolder.state }
      }) || 1;
    }
    // Branch office: multiplier = 1

    // Get master pricing
    const countryId = franchiseHolder.country;
    const pricingSlot = 'General'; // Default to General

    const masterRecord = await HeaderAdsPricingMaster.findOne({
      where: {
        country_id: countryId,
        pricing_slot: pricingSlot,
        ads_type: 'header_ads'
      },
      order: [['created_at', 'DESC']]
    });

    const basePricePerDay = masterRecord ? parseFloat(masterRecord.my_coins) || 0 : 0;
    const calculatedPrice = basePricePerDay * multiplier;

    // Generate pricing data for date range
    const start = new Date(start_date);
    const end = new Date(end_date);
    const pricingData = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      pricingData.push({
        date: dateStr,
        base_price: basePricePerDay,
        multiplier: multiplier,
        price: calculatedPrice,
        is_booked: false // TODO: Check actual bookings
      });
    }

    res.json({
      success: true,
      data: {
        office_level: actualOfficeLevel,
        multiplier: multiplier,
        base_price_per_day: basePricePerDay,
        calculated_price_per_day: calculatedPrice,
        pricing: pricingData
      }
    });
  } catch (error) {
    console.error('Error getting pricing with multiplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing',
      error: error.message
    });
  }
};

/**
 * Get location hierarchy pricing breakdown
 * Returns a table with Level, Count, Total, Logic for each level
 * Based on the user's office level (head_office, regional, branch)
 */
export const getLocationHierarchyPricing = async (req, res) => {
  try {
    const { office_level } = req.query;
    const userId = req.user.id;

    // Get franchise holder with location data
    const franchiseHolder = await FranchiseHolder.findOne({
      where: { user_id: userId },
      include: [
        { model: Country, as: 'countryData', attributes: ['id', 'country'] },
        { model: State, as: 'stateData', attributes: ['id', 'state'] },
        { model: District, as: 'districtData', attributes: ['id', 'district'] }
      ]
    });

    if (!franchiseHolder) {
      return res.status(404).json({
        success: false,
        message: 'Franchise holder not found'
      });
    }

    // Get user's group to determine office level if not provided
    let actualOfficeLevel = office_level;
    if (!actualOfficeLevel) {
      const user = await User.findByPk(userId, {
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

    // Get base my_coins from pricing master
    const countryId = franchiseHolder.country;
    let myCoins = 0;

    if (countryId) {
      const masterRecord = await HeaderAdsPricingMaster.findOne({
        where: {
          country_id: countryId,
          pricing_slot: 'General',
          ads_type: 'header_ads'
        },
        order: [['created_at', 'DESC']]
      });
      myCoins = masterRecord ? parseFloat(masterRecord.my_coins) || 0 : 0;
    }

    // Build hierarchy pricing table based on office level
    const hierarchyTable = [];

    if (actualOfficeLevel === 'head_office') {
      // Head Office: Hierarchical pricing
      // District Price = Base price (fundamental unit)
      // State Price = Districts in state × District Price
      // Country Price = Sum of State Prices = Total districts × District Price
      const states = await State.findAll({
        where: { country_id: franchiseHolder.country },
        attributes: ['id', 'state']
      });
      const stateCount = states.length || 0;

      const stateIds = states.map(s => s.id);
      let totalDistrictCount = 0;
      if (stateIds.length > 0) {
        totalDistrictCount = await District.count({
          where: { state_id: { [Op.in]: stateIds } }
        }) || 0;
      }

      const countryTotal = totalDistrictCount * myCoins; // Sum of all State Prices

      // Display: District → State → Country (bottom-up hierarchy)
      hierarchyTable.push({
        level: 'District',
        name: `${totalDistrictCount} Districts`,
        count: totalDistrictCount,
        total: myCoins,
        logic: `Base price per district (from header_ads_pricing_slave)`
      });

      hierarchyTable.push({
        level: 'State',
        name: `${stateCount} States`,
        count: stateCount,
        total: countryTotal,
        logic: `State Price = districts in state × base. Sum = ${totalDistrictCount} × ${myCoins} = ${countryTotal}`
      });

      hierarchyTable.push({
        level: 'Country',
        name: franchiseHolder.countryData?.country || 'N/A',
        count: 1,
        total: countryTotal,
        logic: `Sum of all State Prices = ${totalDistrictCount} districts × ${myCoins}`
      });

    } else if (actualOfficeLevel === 'regional') {
      // Regional Office: State → Districts
      // Get districts for the state
      const districtCount = await District.count({
        where: { state_id: franchiseHolder.state }
      }) || 0;

      const districtTotal = myCoins;
      const stateTotal = districtCount * myCoins;

      hierarchyTable.push({
        level: 'State',
        name: franchiseHolder.stateData?.state || 'N/A',
        count: 1,
        total: stateTotal,
        logic: `${districtCount} districts × ${myCoins} = ${stateTotal}`
      });

      hierarchyTable.push({
        level: 'District',
        name: `${districtCount} Districts`,
        count: districtCount,
        total: districtTotal,
        logic: `My Coins = ${myCoins}`
      });

    } else {
      // Branch Office: District only
      hierarchyTable.push({
        level: 'District',
        name: franchiseHolder.districtData?.district || 'N/A',
        count: 1,
        total: myCoins,
        logic: `My Coins = ${myCoins}`
      });
    }

    res.json({
      success: true,
      data: {
        office_level: actualOfficeLevel,
        my_coins: myCoins,
        franchise_holder_id: franchiseHolder.id,
        country_id: franchiseHolder.country,
        state_id: franchiseHolder.state,
        district_id: franchiseHolder.district,
        hierarchy: hierarchyTable
      }
    });
  } catch (error) {
    console.error('Error getting location hierarchy pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location hierarchy pricing',
      error: error.message
    });
  }
};

export default {
  getCountries,
  getPricingMaster,
  getAllPricingMasterByCountry,
  createPricingMaster,
  getPricingSlave,
  updateSlavePricing,
  getFranchiseLocationPricing,
  getPricingWithMultiplier,
  getLocationHierarchyPricing
};
