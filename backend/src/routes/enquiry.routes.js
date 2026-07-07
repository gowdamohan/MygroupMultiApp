import express from 'express';
import {
  submitEnquiry,
  getEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
} from '../controllers/enquiryController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public — submit enquiry from footer /enquiry page
router.post('/', submitEnquiry);

// Corporate admin
router.use(authenticate);
router.get('/', getEnquiries);
router.patch('/:id/status', updateEnquiryStatus);
router.delete('/:id', deleteEnquiry);

export default router;
