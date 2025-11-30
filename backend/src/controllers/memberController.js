import {
  User,
  UserRegistration,
  UserGroup,
  Group,
  Country,
  Education,
  Profession
} from '../models/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

/**
 * MEMBER CONTROLLER
 * Handles member registration and profile management
 */

// Register new member (Step 1 + Step 2)
export const registerMember = async (req, res) => {
  try {
    const {
      // Step 1 fields
      first_name,
      mobile,
      password,
      // Step 2 fields
      display_name,
      last_name,
      alter_number,
      nationality,
      marital_status,
      gender,
      dob_date,
      dob_month,
      dob_year,
      country,
      state,
      district,
      education,
      profession,
      education_others,
      work_others,
      country_code,
      country_flag,
      country_code_alter
    } = req.body;

    // Check if mobile number already exists
    const existingUser = await User.findOne({
      where: { username: mobile }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number already registered'
      });
    }

    // Find 'member' group
    const memberGroup = await Group.findOne({
      where: { name: 'member' }
    });

    if (!memberGroup) {
      return res.status(500).json({
        success: false,
        message: 'Member group not found. Please contact administrator.'
      });
    }

    // Create user
    const user = await User.create({
      username: mobile,
      email: `${mobile}@member.com`, // Generate email from mobile
      password: password,
      first_name: first_name,
      last_name: last_name || null,
      phone: mobile,
      display_name: display_name || first_name,
      alter_number: alter_number || null,
      created_on: Math.floor(Date.now() / 1000),
      active: 1
    });

    // Create user-group association
    await UserGroup.create({
      user_id: user.id,
      group_id: memberGroup.id
    });

    // Create DOB if all parts provided
    let dob = null;
    if (dob_year && dob_month && dob_date) {
      dob = `${dob_year}-${dob_month.padStart(2, '0')}-${String(dob_date).padStart(2, '0')}`;
    }

    // Create user registration profile
    await UserRegistration.create({
      user_id: user.id,
      gender: gender || null,
      nationality: nationality || null,
      marital_status: marital_status || null,
      dob: dob,
      dob_date: dob_date || null,
      dob_month: dob_month || null,
      dob_year: dob_year || null,
      country: country || null,
      state: state || null,
      district: district || null,
      education: education || null,
      profession: profession || null,
      education_others: education_others || null,
      work_others: work_others || null,
      country_code: country_code || null,
      country_code_alter: country_flag || null
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please login to continue.',
      data: {
        user_id: user.id,
        username: user.username,
        first_name: user.first_name
      }
    });

  } catch (error) {
    console.error('Error registering member:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message
    });
  }
};

// Get registration form fields (for dynamic form generation)
export const getRegistrationFormFields = async (req, res) => {
  try {
    // Get all countries, education, profession
    const [countries, education, profession] = await Promise.all([
      Country.findAll({ where: { status: 1 }, order: [['country', 'ASC']] }),
      Education.findAll({ order: [['education', 'ASC']] }),
      Profession.findAll({ order: [['profession', 'ASC']] })
    ]);

    // Get unique nationalities from countries
    const nationalities = [...new Set(countries
      .map(c => c.nationality)
      .filter(n => n && n.trim() !== '')
    )].sort();

    res.json({
      success: true,
      data: {
        countries,
        education,
        profession,
        nationalities
      }
    });

  } catch (error) {
    console.error('Error fetching registration form fields:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch form fields',
      error: error.message
    });
  }
};

// Register member - Step 1 (Create user account)
export const registerMemberStep1 = async (req, res) => {
  try {
    const { first_name, mobile, password } = req.body;

    // Validate required fields
    if (!first_name || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'First name, mobile number, and password are required'
      });
    }

    // Check if mobile number already exists
    const existingUser = await User.findOne({
      where: { username: mobile }
    });

    if (existingUser) {
      // Check if user has completed profile
      const profile = await UserRegistration.findOne({
        where: { user_id: existingUser.id }
      });

      if (!profile) {
        // User exists but profile incomplete - allow to continue to Step 2
        return res.status(200).json({
          success: true,
          message: 'User exists. Please complete your profile.',
          data: {
            user_id: existingUser.id,
            first_name: existingUser.first_name,
            mobile: existingUser.username,
            profileIncomplete: true
          }
        });
      }

      // User exists and profile complete - redirect to login
      return res.status(400).json({
        success: false,
        message: 'Mobile number already registered. Please login.',
        redirectToLogin: true
      });
    }

    // Find 'member' group
    const memberGroup = await Group.findOne({
      where: { name: 'member' }
    });

    if (!memberGroup) {
      return res.status(500).json({
        success: false,
        message: 'Member group not found. Please contact administrator.'
      });
    }

    // Create user
    const user = await User.create({
      username: mobile,
      email: `${mobile}@member.com`,
      password: password,
      first_name: first_name,
      phone: mobile,
      created_on: Math.floor(Date.now() / 1000),
      active: 1
    });

    // Create user-group association
    await UserGroup.create({
      user_id: user.id,
      group_id: memberGroup.id
    });

    res.status(201).json({
      success: true,
      message: 'Step 1 completed. Please continue with your profile.',
      data: {
        user_id: user.id,
        first_name: user.first_name,
        mobile: user.username
      }
    });

  } catch (error) {
    console.error('Error in registration step 1:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message
    });
  }
};

// Update member profile - Step 2
export const updateMemberProfile = async (req, res) => {
  try {
    const {
      user_id,
      display_name,
      last_name,
      alter_number,
      alter_country_code,
      nationality,
      marital_status,
      gender,
      dob_date,
      dob_month,
      dob_year,
      country,
      state,
      district,
      education,
      profession,
      education_others,
      work_others
    } = req.body;

    // Validate user_id
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Update user table with display_name, last_name, alter_number
    await User.update(
      {
        display_name: display_name || null,
        last_name: last_name || null,
        alter_number: alter_number || null
      },
      {
        where: { id: user_id }
      }
    );

    // Create DOB if all parts provided
    let dob = null;
    if (dob_year && dob_month && dob_date) {
      dob = `${dob_year}-${dob_month.padStart(2, '0')}-${String(dob_date).padStart(2, '0')}`;
    }

    // Create or update user_registration_form
    const existingProfile = await UserRegistration.findOne({
      where: { user_id: user_id }
    });

    const profileData = {
      user_id: user_id,
      gender: gender || null,
      nationality: nationality || null,
      marital_status: marital_status || null,
      dob: dob,
      dob_date: dob_date || null,
      dob_month: dob_month || null,
      dob_year: dob_year || null,
      country: country || null,
      state: state || null,
      district: district || null,
      education: education === 'others' ? null : (education || null),
      profession: profession === 'others' ? null : (profession || null),
      education_others: education_others || null,
      work_others: work_others || null,
      country_code_alter: alter_country_code || null
    };
    if (existingProfile) {
      await UserRegistration.update(profileData, {
        where: { user_id: user_id }
      });
    } else {
      await UserRegistration.create(profileData);
    }

    res.status(200).json({
      success: true,
      message: 'Registration completed successfully! Please login to continue.'
    });

  } catch (error) {
    console.error('Error updating member profile:', error);
    res.status(500).json({
      success: false,
      message: 'Profile update failed. Please try again.',
      error: error.message
    });
  }
};

// Check if user profile is complete
export const checkUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await UserRegistration.findOne({
      where: { user_id: userId }
    });

    res.json({
      success: true,
      data: {
        profileComplete: !!profile
      }
    });

  } catch (error) {
    console.error('Error checking user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check profile',
      error: error.message
    });
  }
};

// Member login
export const memberLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user by username
    const user = await User.findOne({
      where: { username: username }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check if user is active
    if (user.active !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check if user is a member
    const userGroup = await UserGroup.findOne({
      where: { user_id: user.id },
      include: [{
        model: Group,
        as: 'group',
        where: { name: 'member' }
      }]
    });

    if (!userGroup) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Member account required.'
      });
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        groupId: userGroup.group_id
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        username: user.username
      },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' }
    );

    // Return user data and tokens
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          display_name: user.display_name,
          phone: user.phone,
          active: user.active
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Error in member login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: error.message
    });
  }
};

