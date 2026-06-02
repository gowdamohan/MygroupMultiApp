import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getMyApps,
  getCategoriesByApp,
  getPricing,
  getHeaderAds,
  getHeaderAdByDate,
  getHeaderAdsManagement,
  getHeaderAdsByGroup,
  createHeaderAd,
  saveHeaderAdsManagement,
  updateHeaderAd,
  deleteHeaderAd
} from '../controllers/headerAdsController.js';
import { authenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed!'));
};

// Memory storage — franchise header ads are uploaded to Wasabi S3 in the controller
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

// Disk storage — corporate header ads management saves files locally
const managementStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/header-ads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'header-ad-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadManagement = multer({
  storage: managementStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

// Public route - Get header ads by group with priority (for mobile)
router.get('/by-group', getHeaderAdsByGroup);

// All other routes require authentication
router.use(authenticate);

// Get all "My Apps" apps
router.get('/my-apps', getMyApps);

// Get categories by app ID
router.get('/categories/:appId', getCategoriesByApp);

// Get pricing data
router.get('/pricing', getPricing);

// Get all header ads
router.get('/', getHeaderAds);

// Get header ad for a specific date (view ad on booked cell)
router.get('/by-date', getHeaderAdByDate);

// Corporate header ads management (simple)
router.get('/management', getHeaderAdsManagement);
router.post('/management', uploadManagement.single('file'), saveHeaderAdsManagement);

// Create header ad
router.post('/', upload.single('file'), createHeaderAd);

// Update header ad
router.put('/:id', upload.single('file'), updateHeaderAd);

// Delete header ad
router.delete('/:id', deleteHeaderAd);

export default router;

