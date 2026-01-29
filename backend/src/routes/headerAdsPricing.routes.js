import express from 'express';
import {
  getCountries,
  getPricingMaster,
  getAllPricingMasterByCountry,
  createPricingMaster,
  getPricingSlave,
  updateSlavePricing,
  getFranchiseLocationPricing,
  getPricingWithMultiplier,
  getLocationHierarchyPricing
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

// Franchise location-based pricing
router.get('/franchise-location', getFranchiseLocationPricing);
router.get('/with-multiplier', getPricingWithMultiplier);
router.get('/location-hierarchy', getLocationHierarchyPricing);

export default router;
