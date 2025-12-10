import express from 'express';
import {
  getAllTerms,
  getTermsByType,
  createOrUpdateTerms,
  deleteTerms
} from '../controllers/franchiseTermsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all terms
router.get('/', getAllTerms);

// Get terms by type
router.get('/:type', getTermsByType);

// Create or update terms
router.post('/', createOrUpdateTerms);

// Delete terms
router.delete('/:id', deleteTerms);

export default router;

