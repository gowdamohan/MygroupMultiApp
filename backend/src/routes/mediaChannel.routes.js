import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  getMediaCategories,
  getMediaSubCategories,
  getParentCategory,
  getLanguages,
  createMediaChannel,
  getMyChannels,
  deleteMyChannel
} from '../controllers/mediaChannelController.js';
import { authenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file upload (temporary storage before compression)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/temp');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'temp-logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for upload
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

/**
 * @route   GET /api/v1/partner/media-categories/:appId
 * @desc    Get media categories for an app with registration count
 * @access  Private (Partner)
 */
router.get('/media-categories/:appId', authenticate, getMediaCategories);

/**
 * @route   GET /api/v1/partner/media-sub-categories/:appId/:parentId
 * @desc    Get sub-categories for a parent category with registration count
 * @access  Private (Partner)
 */
router.get('/media-sub-categories/:appId/:parentId', authenticate, getMediaSubCategories);

/**
 * @route   GET /api/v1/partner/media-categories/:categoryId/parent
 * @desc    Get parent category by category ID
 * @access  Private (Partner)
 */
router.get('/media-categories/:categoryId/parent', authenticate, getParentCategory);

/**
 * @route   GET /api/v1/partner/languages
 * @desc    Get all languages
 * @access  Private (Partner)
 */
router.get('/languages', authenticate, getLanguages);

/**
 * @route   POST /api/v1/partner/media-channel
 * @desc    Create media channel registration
 * @access  Private (Partner)
 */
router.post('/media-channel', authenticate, upload.single('media_logo'), createMediaChannel);

/**
 * @route   GET /api/v1/partner/my-channels
 * @desc    Get all media channels for logged-in user
 * @access  Private (Partner)
 */
router.get('/my-channels', authenticate, getMyChannels);

/**
 * @route   DELETE /api/v1/partner/my-channels/:id
 * @desc    Delete a media channel
 * @access  Private (Partner)
 */
router.delete('/my-channels/:id', authenticate, deleteMyChannel);

export default router;
