import express from 'express';
import {
  getMyMediaApp,
  getMyMediaCategories,
  getAddonCategories,
  getMyMediaLanguages,
  getMyMediaChannels,
  getMyMediaSchedules,
  getChannelsByCategory,
  getChannelDetails,
  getChannelDocuments,
  getGalleryImages,
  getChannelStream,
  incrementViewCount
} from '../controllers/mymediaController.js';

const router = express.Router();

/**
 * MYMEDIA PUBLIC ROUTES
 * Public routes for MyMedia mobile page
 */

// GET /api/v1/mymedia/app - Get MyMedia app details
router.get('/app', getMyMediaApp);

// GET /api/v1/mymedia/categories - Get categories for MyMedia app
// Query params: appId (optional)
router.get('/categories', getMyMediaCategories);

// GET /api/v1/mymedia/addon-categories - Get addon categories for an app
// Query params: appId (required)
router.get('/addon-categories', getAddonCategories);

// GET /api/v1/mymedia/languages - Get all languages
router.get('/languages', getMyMediaLanguages);

// GET /api/v1/mymedia/channels - Get media channels with filters
// Query params: type, country_id, state_id, district_id, category_id, language_id
router.get('/channels', getMyMediaChannels);

// GET /api/v1/mymedia/channels-by-category/:categoryName - Get channels by parent category
// Query params: type, country_id, state_id, district_id, language_id, page, limit
router.get('/channels-by-category/:categoryName', getChannelsByCategory);

// GET /api/v1/mymedia/channel/:channelId - Get channel details with all related data
router.get('/channel/:channelId', getChannelDetails);

// GET /api/v1/mymedia/channel/:channelId/documents - Get documents for E-Paper/Magazine
// Query params: year, month
router.get('/channel/:channelId/documents', getChannelDocuments);

// GET /api/v1/mymedia/channel/:channelId/stream - Get TV stream URL
router.get('/channel/:channelId/stream', getChannelStream);

// POST /api/v1/mymedia/channel/:channelId/view - Increment view count
router.post('/channel/:channelId/view', incrementViewCount);

// GET /api/v1/mymedia/gallery/:albumId/images - Get gallery images
router.get('/gallery/:albumId/images', getGalleryImages);

// GET /api/v1/mymedia/schedules/:channelId - Get schedules for a channel
// Query params: weekStart (YYYY-MM-DD), day (0-6)
router.get('/schedules/:channelId', getMyMediaSchedules);

export default router;

