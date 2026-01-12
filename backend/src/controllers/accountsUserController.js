import { Op } from 'sequelize';
import User from '../models/User.js';
import Group from '../models/Group.js';
import UserGroup from '../models/UserGroup.js';
import bcrypt from 'bcryptjs';

/**
 * Get all accounts users
 * GET /api/v1/admin/accounts-users
 */
export const getAccountsUsers = async (req, res) => {
  try {
    // Find the accounts group
    const accountsGroup = await Group.findOne({
      where: { name: 'accounts' }
    });

    if (!accountsGroup) {
      return res.json({ success: true, data: [] });
    }

    // Get users in the accounts group
    const users = await User.findAll({
      include: [{
        model: Group,
        as: 'groups',
        where: { id: accountsGroup.id },
        through: { attributes: [] }
      }],
      attributes: ['id', 'first_name', 'phone', 'email', 'username', 'active'],
      order: [['id', 'DESC']]
    });

    // Map to include status
    const mappedUsers = users.map(u => ({
      ...u.toJSON(),
      status: u.active
    }));

    res.json({ success: true, data: mappedUsers });
  } catch (error) {
    console.error('Get accounts users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching accounts users',
      error: error.message
    });
  }
};

/**
 * Create accounts user
 * POST /api/v1/admin/accounts-users
 */
export const createAccountsUser = async (req, res) => {
  try {
    const { first_name, phone, email, username, password } = req.body;

    // Validate required fields
    if (!first_name || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, username, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Get or create accounts group
    let accountsGroup = await Group.findOne({ where: { name: 'accounts' } });
    if (!accountsGroup) {
      accountsGroup = await Group.create({
        name: 'accounts',
        description: 'Accounts Management Users'
      });
    }

    // Create user
    const user = await User.create({
      first_name,
      phone,
      email,
      username,
      password,
      created_on: Math.floor(Date.now() / 1000),
      active: 1
    });

    // Add to accounts group
    await UserGroup.create({
      user_id: user.id,
      group_id: accountsGroup.id
    });

    res.status(201).json({
      success: true,
      message: 'Accounts user created successfully',
      data: { id: user.id, first_name, email, username }
    });
  } catch (error) {
    console.error('Create accounts user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating accounts user',
      error: error.message
    });
  }
};

/**
 * Update accounts user
 * PUT /api/v1/admin/accounts-users/:id
 */
export const updateAccountsUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, phone, email, username } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ first_name, phone, email, username });

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update accounts user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

/**
 * Reset accounts user password
 * POST /api/v1/admin/accounts-users/:id/reset-password
 */
export const resetAccountsUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ password });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

/**
 * Toggle accounts user status
 * PATCH /api/v1/admin/accounts-users/:id/status
 */
export const toggleAccountsUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ active: status });

    res.json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message
    });
  }
};

