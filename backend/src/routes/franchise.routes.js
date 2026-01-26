import express from 'express';
import {
  getHeadOfficeUsers,
  createHeadOfficeUser,
  updateHeadOfficeUser,
  resetHeadOfficePassword,
  toggleHeadOfficeStatus,
  getRegionalOfficeUsers,
  createRegionalOfficeUser,
  updateRegionalOfficeUser,
  resetRegionalOfficePassword,
  toggleRegionalOfficeStatus,
  getBranchOfficeUsers,
  createBranchOfficeUser,
  updateBranchOfficeUser,
  resetBranchOfficePassword,
  toggleBranchOfficeStatus,
  getOfficeAddress,
  updateOfficeAddress
} from '../controllers/franchiseController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Head Office Login Management
router.get('/head-office-users', getHeadOfficeUsers);
router.post('/head-office-users', createHeadOfficeUser);
router.put('/head-office-users/:id', updateHeadOfficeUser);
router.post('/head-office-users/:id/reset-password', resetHeadOfficePassword);
router.patch('/head-office-users/:id/toggle-status', toggleHeadOfficeStatus);

// Regional Office Login Management
router.get('/regional-office-users', getRegionalOfficeUsers);
router.post('/regional-office-users', createRegionalOfficeUser);
router.put('/regional-office-users/:id', updateRegionalOfficeUser);
router.post('/regional-office-users/:id/reset-password', resetRegionalOfficePassword);
router.patch('/regional-office-users/:id/toggle-status', toggleRegionalOfficeStatus);

// Branch Office Login Management
router.get('/branch-office-users', getBranchOfficeUsers);
router.post('/branch-office-users', createBranchOfficeUser);
router.put('/branch-office-users/:id', updateBranchOfficeUser);
router.post('/branch-office-users/:id/reset-password', resetBranchOfficePassword);
router.patch('/branch-office-users/:id/toggle-status', toggleBranchOfficeStatus);

// Franchise office address (authenticated)
router.get('/office-address', authenticate, getOfficeAddress);
router.put('/office-address', authenticate, updateOfficeAddress);

export default router;

