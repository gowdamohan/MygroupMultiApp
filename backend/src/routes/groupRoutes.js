import express from 'express';
import { body } from 'express-validator';
import {
  getAllGroups,
  getGroupById,
  getGroupByName,
  createGroup,
  updateGroup,
  deleteGroup
} from '../controllers/groupController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

/**
 * @route   GET /api/v1/groups
 * @desc    Get all groups/applications
 * @access  Public
 */
router.get('/', getAllGroups);

/**
 * @route   GET /api/v1/groups/:id
 * @desc    Get group by ID
 * @access  Public
 */
router.get('/:id', getGroupById);

/**
 * @route   GET /api/v1/groups/name/:name
 * @desc    Get group by name
 * @access  Public
 */
router.get('/name/:name', getGroupByName);

/**
 * @route   POST /api/v1/groups
 * @desc    Create new group (Admin only)
 * @access  Private (Admin)
 */
router.post(
  '/',
  authenticate,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Group name is required'),
    body('apps_name')
      .optional()
      .trim(),
    body('db_name')
      .optional()
      .trim()
  ],
  validate,
  createGroup
);

/**
 * @route   PUT /api/v1/groups/:id
 * @desc    Update group (Admin only)
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  authenticate,
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Group name cannot be empty'),
    body('apps_name')
      .optional()
      .trim(),
    body('db_name')
      .optional()
      .trim()
  ],
  validate,
  updateGroup
);

/**
 * @route   DELETE /api/v1/groups/:id
 * @desc    Delete group (Admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, deleteGroup);

export default router;

