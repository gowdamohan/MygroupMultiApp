import express from 'express';
import {
  getMyMediaApp,
  getMyMediaCategories,
  getMyMediaLanguages,
  getMyMediaChannels,
  getMyMediaSchedules
} from '../controllers/mymediaController.js';

const router = express.Router();

/**
 * MYMEDIA PUBLIC ROUTES
 * Public routes for MyMedia mobile page
 */

// GET /api/v1/mymedia/app - Get MyMedia app details
router.get('/app', getMyMediaApp);

// GET /api/v1/mymedia/categories - Get categories for MyMedia app
router.get('/categories', getMyMediaCategories);

// GET /api/v1/mymedia/languages - Get all languages
router.get('/languages', getMyMediaLanguages);

// GET /api/v1/mymedia/channels - Get media channels with filters
// Query params: type, country_id, state_id, district_id, category_id, language_id
router.get('/channels', getMyMediaChannels);

// GET /api/v1/mymedia/schedules/:channelId - Get schedules for a channel
// Query params: weekStart (YYYY-MM-DD), day (0-6)
router.get('/schedules/:channelId', getMyMediaSchedules);

export default router;

