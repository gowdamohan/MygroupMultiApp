import express from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
router.get('/', authenticate, getAllUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin)
 */
router.get('/:id', authenticate, getUserById);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (Admin)
 */
router.post(
  '/',
  authenticate,
  [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
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
  createUser
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  authenticate,
  [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .optional()
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
      .withMessage('Phone must be less than 20 characters'),
    body('active')
      .optional()
      .isBoolean()
      .withMessage('Active must be a boolean value')
  ],
  validate,
  updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, deleteUser);

export default router;

