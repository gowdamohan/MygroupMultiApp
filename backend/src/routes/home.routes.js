import express from 'express';
import { getMobileHomeData, getDownloadApps } from '../controllers/homeController.js';

const router = express.Router();

/**
 * HOME ROUTES
 * Public routes for home page data
 */

// GET /api/v1/home/mobile-data - Get mobile home page data
router.get('/mobile-data', getMobileHomeData);

// GET /api/v1/home/download-apps - Get download links for iOS and Android apps
router.get('/download-apps', getDownloadApps);

export default router;

