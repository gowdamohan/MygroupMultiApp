import express from 'express';
import {
  getAllApps,
  getAllTnc,
  getTncByGroupId,
  createOrUpdateTnc,
  deleteTnc
} from '../controllers/tncDetailsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all apps
router.get('/apps', getAllApps);

// Get all TNC
router.get('/', getAllTnc);

// Get TNC by group_id
router.get('/group/:group_id', getTncByGroupId);

// Create or update TNC
router.post('/', createOrUpdateTnc);

// Delete TNC
router.delete('/:id', deleteTnc);

export default router;

