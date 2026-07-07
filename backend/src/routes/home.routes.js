import express from 'express';
import { getMobileHomeData, getDownloadApps, getPublicFooterPage } from '../controllers/homeController.js';

const router = express.Router();

/**
 * HOME ROUTES
 * Public routes for home page data
 */

// GET /api/v1/home/mobile-data - Get mobile home page data
router.get('/mobile-data', getMobileHomeData);

// GET /api/v1/home/download-apps - Get download links for iOS and Android apps
router.get('/download-apps', getDownloadApps);

// GET /api/v1/home/page/:type - Public footer page data (no auth)
// Supported types: about_us, clients, testimonials, milestones, events,
//   newsroom, awards, terms, privacy_policy, contact_us, social_media
router.get('/page/:type', getPublicFooterPage);

export default router;

