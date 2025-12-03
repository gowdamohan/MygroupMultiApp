import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getMyApps,
  getCategoriesByApp,
  getHeaderAds,
  createHeaderAd,
  updateHeaderAd,
  deleteHeaderAd
} from '../controllers/headerAdsController.js';
import { authenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/header-ads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'header-ad-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// Get all "My Apps" apps
router.get('/my-apps', getMyApps);

// Get categories by app ID
router.get('/categories/:appId', getCategoriesByApp);

// Get all header ads
router.get('/', getHeaderAds);

// Create header ad
router.post('/', upload.single('file'), createHeaderAd);

// Update header ad
router.put('/:id', upload.single('file'), updateHeaderAd);

// Delete header ad
router.delete('/:id', deleteHeaderAd);

export default router;

