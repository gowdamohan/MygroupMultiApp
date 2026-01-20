import { Country, State, District, Education, Profession } from '../models/index.js';

/**
 * Get all countries
 */
export const getCountries = async (req, res) => {
  try {
    const countries = await Country.findAll({
      attributes: ['id', 'country', 'code', 'country_flag', 'phone_code'],
      order: [['country', 'ASC']]
    });

    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching countries',
      error: error.message
    });
  }
};

/**
 * Get states by country
 */
export const getStatesByCountry = async (req, res) => {
  try {
    const { countryId } = req.params;

    const states = await State.findAll({
      where: { country_id: countryId },
      attributes: ['id', 'state', 'code'],
      order: [['state', 'ASC']]
    });

    res.json({
      success: true,
      data: states
    });
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching states',
      error: error.message
    });
  }
};

/**
 * Get districts by state
 */
export const getDistrictsByState = async (req, res) => {
  try {
    const { stateId } = req.params;

    const districts = await District.findAll({
      where: { state_id: stateId },
      attributes: ['id', 'district', 'code'],
      order: [['district', 'ASC']]
    });

    res.json({
      success: true,
      data: districts
    });
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching districts',
      error: error.message
    });
  }
};

/**
 * Get all education options
 */
export const getEducation = async (req, res) => {
  try {
    const education = await Education.findAll({
      attributes: ['id', 'education'],
      order: [['education', 'ASC']]
    });

    res.json({
      success: true,
      data: education
    });
  } catch (error) {
    console.error('Get education error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching education options',
      error: error.message
    });
  }
};

/**
 * Get all professions
 */
export const getProfessions = async (req, res) => {
  try {
    const professions = await Profession.findAll({
      attributes: ['id', 'profession'],
      order: [['profession', 'ASC']]
    });

    res.json({
      success: true,
      data: professions
    });
  } catch (error) {
    console.error('Get professions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professions',
      error: error.message
    });
  }
};

/**
 * Get exchange rates (proxy to external API)
 * @route   GET /api/v1/geo/exchange-rates
 * @desc    Proxy endpoint to fetch exchange rates from external API
 * @access  Public
 */
export const getExchangeRates = async (req, res) => {
  try {
    const { baseCurrency = 'INR' } = req.query;

    // Fetch exchange rate from external API using Node.js native fetch
    // Using exchangerate-api.com which is free and doesn't require an API key
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.rates) {
        res.json({
          success: true,
          data: {
            base: data.base || baseCurrency,
            rates: data.rates,
            date: data.date
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Invalid response from exchange rate service'
        });
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        res.status(504).json({
          success: false,
          message: 'Request timed out. Please try again.',
          error: 'TIMEOUT'
        });
        return;
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Get exchange rates error:', error);
    
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      res.status(504).json({
        success: false,
        message: 'Request timed out. Please try again.',
        error: 'TIMEOUT'
      });
    } else if (error.message.includes('HTTP error')) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exchange rates from service',
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error fetching exchange rates',
        error: error.message
      });
    }
  }
};

