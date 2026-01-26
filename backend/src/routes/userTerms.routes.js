import express from 'express';
import {
  getAllTerms,
  getTermsByType,
  createOrUpdateTerms,
  deleteTerms
} from '../controllers/userTermsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllTerms);
router.get('/:type', getTermsByType);
router.post('/', createOrUpdateTerms);
router.delete('/:id', deleteTerms);

export default router;
