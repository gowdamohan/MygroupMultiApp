import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Wallet,
  WalletTransaction,
  User
} from '../models/index.js';

/**
 * ============================================
 * WALLET MANAGEMENT
 * ============================================
 */

/**
 * Get user's wallet
 * GET /api/v1/wallet
 */
export const getWallet = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { wallet_type = 'partner' } = req.query;

    let wallet = await Wallet.findOne({
      where: { user_id: userId, wallet_type },
      include: [
        { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await Wallet.create({
        user_id: userId,
        wallet_type,
        balance: 0.00,
        currency: 'INR'
      });
    }

    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet',
      error: error.message
    });
  }
};

/**
 * Get wallet transactions
 * GET /api/v1/wallet/transactions
 */
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { wallet_type = 'partner', page = 1, limit = 20, transaction_type } = req.query;

    const wallet = await Wallet.findOne({
      where: { user_id: userId, wallet_type }
    });

    if (!wallet) {
      return res.json({
        success: true,
        data: { transactions: [], total: 0, page: 1, totalPages: 0 }
      });
    }

    const where = { wallet_id: wallet.id };
    if (transaction_type) where.transaction_type = transaction_type;

    const transactions = await WalletTransaction.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        transactions: transactions.rows,
        total: transactions.count,
        page: parseInt(page),
        totalPages: Math.ceil(transactions.count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

/**
 * Add funds to wallet (Admin only)
 * POST /api/v1/wallet/add-funds
 */
export const addFunds = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { user_id, amount, description, wallet_type = 'partner' } = req.body;

    if (!user_id || !amount || amount <= 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'user_id and positive amount are required'
      });
    }

    // Get or create wallet
    let wallet = await Wallet.findOne({
      where: { user_id, wallet_type },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!wallet) {
      wallet = await Wallet.create({
        user_id,
        wallet_type,
        balance: 0.00,
        currency: 'INR'
      }, { transaction: t });
    }

    const balanceBefore = parseFloat(wallet.balance);
    const balanceAfter = balanceBefore + parseFloat(amount);

    // Create transaction record
    await WalletTransaction.create({
      wallet_id: wallet.id,
      transaction_type: 'credit',
      amount: parseFloat(amount),
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: description || 'Funds added by admin',
      status: 'completed'
    }, { transaction: t });

    // Update wallet balance
    await wallet.update({ balance: balanceAfter }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: 'Funds added successfully',
      data: { balance: balanceAfter }
    });
  } catch (error) {
    await t.rollback();
    console.error('Add funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding funds',
      error: error.message
    });
  }
};

/**
 * Deduct funds from wallet
 * POST /api/v1/wallet/deduct-funds
 */
export const deductFunds = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user?.id;
    const { amount, description, reference_type, reference_id, wallet_type = 'partner' } = req.body;

    if (!amount || amount <= 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Positive amount is required'
      });
    }

    const wallet = await Wallet.findOne({
      where: { user_id: userId, wallet_type },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!wallet) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    const balanceBefore = parseFloat(wallet.balance);

    if (balanceBefore < parseFloat(amount)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    const balanceAfter = balanceBefore - parseFloat(amount);

    // Create transaction record
    await WalletTransaction.create({
      wallet_id: wallet.id,
      transaction_type: 'debit',
      amount: parseFloat(amount),
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reference_type: reference_type || null,
      reference_id: reference_id || null,
      description: description || 'Payment',
      status: 'completed'
    }, { transaction: t });

    // Update wallet balance
    await wallet.update({ balance: balanceAfter }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: 'Payment successful',
      data: { balance: balanceAfter }
    });
  } catch (error) {
    await t.rollback();
    console.error('Deduct funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
};

/**
 * Get wallet by user ID (Admin)
 * GET /api/v1/wallet/user/:userId
 */
export const getWalletByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { wallet_type = 'partner' } = req.query;

    const wallet = await Wallet.findOne({
      where: { user_id: userId, wallet_type },
      include: [
        { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    console.error('Get wallet by user ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet',
      error: error.message
    });
  }
};

