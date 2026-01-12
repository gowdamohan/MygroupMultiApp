import express from 'express';
import {
  getWallet,
  getTransactions,
  addFunds,
  deductFunds,
  getWalletByUserId
} from '../controllers/walletController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get current user's wallet
router.get('/', getWallet);

// Get wallet transactions
router.get('/transactions', getTransactions);

// Deduct funds (payment)
router.post('/deduct-funds', deductFunds);

// Admin routes
// Add funds to user's wallet
router.post('/add-funds', addFunds);

// Get wallet by user ID
router.get('/user/:userId', getWalletByUserId);

export default router;

