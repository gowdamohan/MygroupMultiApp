import express from 'express';
import {
  getAppTopIcons,
  getAppAds
} from '../controllers/mymediaController.js';

const router = express.Router();

/**
 * APPS ROUTES
 * Public routes for app-specific data (top icons, ads, etc.)
 */

// GET /api/v1/apps/:appId/top-icons - Get top navigation icons for an app
router.get('/:appId/top-icons', getAppTopIcons);

// GET /api/v1/apps/:appId/ads - Get carousel ads for an app
router.get('/:appId/ads', getAppAds);

export default router;

