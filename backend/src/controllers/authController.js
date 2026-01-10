import {
  User,
  Group,
  UserGroup,
  GroupCreate,
  CreateDetails,
  UserRegistration,
  Country,
  State,
  District,
  Education,
  Profession
} from '../models/index.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

/**
 * Register new user
 */
export const register = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, phone } = req.body;

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

    // Create new user
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

    // Generate tokens
    const tokens = generateTokens(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        ...tokens
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email or username
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username: email }]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.update({
      last_login: Math.floor(Date.now() / 1000)
    });

    // Generate tokens
    const tokens = generateTokens(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        ...tokens
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      error: error.message
    });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] }
        },
        {
          model: UserRegistration,
          as: 'profile',
          include: [
            { model: Country, as: 'countryData' },
            { model: State, as: 'stateData' },
            { model: District, as: 'districtData' },
            { model: Country, as: 'setCountryData', foreignKey: 'set_country' },
            { model: State, as: 'setStateData', foreignKey: 'set_state' },
            { model: District, as: 'setDistrictData', foreignKey: 'set_district' },
            { model: Education, as: 'educationData' },
            { model: Profession, as: 'professionData' }
          ]
        },
        {
          model: GroupCreate,
          as: 'groupDetails',
          include: [{ model: CreateDetails, as: 'details' }]
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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

/**
 * Admin/Corporate Login
 * Roles: admin, groups, corporate, head_office, regional, branch
 */
export const adminLogin = async (req, res) => {
  try {
    const { identity, password, remember } = req.body;

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identity }, { username: identity }]
      },
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] }
        }
      ]
    });

    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or inactive account'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const userRoles = user.groups.map(g => g.name);
    const allowedRoles = ['admin', 'groups', 'corporate', 'head_office', 'regional', 'branch'];
    const hasPermission = userRoles.some(role => allowedRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    await user.update({ last_login: Math.floor(Date.now() / 1000) });

    const tokens = generateTokens(user, remember);
    const dashboardRoute = getDashboardRoute(userRoles[0]);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: formatUserResponse(user),
        ...tokens,
        dashboardRoute
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * Group Admin Login
 * Route: /admin/login/:groupName
 */
export const groupAdminLogin = async (req, res) => {
  try {
    const { groupName } = req.params;
    const { identity, password, remember } = req.body;

    const group = await GroupCreate.findOne({
      where: { name: groupName },
      include: [{ model: CreateDetails, as: 'details' }]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identity }, { username: identity }],
        group_id: group.id
      },
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] }
        },
        {
          model: UserRegistration,
          as: 'profile'
        },
        {
          model: GroupCreate,
          as: 'groupDetails',
          include: [{ model: CreateDetails, as: 'details' }]
        }
      ]
    });

    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const userRoles = user.groups.map(g => g.name);
    const isProfileComplete = user.profile && user.profile.country && user.profile.state;

    if (!isProfileComplete && userRoles.includes('client')) {
      return res.json({
        success: true,
        requiresProfileCompletion: true,
        data: {
          userId: user.id,
          groupId: group.id,
          groupName: group.name,
          redirectTo: `/client-form/${group.name}/${group.id}/${user.id}`
        }
      });
    }

    await user.update({ last_login: Math.floor(Date.now() / 1000) });

    const tokens = generateTokens(user, remember);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: formatUserResponse(user),
        group: {
          id: group.id,
          name: group.name,
          appsName: group.apps_name,
          branding: group.details
        },
        ...tokens,
        dashboardRoute: '/dashboard/client'
      }
    });
  } catch (error) {
    console.error('Group admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * Client Login
 * Route: /client/login/:groupName
 */
export const clientLogin = async (req, res) => {
  try {
    const { groupName } = req.params;
    const { identity, password, remember } = req.body;

    const group = await GroupCreate.findOne({ where: { name: groupName } });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identity }, { username: identity }],
        group_id: group.id
      },
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] }
        },
        {
          model: UserRegistration,
          as: 'profile'
        }
      ]
    });

    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const userRoles = user.groups.map(g => g.name);
    const isProfileComplete = user.profile && user.profile.country && user.profile.state;

    if (!isProfileComplete && userRoles.includes('client')) {
      return res.json({
        success: true,
        requiresProfileCompletion: true,
        data: {
          userId: user.id,
          groupId: group.id,
          groupName: group.name,
          redirectTo: `/client-form/${group.name}/${group.id}/${user.id}`
        }
      });
    }

    await user.update({ last_login: Math.floor(Date.now() / 1000) });

    const tokens = generateTokens(user, remember);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: formatUserResponse(user),
        group: { id: group.id, name: group.name },
        ...tokens,
        dashboardRoute: '/dashboard/client'
      }
    });
  } catch (error) {
    console.error('Client login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * Partner Login
 */
export const partnerLogin = async (req, res) => {
  try {
    const { identity, password, remember } = req.body;

    const user = await User.findOne({
      where: { [Op.or]: [{ email: identity }, { username: identity }] },
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] }
        }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const userRoles = user.groups.map(g => g.name);
    if (!userRoles.includes('partner')) {
      return res.status(403).json({
        success: false,
        message: 'Partner access required'
      });
    }

    await user.update({ last_login: Math.floor(Date.now() / 1000) });

    const tokens = generateTokens(user, remember);

    // Include active status in response so frontend can handle inactive users
    res.json({
      success: true,
      message: user.active ? 'Login successful' : 'Login successful - Account pending activation',
      data: {
        user: {
          ...formatUserResponse(user),
          active: user.active // Include active status explicitly
        },
        ...tokens,
        dashboardRoute: '/dashboard/partner'
      }
    });
  } catch (error) {
    console.error('Partner login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * Reporter Login
 */
export const reporterLogin = async (req, res) => {
  try {
    const { identity, password, remember } = req.body;

    const user = await User.findOne({
      where: { [Op.or]: [{ email: identity }, { username: identity }] },
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] }
        }
      ]
    });

    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const userRoles = user.groups.map(g => g.name);
    if (!userRoles.includes('reporter')) {
      return res.status(403).json({
        success: false,
        message: 'Reporter access required'
      });
    }

    await user.update({ last_login: Math.floor(Date.now() / 1000) });

    const tokens = generateTokens(user, remember);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: formatUserResponse(user),
        ...tokens,
        dashboardRoute: '/dashboard/reporter'
      }
    });
  } catch (error) {
    console.error('Reporter login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatUserResponse(user) {
  const userObj = user.toJSON();
  return {
    id: userObj.id,
    username: userObj.username,
    email: userObj.email,
    first_name: userObj.first_name,
    last_name: userObj.last_name,
    display_name: userObj.display_name,
    profile_img: userObj.profile_img,
    phone: userObj.phone,
    company: userObj.company,
    group_id: userObj.group_id, // Include group_id for partner/client access
    groups: userObj.groups ? userObj.groups.map(g => ({ id: g.id, name: g.name })) : [],
    profile: userObj.profile || null,
    groupDetails: userObj.groupDetails || null
  };
}

function getDashboardRoute(role, groupType = null) {
  const dashboardMap = {
    'admin': '/dashboard/admin',
    'groups': '/dashboard/admin',
    'client': '/dashboard/client',
    'client_god': '/dashboard/client',
    'corporate': '/dashboard/corporate',
    'head_office': '/dashboard/franchise',
    'regional': '/dashboard/franchise',
    'branch': '/dashboard/franchise',
    'labor': '/dashboard/labor',
    'partner': '/dashboard/partner',
    'reporter': '/dashboard/reporter',
    'media': '/dashboard/media'
  };

  return dashboardMap[role] || '/dashboard';
}

/**
 * Update user location
 */
export const updateUserLocation = async (req, res) => {
  try {
    const { set_country, set_state, set_district } = req.body;
    const userId = req.user.id;

    // Find or create user registration record
    let userRegistration = await UserRegistration.findOne({
      where: { user_id: userId }
    });

    if (!userRegistration) {
      userRegistration = await UserRegistration.create({
        user_id: userId,
        set_country,
        set_state,
        set_district
      });
    } else {
      await userRegistration.update({
        set_country,
        set_state,
        set_district
      });
    }

    // Fetch updated data with location details
    const updatedRegistration = await UserRegistration.findOne({
      where: { user_id: userId },
      include: [
        { model: Country, as: 'setCountryData', foreignKey: 'set_country' },
        { model: State, as: 'setStateData', foreignKey: 'set_state' },
        { model: District, as: 'setDistrictData', foreignKey: 'set_district' }
      ]
    });

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: updatedRegistration
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
};

