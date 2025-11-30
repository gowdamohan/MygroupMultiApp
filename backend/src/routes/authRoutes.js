import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  refreshToken,
  getProfile,
  adminLogin,
  groupAdminLogin,
  clientLogin,
  partnerLogin,
  reporterLogin
} from '../controllers/authController.js';
import { forgotPassword, resetPassword, changePassword } from '../controllers/passwordController.js';
import { getActiveSessions, revokeSession, revokeAllSessions, updateProfile, logout } from '../controllers/sessionController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Username must be between 3 and 100 characters')
      .isAlphanumeric()
      .withMessage('Username must contain only letters and numbers'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('first_name')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('First name must be less than 50 characters'),
    body('last_name')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Last name must be less than 50 characters'),
    body('phone')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Phone must be less than 20 characters')
  ],
  validate,
  register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user (basic)
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email or username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validate,
  login
);

/**
 * @route   POST /api/v1/auth/admin/login
 * @desc    Admin/Corporate login
 * @access  Public
 */
router.post(
  '/admin/login',
  [
    body('identity')
      .trim()
      .notEmpty()
      .withMessage('Email or username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validate,
  adminLogin
);

/**
 * @route   POST /api/v1/auth/group-admin/login/:groupName
 * @desc    Group admin login
 * @access  Public
 */
router.post(
  '/group-admin/login/:groupName',
  [
    body('identity')
      .trim()
      .notEmpty()
      .withMessage('Email or username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validate,
  groupAdminLogin
);

/**
 * @route   POST /api/v1/auth/client/login/:groupName
 * @desc    Client login
 * @access  Public
 */
router.post(
  '/client/login/:groupName',
  [
    body('identity')
      .trim()
      .notEmpty()
      .withMessage('Email or username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validate,
  clientLogin
);

/**
 * @route   POST /api/v1/auth/partner/login
 * @desc    Partner login
 * @access  Public
 */
router.post(
  '/partner/login',
  [
    body('identity')
      .trim()
      .notEmpty()
      .withMessage('Email or username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validate,
  partnerLogin
);

/**
 * @route   POST /api/v1/auth/reporter/login
 * @desc    Reporter login
 * @access  Public
 */
router.post(
  '/reporter/login',
  [
    body('identity')
      .trim()
      .notEmpty()
      .withMessage('Email or username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validate,
  reporterLogin
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
  ],
  validate,
  refreshToken
);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  [
    body('first_name')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('First name must be less than 50 characters'),
    body('last_name')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Last name must be less than 50 characters'),
    body('phone')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Phone must be less than 20 characters')
  ],
  validate,
  updateProfile
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail()
  ],
  validate,
  forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  validate,
  resetPassword
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password (authenticated)
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
  ],
  validate,
  changePassword
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get active sessions
 * @access  Private
 */
router.get('/sessions', authenticate, getActiveSessions);

/**
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @desc    Revoke specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId', authenticate, revokeSession);

/**
 * @route   DELETE /api/v1/auth/sessions
 * @desc    Revoke all sessions except current
 * @access  Private
 */
router.delete('/sessions', authenticate, revokeAllSessions);

export default router;

