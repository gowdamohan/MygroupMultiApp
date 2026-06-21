import {
  User,
  UserRegistration,
  UserGroup,
  Group,
  Country,
  State,
  District,
  Education,
  Profession
} from '../models/index.js';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { uploadFile as wasabiUploadFile } from '../services/wasabiService.js';
import { compressProfileImageToBuffer } from '../utils/imageCompress.js';
import { deleteStoredProfileImage } from '../utils/profileImageStorage.js';

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
      country_code
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
      email: `${mobile}@member.com`,
      password: password,
      first_name: first_name,
      phone: mobile,
      display_name: display_name || first_name,
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
        message: 'Full name, mobile number, and password are required'
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

// Update member profile - Step 2 (supports both POST JSON and PUT FormData with optional profile_img)
export const updateMemberProfile = async (req, res) => {
  try {
    console.log('=== Update Member Profile Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const {
      user_id: userIdRaw,
      display_name,
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
      work_others
    } = req.body;

    const user_id = userIdRaw != null ? (typeof userIdRaw === 'number' ? userIdRaw : parseInt(userIdRaw, 10)) : null;

    // Validate user_id
    if (!user_id || Number.isNaN(user_id)) {
      console.log('ERROR: User ID is missing or invalid');
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    console.log('User ID:', user_id);
    console.log('Country:', country, 'State:', state, 'District:', district);

    // Generate identification code (only when all three location fields are present)
    let identification_code = null;
    if (country && state && district) {
      console.log('Generating identification code...');

      const [countryData, stateData, districtData] = await Promise.all([
        Country.findByPk(country, { attributes: ['code'] }),
        State.findByPk(state, { attributes: ['code'] }),
        District.findByPk(district, { attributes: ['code'] })
      ]);

      if (countryData && stateData && districtData) {
        const countryCode = (countryData.code || '').toUpperCase();
        const stateCode = (stateData.code || '').toUpperCase();
        const districtCode = (districtData.code || '').toUpperCase();

        const lastUser = await User.findOne({
          where: {
            identification_code: {
              [Op.like]: `${countryCode}${stateCode}-${districtCode}%`
            }
          },
          order: [['id', 'DESC']]
        });

        let sequenceNumber = 1;
        if (lastUser && lastUser.identification_code) {
          const lastSequence = lastUser.identification_code.slice(-7);
          sequenceNumber = parseInt(lastSequence, 10) + 1;
        }

        identification_code = `${countryCode}${stateCode}-${districtCode}${String(sequenceNumber).padStart(7, '0')}`;
        console.log('Generated identification code:', identification_code);
      }
    }

    // ── Users table update ──────────────────────────────────────────────────
    // Only include a field if it was actually sent in the request (not undefined).
    // This prevents partial saves (e.g. alter_number only) from wiping other columns.
    const userUpdatePayload = {};
    if (display_name !== undefined) userUpdatePayload.display_name = display_name || null;
    if (alter_number !== undefined) userUpdatePayload.alter_number = alter_number || null;
    if (identification_code) userUpdatePayload.identification_code = identification_code;

    let profileImgPublicUrl;
    if (req.file && req.file.buffer) {
      const existingUser = await User.findByPk(user_id, { attributes: ['id', 'profile_img'] });
      const compressedBuffer = await compressProfileImageToBuffer(req.file.buffer);
      const folder = `profile_photos/user_${user_id}`;
      const uploadResult = await wasabiUploadFile(
        compressedBuffer,
        `profile-${user_id}-${Date.now()}.jpg`,
        'image/jpeg',
        folder
      );

      if (!uploadResult.success || !uploadResult.fileName) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload profile image to storage'
        });
      }

      await deleteStoredProfileImage(existingUser?.profile_img);
      userUpdatePayload.profile_img = uploadResult.fileName;
      profileImgPublicUrl = uploadResult.publicUrl;
    }

    if (Object.keys(userUpdatePayload).length > 0) {
      console.log('Updating user table with:', userUpdatePayload);
      await User.update(userUpdatePayload, { where: { id: user_id } });
    }

    // ── user_registration_form update ───────────────────────────────────────
    // Build only the fields that were actually sent; never overwrite existing
    // data with null just because a field wasn't included in this request.
    const profileUpdateFields = {};
    if (gender !== undefined)           profileUpdateFields.gender          = gender || null;
    if (nationality !== undefined)      profileUpdateFields.nationality     = nationality || null;
    if (marital_status !== undefined)   profileUpdateFields.marital_status  = marital_status || null;
    if (country !== undefined)          profileUpdateFields.country         = country || null;
    if (state !== undefined)            profileUpdateFields.state           = state || null;
    if (district !== undefined)         profileUpdateFields.district        = district || null;
    if (education !== undefined)        profileUpdateFields.education       = education === 'others' ? null : (education || null);
    if (profession !== undefined)       profileUpdateFields.profession      = profession === 'others' ? null : (profession || null);
    if (education_others !== undefined) profileUpdateFields.education_others = education_others || null;
    if (work_others !== undefined)      profileUpdateFields.work_others     = work_others || null;

    // DOB: only update the parts that were actually sent
    if (dob_date !== undefined)  profileUpdateFields.dob_date  = dob_date  || null;
    if (dob_month !== undefined) profileUpdateFields.dob_month = dob_month || null;
    if (dob_year !== undefined)  profileUpdateFields.dob_year  = dob_year  || null;

    // Rebuild the combined dob string when all three parts are present in this request
    if (dob_year && dob_month != null && dob_date) {
      const monthStr = typeof dob_month === 'string' ? dob_month : String(dob_month);
      profileUpdateFields.dob = `${dob_year}-${monthStr.padStart(2, '0')}-${String(dob_date).padStart(2, '0')}`;
    }

    if (Object.keys(profileUpdateFields).length > 0) {
      console.log('Checking for existing registration profile...');
      const existingProfile = await UserRegistration.findOne({ where: { user_id } });
      console.log('Existing profile:', existingProfile ? 'Found' : 'Not found');

      if (existingProfile) {
        console.log('Updating existing profile with:', profileUpdateFields);
        await UserRegistration.update(profileUpdateFields, { where: { user_id } });
      } else {
        console.log('Creating new profile...');
        await UserRegistration.create({ user_id, ...profileUpdateFields });
      }
      console.log('Profile saved successfully');
    } else {
      console.log('No registration fields to update - skipping user_registration_form');
    }

    console.log('=== Update Member Profile Complete ===');
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      data: {
        identification_code: identification_code || undefined,
        profile_img: userUpdatePayload.profile_img || undefined,
        profile_img_url: profileImgPublicUrl || undefined,
        display_name: display_name !== undefined ? display_name : undefined,
        alter_number: alter_number !== undefined ? alter_number : undefined,
      }
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

// Get user statistics (public - no auth required)
export const getUserStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthUnix = Math.floor(startOfMonth.getTime() / 1000);

    const memberGroup = await Group.findOne({
      where: { name: 'member' }
    });
    if (!memberGroup) {
      return res.json({
        success: true,
        data: {
          totalRegisteredUsers: 0,
          activeUsers: 0,
          newUsersThisMonth: 0
        }
      });
    }

    const [totalRegisteredUsers, activeUsers, newUsersThisMonth] = await Promise.all([
      UserGroup.count({ where: { group_id: memberGroup.id } }),
      User.count({
        include: [{
          model: Group,
          as: 'groups',
          required: true,
          where: { name: 'member' }
        }],
        where: { active: 1 }
      }),
      User.count({
        include: [{
          model: Group,
          as: 'groups',
          required: true,
          where: { name: 'member' }
        }],
        where: { created_on: { [Op.gte]: startOfMonthUnix } }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalRegisteredUsers,
        activeUsers,
        newUsersThisMonth
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
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

