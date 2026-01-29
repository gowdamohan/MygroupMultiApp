import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getHeaderAdsPricing,
  setHeaderAdsPricing,
  setHeaderAdsPricingBulk,
  deleteHeaderAdsPricing,
  getHeaderAds,
  createHeaderAd,
  updateHeaderAd,
  deleteHeaderAd,
  updateHeaderAdStatus,
  getDisplayAds,
  trackAdClick,
  getMyAds,
  getFranchiseHeaderAdsPricing,
  bookFranchiseHeaderAd,
  getCarouselAds
} from '../controllers/advertisementController.js';
import { authenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for ad file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/ads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ad-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed!'));
    }
  }
});

/**
 * ============================================
 * PUBLIC ROUTES (No authentication)
 * ============================================
 */

// Get ads for frontend display
router.get('/display', getDisplayAds);

// Get carousel ads for mobile header with location-based filtering
// Query params: country_id, state_id, district_id, app_id (optional)
router.get('/carousel', getCarouselAds);

// Track ad click
router.post('/ads/:id/click', trackAdClick);

/**
 * ============================================
 * PROTECTED ROUTES (Require authentication)
 * ============================================
 */

// Apply authentication to all routes below
router.use(authenticate);

/**
 * PRICING ROUTES
 */

// Get pricing (with filters)
router.get('/pricing', getHeaderAdsPricing);

// Set pricing for single date
router.post('/pricing', setHeaderAdsPricing);

// Set pricing for date range (bulk)
router.post('/pricing/bulk', setHeaderAdsPricingBulk);

// Delete pricing
router.delete('/pricing', deleteHeaderAdsPricing);

/**
 * ADS ROUTES
 */

// Get user's own ads
router.get('/my-ads', getMyAds);

// Get all ads (with filters)
router.get('/ads', getHeaderAds);

// Create new ad
router.post('/ads', upload.single('file'), createHeaderAd);

// Update ad
router.put('/ads/:id', upload.single('file'), updateHeaderAd);

// Delete ad
router.delete('/ads/:id', deleteHeaderAd);

// Update ad status (approve/reject)
router.patch('/ads/:id/status', updateHeaderAdStatus);

/**
 * FRANCHISE ROUTES
 */

// Get franchise header ads pricing
router.get('/franchise-pricing', getFranchiseHeaderAdsPricing);

// Book franchise header ad
router.post('/franchise-book', upload.single('ad_image'), bookFranchiseHeaderAd);

export default router;

