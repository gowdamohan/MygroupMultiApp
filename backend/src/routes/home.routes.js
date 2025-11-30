import express from 'express';
import { getMobileHomeData } from '../controllers/homeController.js';

const router = express.Router();

/**
 * HOME ROUTES
 * Public routes for home page data
 */

// GET /api/v1/home/mobile-data - Get mobile home page data
router.get('/mobile-data', getMobileHomeData);

export default router;

