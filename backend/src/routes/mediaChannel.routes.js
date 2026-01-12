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
  deleteMyChannel,
  getPartnerHeaderAds,
  getUserProfile,
  uploadProfilePhoto,
  checkPasscode,
  generatePasscode,
  setPasscode,
  verifyPasscode,
  changePasscode,
  forgotPasscode,
  togglePasscodeStatus,
  toggleChannelStatus,
  sendChangePasscodeOtp,
  verifyOtpChangePasscode,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule
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

/**
 * @route   GET /api/v1/partner/header-ads
 * @desc    Get partner header ads for carousel
 * @access  Private (Partner)
 */
router.get('/header-ads', authenticate, getPartnerHeaderAds);

/**
 * @route   GET /api/v1/partner/user-profile
 * @desc    Get user profile for sidebar
 * @access  Private (Partner)
 */
router.get('/user-profile', authenticate, getUserProfile);

/**
 * @route   POST /api/v1/partner/profile-photo
 * @desc    Upload profile photo
 * @access  Private (Partner)
 */
router.post('/profile-photo', authenticate, upload.single('profile_photo'), uploadProfilePhoto);

/**
 * @route   GET /api/v1/partner/channel/:id/check-passcode
 * @desc    Check if passcode is set for a channel
 * @access  Private (Partner)
 */
router.get('/channel/:id/check-passcode', authenticate, checkPasscode);

/**
 * @route   POST /api/v1/partner/channel/:id/generate-passcode
 * @desc    Generate new passcode for a channel
 * @access  Private (Partner)
 */
router.post('/channel/:id/generate-passcode', authenticate, generatePasscode);

/**
 * @route   POST /api/v1/partner/channel/:id/verify-passcode
 * @desc    Verify passcode for a channel
 * @access  Private (Partner)
 */
router.post('/channel/:id/verify-passcode', authenticate, verifyPasscode);

/**
 * @route   POST /api/v1/partner/channel/:id/change-passcode
 * @desc    Change passcode for a channel
 * @access  Private (Partner)
 */
router.post('/channel/:id/change-passcode', authenticate, changePasscode);

/**
 * @route   POST /api/v1/partner/channel/:id/forgot-passcode
 * @desc    Forgot passcode - send email with new passcode
 * @access  Private (Partner)
 */
router.post('/channel/:id/forgot-passcode', authenticate, forgotPasscode);

/**
 * @route   POST /api/v1/partner/channel/:id/set-passcode
 * @desc    Set passcode for a channel (first time)
 * @access  Private (Partner)
 */
router.post('/channel/:id/set-passcode', authenticate, setPasscode);

/**
 * @route   POST /api/v1/partner/channel/:id/toggle-passcode-status
 * @desc    Toggle passcode status for a channel
 * @access  Private (Partner)
 */
router.post('/channel/:id/toggle-passcode-status', authenticate, togglePasscodeStatus);

/**
 * @route   POST /api/v1/partner/channel/:id/toggle-status
 * @desc    Toggle channel active status
 * @access  Private (Partner)
 */
router.post('/channel/:id/toggle-status', authenticate, toggleChannelStatus);

/**
 * @route   POST /api/v1/partner/channel/:id/send-change-otp
 * @desc    Send OTP for passcode change
 * @access  Private (Partner)
 */
router.post('/channel/:id/send-change-otp', authenticate, sendChangePasscodeOtp);

/**
 * @route   POST /api/v1/partner/channel/:id/verify-otp-change-passcode
 * @desc    Verify OTP and change passcode
 * @access  Private (Partner)
 */
router.post('/channel/:id/verify-otp-change-passcode', authenticate, verifyOtpChangePasscode);

// ===========================
// SCHEDULE ROUTES
// ===========================

// Configure multer for schedule media uploads
const scheduleUploadDir = path.join(__dirname, '../../public/uploads/schedules');
if (!fs.existsSync(scheduleUploadDir)) {
  fs.mkdirSync(scheduleUploadDir, { recursive: true });
}

const scheduleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, scheduleUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'schedule-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const scheduleUpload = multer({
  storage: scheduleStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for media
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mp3|wav|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image, video, and audio files are allowed'));
  }
});

/**
 * @route   GET /api/v1/partner/channel/:id/schedules
 * @desc    Get schedules for a channel (week view)
 * @access  Private (Partner)
 */
router.get('/channel/:id/schedules', authenticate, getSchedules);

/**
 * @route   POST /api/v1/partner/channel/:id/schedules
 * @desc    Create a new schedule
 * @access  Private (Partner)
 */
router.post('/channel/:id/schedules', authenticate, scheduleUpload.single('media_file'), createSchedule);

/**
 * @route   PUT /api/v1/partner/channel/:channelId/schedules/:scheduleId
 * @desc    Update a schedule (future dates only)
 * @access  Private (Partner)
 */
router.put('/channel/:channelId/schedules/:scheduleId', authenticate, scheduleUpload.single('media_file'), updateSchedule);

/**
 * @route   DELETE /api/v1/partner/channel/:channelId/schedules/:scheduleId
 * @desc    Delete a schedule
 * @access  Private (Partner)
 */
router.delete('/channel/:channelId/schedules/:scheduleId', authenticate, deleteSchedule);

export default router;
