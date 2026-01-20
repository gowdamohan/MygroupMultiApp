import { Country, State, District, Education, Profession } from '../models/index.js';
import axios from 'axios';

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

    // Fetch exchange rate from external API
    // Using exchangerate-api.com which is free and doesn't require an API key
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`, {
      timeout: 10000 // 10 second timeout
    });

    if (response.data && response.data.rates) {
      res.json({
        success: true,
        data: {
          base: response.data.base || baseCurrency,
          rates: response.data.rates,
          date: response.data.date
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Invalid response from exchange rate service'
      });
    }
  } catch (error) {
    console.error('Get exchange rates error:', error);
    
    if (error.code === 'ECONNABORTED') {
      res.status(504).json({
        success: false,
        message: 'Request timed out. Please try again.',
        error: 'TIMEOUT'
      });
    } else if (error.response) {
      res.status(error.response.status || 500).json({
        success: false,
        message: 'Failed to fetch exchange rates from service',
        error: error.response.statusText || error.message
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

