import express from 'express';
import {
  getMobileHomeData,
  getDownloadApps,
  getPublicFooterPage,
  getPublicFooterPageItem,
  getPublicGallery,
  getPublicFaqs,
  getPublicGroupProfile,
} from '../controllers/homeController.js';

const router = express.Router();

/**
 * HOME ROUTES
 * Public routes for home page data
 */

// GET /api/v1/home/mobile-data - Get mobile home page data
router.get('/mobile-data', getMobileHomeData);

// GET /api/v1/home/download-apps - Get download links for iOS and Android apps
router.get('/download-apps', getDownloadApps);

// GET /api/v1/home/group-profile - my_group_profile logo (signed Wasabi URL)
router.get('/group-profile', getPublicGroupProfile);

// GET /api/v1/home/gallery - Public gallery albums with images
router.get('/gallery', getPublicGallery);

// GET /api/v1/home/faq - Public corporate FAQs
router.get('/faq', getPublicFaqs);

// GET /api/v1/home/page/:type/:id - Public footer page item (detail)
router.get('/page/:type/:id', getPublicFooterPageItem);

// GET /api/v1/home/page/:type - Public footer page data (no auth)
// Supported types: about_us, clients, testimonials, milestones, events,
//   newsroom, awards, careers, terms, privacy_policy, contact_us, social_media
router.get('/page/:type', getPublicFooterPage);

export default router;

