import { User, Group, UserGroup } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Get all users
 */
export const getAllUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search
      ? {
          [Op.or]: [
            { username: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { first_name: { [Op.like]: `%${search}%` } },
            { last_name: { [Op.like]: `%${search}%` } }
          ]
        }
      : {};

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] }
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_on', 'DESC']]
    });

    res.json({
      success: true,
      data: users.map(user => user.toJSON()),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] }
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

/**
 * Create new user
 */
export const createUser = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, phone, groups } = req.body;

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

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      first_name,
      last_name,
      phone,
      created_on: Math.floor(Date.now() / 1000),
      active: 1
    });

    // Assign groups if provided
    if (groups && groups.length > 0) {
      await user.setGroups(groups);
    }

    // Fetch user with groups
    const createdUser = await User.findByPk(user.id, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: createdUser.toJSON()
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
};

/**
 * Update user
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, first_name, last_name, phone, active, groups } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email/username is taken by another user
    if (email || username) {
      const existingUser = await User.findOne({
        where: {
          id: { [Op.ne]: id },
          [Op.or]: [
            ...(email ? [{ email }] : []),
            ...(username ? [{ username }] : [])
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email or username already taken'
        });
      }
    }

    // Update user fields
    const updates = {};
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (password !== undefined) updates.password = password;
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (phone !== undefined) updates.phone = phone;
    if (active !== undefined) updates.active = active;

    await user.update(updates);

    // Update groups if provided
    if (groups !== undefined) {
      await user.setGroups(groups);
    }

    // Fetch updated user with groups
    const updatedUser = await User.findByPk(id, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (req.user && req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

