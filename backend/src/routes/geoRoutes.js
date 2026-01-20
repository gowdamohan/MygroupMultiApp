import express from 'express';
import {
  getCountries,
  getStatesByCountry,
  getDistrictsByState,
  getEducation,
  getProfessions,
  getExchangeRates
} from '../controllers/geoController.js';

const router = express.Router();

/**
 * @route   GET /api/v1/geo/countries
 * @desc    Get all countries
 * @access  Public
 */
router.get('/countries', getCountries);

/**
 * @route   GET /api/v1/geo/countries/:countryId/states
 * @desc    Get states by country
 * @access  Public
 */
router.get('/countries/:countryId/states', getStatesByCountry);

/**
 * @route   GET /api/v1/geo/states/:countryId (Alternative route for backward compatibility)
 * @desc    Get states by country
 * @access  Public
 */
router.get('/states/:countryId', getStatesByCountry);

/**
 * @route   GET /api/v1/geo/states/:stateId/districts
 * @desc    Get districts by state
 * @access  Public
 */
router.get('/states/:stateId/districts', getDistrictsByState);

/**
 * @route   GET /api/v1/geo/districts/:stateId (Alternative route for backward compatibility)
 * @desc    Get districts by state
 * @access  Public
 */
router.get('/districts/:stateId', getDistrictsByState);

/**
 * @route   GET /api/v1/geo/education
 * @desc    Get all education options
 * @access  Public
 */
router.get('/education', getEducation);

/**
 * @route   GET /api/v1/geo/professions
 * @desc    Get all professions
 * @access  Public
 */
router.get('/professions', getProfessions);

/**
 * @route   GET /api/v1/geo/exchange-rates
 * @desc    Get exchange rates (proxy to external API)
 * @access  Public
 * @query   baseCurrency - Base currency code (default: INR)
 */
router.get('/exchange-rates', getExchangeRates);

export default router;

