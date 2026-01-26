import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  registerMember,
  registerMemberStep1,
  updateMemberProfile,
  checkUserProfile,
  memberLogin,
  getRegistrationFormFields,
  getUserStats
} from '../controllers/memberController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer for profile image (PUT update-profile with FormData)
const profileUploadDir = path.join(__dirname, '../../public/uploads/profile');
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}
const profileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, profileUploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `profile-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  }),
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

// POST /api/v1/member/update-profile - Update member profile (Step 2, JSON body e.g. RegisterStep2Form)
router.post('/update-profile', updateMemberProfile);

// PUT /api/v1/member/update-profile - Update member profile (Step 2, FormData + optional profile_img e.g. UserProfileModal)
router.put('/update-profile', profileUpload.single('profile_img'), updateMemberProfile);

// GET /api/v1/member/check-profile/:userId - Check if user profile is complete
router.get('/check-profile/:userId', checkUserProfile);

// GET /api/v1/member/registration-fields - Get registration form fields
router.get('/registration-fields', getRegistrationFormFields);

// GET /api/v1/member/registration-data - Alias for registration-fields (same data)
router.get('/registration-data', getRegistrationFormFields);

// GET /api/v1/member/user-stats - Get user statistics (public)
router.get('/user-stats', getUserStats);

export default router;

