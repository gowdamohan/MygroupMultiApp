import express from 'express';
import {
  registerMember,
  registerMemberStep1,
  updateMemberProfile,
  checkUserProfile,
  memberLogin,
  getRegistrationFormFields
} from '../controllers/memberController.js';

const router = express.Router();

/**
 * MEMBER ROUTES
 * Public routes for member registration and authentication
 */

// POST /api/v1/member/register - Register new member (single step - legacy)
router.post('/register', registerMember);

// POST /api/v1/member/register-step1 - Register new member (Step 1: Create user)
router.post('/register-step1', registerMemberStep1);

// POST /api/v1/member/update-profile - Update member profile (Step 2)
router.post('/update-profile', updateMemberProfile);

// GET /api/v1/member/check-profile/:userId - Check if user profile is complete
router.get('/check-profile/:userId', checkUserProfile);

// GET /api/v1/member/registration-fields - Get registration form fields
router.get('/registration-fields', getRegistrationFormFields);

export default router;

