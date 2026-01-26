import { User, Group, UserGroup, FranchiseHolder, Country, State, District, FranchiseOfficeAddress } from '../models/index.js';
import { Op } from 'sequelize';

// Get all head office users with country filter
export const getHeadOfficeUsers = async (req, res) => {
  try {
    const { country } = req.query;

    // Find head_office group
    const headOfficeGroup = await Group.findOne({ where: { name: 'head_office' } });
    if (!headOfficeGroup) {
      return res.status(404).json({ message: 'Head office group not found' });
    }

    // Build where clause for franchise holder
    const franchiseWhere = {};
    if (country) {
      franchiseWhere.country = country;
    }

    // Get all users in head_office group with franchise holder data
    const userGroups = await UserGroup.findAll({
      where: { group_id: headOfficeGroup.id },
      include: [
        {
          model: User,
          as: 'user',
          include: [
            {
              model: FranchiseHolder,
              as: 'franchiseHolder',
              where: franchiseWhere,
              required: country ? true : false,
              include: [
                {
                  model: Country,
                  as: 'countryData',
                  attributes: ['id', 'country']
                }
              ]
            }
          ]
        }
      ]
    });

    const users = userGroups.map(ug => {
      const user = ug.user;
      const franchiseHolder = user.franchiseHolder;
      
      return {
        id: user.id,
        first_name: user.first_name,
        phone: user.phone,
        email: user.email,
        username: user.username,
        status: user.active,
        country_id: franchiseHolder?.country,
        country_name: franchiseHolder?.countryData?.country || '',
        franchise_holder_id: franchiseHolder?.id
      };
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching head office users:', error);
    res.status(500).json({ message: 'Error fetching head office users', error: error.message });
  }
};

// Create head office user
export const createHeadOfficeUser = async (req, res) => {
  try {
    const { first_name, phone, email, username, country } = req.body;

    // Validate required fields
    if (!first_name || !phone || !email || !username || !country) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Find head_office group
    const headOfficeGroup = await Group.findOne({ where: { name: 'head_office' } });
    if (!headOfficeGroup) {
      return res.status(404).json({ message: 'Head office group not found' });
    }

    // Create user with default password '123456'
    const user = await User.create({
      first_name,
      phone,
      email,
      username,
      password: '123456', // Will be hashed by User model hook
      active: 1 // Active by default
    });

    // Create user-group association
    await UserGroup.create({
      user_id: user.id,
      group_id: headOfficeGroup.id
    });

    // Create franchise holder record
    const franchiseHolder = await FranchiseHolder.create({
      user_id: user.id,
      country: country
    });

    // Fetch country data
    const countryData = await Country.findByPk(country);

    res.status(201).json({
      message: 'Head office user created successfully',
      user: {
        id: user.id,
        first_name: user.first_name,
        phone: user.phone,
        email: user.email,
        username: user.username,
        status: user.active,
        country_id: country,
        country_name: countryData?.country || '',
        franchise_holder_id: franchiseHolder.id
      }
    });
  } catch (error) {
    console.error('Error creating head office user:', error);
    res.status(500).json({ message: 'Error creating head office user', error: error.message });
  }
};

// Update head office user
export const updateHeadOfficeUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, phone, email, username, country } = req.body;

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username or email already exists (excluding current user)
    if (username || email) {
      const existingUser = await User.findOne({
        where: {
          id: { [Op.ne]: id },
          [Op.or]: [
            username ? { username } : null,
            email ? { email } : null
          ].filter(Boolean)
        }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Username or email already exists' });
      }
    }

    // Update user
    await user.update({
      first_name: first_name || user.first_name,
      phone: phone || user.phone,
      email: email || user.email,
      username: username || user.username
    });

    // Update franchise holder if country is provided
    if (country) {
      const franchiseHolder = await FranchiseHolder.findOne({ where: { user_id: id } });
      if (franchiseHolder) {
        await franchiseHolder.update({ country });
      }
    }

    // Fetch updated data with country
    const franchiseHolder = await FranchiseHolder.findOne({
      where: { user_id: id },
      include: [
        {
          model: Country,
          as: 'countryData',
          attributes: ['id', 'country']
        }
      ]
    });

    res.json({
      message: 'Head office user updated successfully',
      user: {
        id: user.id,
        first_name: user.first_name,
        phone: user.phone,
        email: user.email,
        username: user.username,
        status: user.active,
        country_id: franchiseHolder?.country,
        country_name: franchiseHolder?.countryData?.country || '',
        franchise_holder_id: franchiseHolder?.id
      }
    });
  } catch (error) {
    console.error('Error updating head office user:', error);
    res.status(500).json({ message: 'Error updating head office user', error: error.message });
  }
};

// Reset password
export const resetHeadOfficePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password (will be hashed by User model hook)
    await user.update({ password });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};

// Toggle status
export const toggleHeadOfficeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle status (1 = active, 0 = inactive)
    const newStatus = user.active === 1 ? 0 : 1;
    await user.update({ active: newStatus });

    res.json({
      message: 'Status updated successfully',
      status: newStatus
    });
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(500).json({ message: 'Error toggling status', error: error.message });
  }
};

// ============================================
// REGIONAL OFFICE LOGIN MANAGEMENT
// ============================================

// Get all regional office users with country and state filter
export const getRegionalOfficeUsers = async (req, res) => {
  try {
    const { country, state } = req.query;

    // Find regional group
    const regionalGroup = await Group.findOne({ where: { name: 'regional' } });
    if (!regionalGroup) {
      return res.status(404).json({ message: 'Regional office group not found' });
    }

    // Build where clause for franchise holder
    const franchiseWhere = {};
    if (country) {
      franchiseWhere.country = country;
    }
    if (state) {
      franchiseWhere.state = state;
    }

    // Get all users in regional group with franchise holder data
    const userGroups = await UserGroup.findAll({
      where: { group_id: regionalGroup.id },
      include: [
        {
          model: User,
          as: 'user',
          include: [
            {
              model: FranchiseHolder,
              as: 'franchiseHolder',
              where: franchiseWhere,
              required: (country || state) ? true : false,
              include: [
                {
                  model: Country,
                  as: 'countryData',
                  attributes: ['id', 'country']
                },
                {
                  model: State,
                  as: 'stateData',
                  attributes: ['id', 'state']
                }
              ]
            }
          ]
        }
      ]
    });

    const users = userGroups.map(ug => {
      const user = ug.user;
      const franchiseHolder = user.franchiseHolder;

      return {
        id: user.id,
        first_name: user.first_name,
        phone: user.phone,
        email: user.email,
        username: user.username,
        status: user.active,
        country_id: franchiseHolder?.country,
        country_name: franchiseHolder?.countryData?.country || '',
        state_id: franchiseHolder?.state,
        state_name: franchiseHolder?.stateData?.state || '',
        franchise_holder_id: franchiseHolder?.id
      };
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching regional office users:', error);
    res.status(500).json({ message: 'Error fetching regional office users', error: error.message });
  }
};

// Create regional office user
export const createRegionalOfficeUser = async (req, res) => {
  try {
    const { first_name, phone, email, username, country, state } = req.body;
    const usernameLower = (username || '').toString().trim().toLowerCase();

    // Validate required fields
    if (!first_name || !phone || !email || !usernameLower || !country || !state) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username: usernameLower }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Find regional group
    const regionalGroup = await Group.findOne({ where: { name: 'regional' } });
    if (!regionalGroup) {
      return res.status(404).json({ message: 'Regional office group not found' });
    }

    // Create user with default password '123456' (username stored lowercase)
    const user = await User.create({
      first_name,
      phone,
      email,
      username: usernameLower,
      password: '123456', // Will be hashed by User model hook
      active: 1 // Active by default
    });

    // Create user-group association
    await UserGroup.create({
      user_id: user.id,
      group_id: regionalGroup.id
    });

    // Create franchise holder record
    const franchiseHolder = await FranchiseHolder.create({
      user_id: user.id,
      country: country,
      state: state
    });

    // Fetch country and state data
    const countryData = await Country.findByPk(country);
    const stateData = await State.findByPk(state);

    res.status(201).json({
      message: 'Regional office user created successfully',
      user: {
        id: user.id,
        first_name: user.first_name,
        phone: user.phone,
        email: user.email,
        username: user.username,
        status: user.active,
        country_id: country,
        country_name: countryData?.country || '',
        state_id: state,
        state_name: stateData?.state || '',
        franchise_holder_id: franchiseHolder.id
      }
    });
  } catch (error) {
    console.error('Error creating regional office user:', error);
    res.status(500).json({ message: 'Error creating regional office user', error: error.message });
  }
};

// Update regional office user
export const updateRegionalOfficeUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, phone, email, username, country, state } = req.body;
    const usernameLower = username !== undefined && username !== null
      ? (username).toString().trim().toLowerCase()
      : null;

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username or email already exists (excluding current user)
    if (usernameLower !== null || email) {
      const existingUser = await User.findOne({
        where: {
          id: { [Op.ne]: id },
          [Op.or]: [
            usernameLower !== null ? { username: usernameLower } : null,
            email ? { email } : null
          ].filter(Boolean)
        }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Username or email already exists' });
      }
    }

    // Update user (enforce lowercase username)
    await user.update({
      first_name: first_name || user.first_name,
      phone: phone || user.phone,
      email: email || user.email,
      username: usernameLower !== null ? usernameLower : (user.username || '').toString().toLowerCase()
    });

    // Update franchise holder if country or state is provided
    if (country || state) {
      const franchiseHolder = await FranchiseHolder.findOne({ where: { user_id: id } });
      if (franchiseHolder) {
        await franchiseHolder.update({
          country: country || franchiseHolder.country,
          state: state || franchiseHolder.state
        });
      }
    }

    // Fetch updated data with country and state
    const franchiseHolder = await FranchiseHolder.findOne({
      where: { user_id: id },
      include: [
        {
          model: Country,
          as: 'countryData',
          attributes: ['id', 'country']
        },
        {
          model: State,
          as: 'stateData',
          attributes: ['id', 'state']
        }
      ]
    });

    res.json({
      message: 'Regional office user updated successfully',
      user: {
        id: user.id,
        first_name: user.first_name,
        phone: user.phone,
        email: user.email,
        username: user.username,
        status: user.active,
        country_id: franchiseHolder?.country,
        country_name: franchiseHolder?.countryData?.country || '',
        state_id: franchiseHolder?.state,
        state_name: franchiseHolder?.stateData?.state || '',
        franchise_holder_id: franchiseHolder?.id
      }
    });
  } catch (error) {
    console.error('Error updating regional office user:', error);
    res.status(500).json({ message: 'Error updating regional office user', error: error.message });
  }
};

// Reset password for regional office user
export const resetRegionalOfficePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password (will be hashed by User model hook)
    await user.update({ password });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};

// Toggle status for regional office user
export const toggleRegionalOfficeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle status (1 = active, 0 = inactive)
    const newStatus = user.active === 1 ? 0 : 1;
    await user.update({ active: newStatus });

    res.json({
      message: 'Status updated successfully',
      status: newStatus
    });
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(500).json({ message: 'Error toggling status', error: error.message });
  }
};

// ==================== BRANCH OFFICE LOGIN MANAGEMENT ====================

// Get all branch office users with country, state, and district filter
export const getBranchOfficeUsers = async (req, res) => {
  try {
    const { country, state, district } = req.query;

    // Find branch group
    const branchGroup = await Group.findOne({ where: { name: 'branch' } });
    if (!branchGroup) {
      return res.status(404).json({ message: 'Branch office group not found' });
    }

    // Build where clause for franchise holder
    const franchiseWhere = {};
    if (country) {
      franchiseWhere.country = country;
    }
    if (state) {
      franchiseWhere.state = state;
    }
    if (district) {
      franchiseWhere.district = district;
    }
    
    // Get all users in branch group with franchise holder data
    const userGroups = await UserGroup.findAll({
      where: { group_id: branchGroup.id },
      include: [
        {
          model: User,
          as: 'user',
          include: [
            {
              model: FranchiseHolder,
              as: 'franchiseHolder',
              where: franchiseWhere,
              required: (country || state || district) ? true : false,
              include: [
                {
                  model: Country,
                  as: 'countryData',
                  attributes: ['id', 'country']
                },
                {
                  model: State,
                  as: 'stateData',
                  attributes: ['id', 'state']
                },
                {
                  model: District,
                  as: 'districtData',
                  attributes: ['id', 'district']
                }
              ]
            }
          ]
        }
      ]
    });
    // Format response
    const users = userGroups.map(ug => {
      const user = ug.user;
      const franchiseHolder = user.franchiseHolder;
      return {
        id: user.id,
        first_name: user.first_name,
        phone: user.phone,
        email: user.email,
        username: user.username,
        status: user.active,
        district_id: franchiseHolder?.district || null,
        district_name: franchiseHolder?.districtData?.district || null,
        state_id: franchiseHolder?.state || null,
        state_name: franchiseHolder?.stateData?.state || null,
        country_id: franchiseHolder?.country || null,
        country_name: franchiseHolder?.countryData?.country || null
      };
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching branch office users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Create new branch office user
export const createBranchOfficeUser = async (req, res) => {
  try {
    const { first_name, phone, email, username, country, state, district } = req.body;
    const usernameLower = (username || '').toString().trim().toLowerCase();

    // Validate required fields
    if (!first_name || !phone || !email || !usernameLower || !country || !state || !district) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username: usernameLower } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Find branch group
    const branchGroup = await Group.findOne({ where: { name: 'branch' } });
    if (!branchGroup) {
      return res.status(404).json({ message: 'Branch office group not found' });
    }

    // Create user with default password (username stored lowercase)
    const user = await User.create({
      first_name,
      phone,
      email,
      username: usernameLower,
      password: '123456', // Default password
      active: 1
    });

    // Create user-group association
    await UserGroup.create({
      user_id: user.id,
      group_id: branchGroup.id
    });

    // Create franchise holder record
    await FranchiseHolder.create({
      user_id: user.id,
      country: country,
      state: state,
      district: district
    });

    res.status(201).json({ message: 'Branch office user created successfully', user });
  } catch (error) {
    console.error('Error creating branch office user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// Update branch office user
export const updateBranchOfficeUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, phone, email, username } = req.body;
    const usernameLower = (username || '').toString().trim().toLowerCase();

    // Validate required fields
    if (!first_name || !phone || !email || !usernameLower) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username is taken by another user
    const existingUser = await User.findOne({
      where: {
        username: usernameLower,
        id: { [Op.ne]: id }
      }
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Update user (enforce lowercase username)
    await user.update({
      first_name,
      phone,
      email,
      username: usernameLower
    });

    res.json({ message: 'Branch office user updated successfully', user });
  } catch (error) {
    console.error('Error updating branch office user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Reset branch office user password
export const resetBranchOfficePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ password });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};

// Toggle branch office user status
export const toggleBranchOfficeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newStatus = user.active === 1 ? 0 : 1;
    await user.update({ active: newStatus });

    res.json({ message: 'Status updated successfully', status: newStatus });
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(500).json({ message: 'Error toggling status', error: error.message });
  }
};

// ==================== FRANCHISE OFFICE ADDRESS ====================
// Office address is stored per group_id (from groups table: head_office, regional, branch).

export const getOfficeAddress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const userGroup = await UserGroup.findOne({
      where: { user_id: userId },
      include: [{ model: Group, as: 'group', attributes: ['id'] }]
    });
    const groupId = userGroup?.group?.id;
    if (!groupId) {
      return res.status(400).json({ message: 'User has no franchise group' });
    }
    const record = await FranchiseOfficeAddress.findOne({
      where: { group_id: groupId }
    });
    res.json({
      success: true,
      data: record ? {
        id: record.id,
        phone: record.phone,
        email: record.email,
        address_html: record.address_html
      } : { phone: '', email: '', address_html: '' }
    });
  } catch (error) {
    console.error('Error fetching franchise office address:', error);
    res.status(500).json({ message: 'Error fetching office address', error: error.message });
  }
};

export const updateOfficeAddress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const userGroup = await UserGroup.findOne({
      where: { user_id: userId },
      include: [{ model: Group, as: 'group', attributes: ['id'] }]
    });
    const groupId = userGroup?.group?.id;
    if (!groupId) {
      return res.status(400).json({ message: 'User has no franchise group' });
    }
    const { phone, email, address_html } = req.body;
    let record = await FranchiseOfficeAddress.findOne({
      where: { group_id: groupId }
    });
    if (!record) {
      record = await FranchiseOfficeAddress.create({
        group_id: groupId,
        phone: phone || '',
        email: email || '',
        address_html: address_html || ''
      });
    } else {
      await record.update({
        phone: phone !== undefined ? phone : record.phone,
        email: email !== undefined ? email : record.email,
        address_html: address_html !== undefined ? address_html : record.address_html
      });
    }
    res.json({
      success: true,
      message: 'Office address updated successfully',
      data: {
        id: record.id,
        phone: record.phone,
        email: record.email,
        address_html: record.address_html
      }
    });
  } catch (error) {
    console.error('Error updating franchise office address:', error);
    res.status(500).json({ message: 'Error updating office address', error: error.message });
  }
};

