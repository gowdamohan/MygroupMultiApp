import express from 'express';
import { getOfferAds } from '../controllers/franchiseOfferAdsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getOfferAds);

export default router;
