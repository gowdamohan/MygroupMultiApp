import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getMyMediaApp,
  getViewerLocation,
  getMyMediaCategories,
  getAddonCategories,
  getMyMediaLanguages,
  getMyMediaChannels,
  getMyMediaSchedules,
  getChannelsByCategory,
  getChannelDetails,
  getChannelDocuments,
  streamChannelDocument,
  getGalleryImages,
  getChannelStream,
  incrementViewCount,
  toggleLike,
  toggleFollow,
  getChannelReviews,
  postChannelReview,
  getChannelNewsFeed
} from '../controllers/mymediaController.js';

const router = express.Router();

/**
 * MYMEDIA PUBLIC ROUTES
 * Public routes for MyMedia mobile page
 */

// GET /api/v1/mymedia/app - Get MyMedia app details
router.get('/app', getMyMediaApp);

// GET /api/v1/mymedia/viewer-location - Default location from user_registration_form (auth)
router.get('/viewer-location', authenticate, getViewerLocation);

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

// ── Specific sub-routes first (before the base /:channelId catch-all) ──────

// GET /api/v1/mymedia/channel/:channelId/news-feed - Fetch RSS/Atom news feed for a Web/TV channel
router.get('/channel/:channelId/news-feed', getChannelNewsFeed);

// GET /api/v1/mymedia/channel/:channelId/documents - Get documents for E-Paper/Magazine
// Query params: year, month
router.get('/channel/:channelId/documents', getChannelDocuments);

// GET /api/v1/mymedia/channel/:channelId/stream - Get TV stream URL
router.get('/channel/:channelId/stream', getChannelStream);

// GET /api/v1/mymedia/channel/:channelId/reviews - Get channel reviews/ratings
router.get('/channel/:channelId/reviews', getChannelReviews);

// POST /api/v1/mymedia/channel/:channelId/reviews - Submit a review
router.post('/channel/:channelId/reviews', postChannelReview);

// POST /api/v1/mymedia/channel/:channelId/view - Increment view count
router.post('/channel/:channelId/view', incrementViewCount);

// POST /api/v1/mymedia/channel/:channelId/like - Toggle like (body: { action: 'like'|'unlike' })
router.post('/channel/:channelId/like', toggleLike);

// POST /api/v1/mymedia/channel/:channelId/follow - Toggle follow (body: { action: 'follow'|'unfollow' })
router.post('/channel/:channelId/follow', toggleFollow);

// ── Base channel route (must come after all /:channelId/sub-routes) ─────────

// GET /api/v1/mymedia/channel/:channelId - Get channel details with all related data
router.get('/channel/:channelId', getChannelDetails);

// ── Other routes ─────────────────────────────────────────────────────────────

// GET /api/v1/mymedia/document/:documentId/stream - Inline PDF stream (same-origin)
router.get('/document/:documentId/stream', streamChannelDocument);

// GET /api/v1/mymedia/gallery/:albumId/images - Get gallery images (with signed Wasabi URLs)
router.get('/gallery/:albumId/images', getGalleryImages);

// GET /api/v1/mymedia/schedules/:channelId - Get schedules for a channel
// Query params: weekStart (YYYY-MM-DD), day (0-6)
router.get('/schedules/:channelId', getMyMediaSchedules);

export default router;

