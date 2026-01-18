import express from 'express';
import {
  getCountries,
  getPricingMaster,
  getAllPricingMasterByCountry,
  createPricingMaster,
  getPricingSlave,
  updateSlavePricing
} from '../controllers/headerAdsPricingController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get countries
router.get('/countries', getCountries);

// Pricing master routes
router.get('/master', getPricingMaster);
router.get('/master/all', getAllPricingMasterByCountry);
router.post('/master', createPricingMaster);

// Pricing slave routes
router.get('/slave', getPricingSlave);
router.put('/slave', updateSlavePricing);

export default router;
