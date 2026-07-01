import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  registerMember,
  registerMemberStep1,
  sendMemberWhatsappOtp,
  verifyMemberWhatsappOtp,
  updateMemberProfile,
  checkUserProfile,
  memberLogin,
  getRegistrationFormFields,
  getUserStats,
  getUserTerms
} from '../controllers/memberController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Multer memory storage for profile image → Wasabi (PUT update-profile with FormData)
const profileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(file.mimetype) || allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * MEMBER ROUTES
 * Public routes for member registration and authentication
 */

// POST /api/v1/member/register - Register new member (single step - legacy)
router.post('/register', registerMember);

// POST /api/v1/member/register-step1 - Register new member (Step 1: Create user)
router.post('/register-step1', registerMemberStep1);

// POST /api/v1/member/send-whatsapp-otp - Send registration OTP via WhatsApp
router.post('/send-whatsapp-otp', sendMemberWhatsappOtp);

// POST /api/v1/member/verify-whatsapp-otp - Verify WhatsApp OTP and complete Step 1
router.post('/verify-whatsapp-otp', verifyMemberWhatsappOtp);

// Protected member profile routes
router.post('/update-profile', authenticate, updateMemberProfile);
router.put('/update-profile', authenticate, profileUpload.single('profile_img'), updateMemberProfile);
router.get('/check-profile/:userId', authenticate, checkUserProfile);

// GET /api/v1/member/registration-fields - Get registration form fields
router.get('/registration-fields', getRegistrationFormFields);

// GET /api/v1/member/registration-data - Alias for registration-fields (same data)
router.get('/registration-data', getRegistrationFormFields);

// GET /api/v1/member/user-stats - Get user statistics (public)
router.get('/user-stats', getUserStats);

// GET /api/v1/member/user-terms - Get user terms and conditions (public)
router.get('/user-terms', getUserTerms);

export default router;

