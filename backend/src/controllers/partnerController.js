import {
  User,
  Group,
  UserGroup,
  GroupCreate,
  CreateDetails,
  ClientRegisterOtp,
  ClientRegistration,
  Country,
  State
} from '../models/index.js';
import { generateTokens } from '../utils/jwt.js';
import { sendOtpEmail, sendWelcomeEmail } from '../services/emailService.js';
import { Op } from 'sequelize';

/**
 * Generate 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to email
 * POST /api/v1/auth/partner/send-otp
 */
export const sendPartnerOtp = async (req, res) => {
  try {
    const { email, app_id } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!app_id) {
      return res.status(400).json({
        success: false,
        message: 'App ID is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if a user with this email already exists for THIS specific app
    const existingUser = await User.findOne({
      where: { email, group_id: app_id }
    });

    if (existingUser) {
      // User record exists for this app - check registration status
      const clientReg = await ClientRegistration.findOne({
        where: {
          user_id: existingUser.id,
          group_id: app_id
        }
      });

      if (clientReg && clientReg.status === 'active') {
        // Fully registered for this app - redirect to login
        return res.status(400).json({
          success: false,
          message: 'Email already registered for this app. Please login.',
          code: 'ALREADY_REGISTERED',
          redirect: 'login'
        });
      }

      if (existingUser.active === 0) {
        // User created (password set) but custom form not completed
        return res.json({
          success: true,
          message: 'Continue your registration',
          code: 'REGISTRATION_INCOMPLETE',
          redirect: 'customForm',
          data: {
            user_id: existingUser.id,
            email: existingUser.email,
            step: 'customForm'
          }
        });
      }

      // User is active but no active client_reg - treat as fully registered
      if (existingUser.active === 1) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered for this app. Please login.',
          code: 'ALREADY_REGISTERED',
          redirect: 'login'
        });
      }
    }

    // No user record for this app (may exist for other apps - that's fine)
    // Proceed with OTP generation

    // Get app name for email template
    let appName = 'My Group';
    const app = await GroupCreate.findByPk(app_id);
    if (app) {
      appName = app.name;
    }

    // Generate OTP
    const otp = generateOTP();

    // Delete any existing OTP for this email
    await ClientRegisterOtp.destroy({
      where: { email_id: email }
    });

    // Store OTP in database
    await ClientRegisterOtp.create({
      email_id: email,
      otp: otp
    });

    // Send OTP via email
    try {
      await sendOtpEmail(email, otp, appName);
      console.log(`OTP sent to ${email}: ${otp}`);

      res.json({
        success: true,
        message: 'OTP sent to your email successfully. Please check your inbox.',
        code: 'OTP_SENT',
        // Remove this in production - only for development
        ...(process.env.NODE_ENV === 'development' && { otp })
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);

      // Even if email fails, we still have OTP in database for testing
      res.json({
        success: true,
        message: 'OTP generated. Check console for OTP (email service may be unavailable).',
        code: 'OTP_SENT',
        ...(process.env.NODE_ENV === 'development' && { otp })
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending OTP',
      error: error.message
    });
  }
};

/**
 * Verify OTP
 * POST /api/v1/auth/partner/verify-otp
 */
export const verifyPartnerOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find OTP record
    const otpRecord = await ClientRegisterOtp.findOne({
      where: {
        email_id: email,
        otp: otp
      }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

/**
 * Step 3: Create user with password (active = 0)
 * POST /api/v1/auth/partner/set-password
 */
export const setPartnerPassword = async (req, res) => {
  try {
    const { email, password, app_id } = req.body;

    if (!email || !password || !app_id) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and app_id are required'
      });
    }

    // Verify OTP was validated (check if OTP exists for this email)
    const otpRecord = await ClientRegisterOtp.findOne({
      where: { email_id: email }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    // Check if user already exists for THIS specific app
    let user = await User.findOne({
      where: { email, group_id: app_id }
    });

    if (user) {
      // User already exists for this app
      const clientReg = await ClientRegistration.findOne({
        where: {
          user_id: user.id,
          group_id: app_id
        }
      });

      if (clientReg && clientReg.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Email already registered for this app'
        });
      }

      // User exists but registration incomplete - allow to continue
      return res.json({
        success: true,
        message: 'Continue to next step.',
        data: {
          user_id: user.id,
          email: user.email
        }
      });
    }

    // No user record for this app - create a new one (even if email exists for other apps)

    // Get partner group
    const partnerGroup = await Group.findOne({
      where: { name: 'partner' }
    });

    if (!partnerGroup) {
      return res.status(500).json({
        success: false,
        message: 'Partner group not found. Please contact administrator.'
      });
    }

    // Store email as username (allowing all email characters)
    // Create user with active = 0 (password step completed, custom form pending)
    user = await User.create({
      username: email, // Store full email as username
      email: email,
      password: password,
      first_name: email.split('@')[0], // Use email prefix as first_name
      group_id: app_id, // Store app_id in group_id field
      created_on: Math.floor(Date.now() / 1000),
      active: 0 // Not active until custom form is completed
    });

    // Create user-group association (partner role)
    await UserGroup.create({
      user_id: user.id,
      group_id: partnerGroup.id
    });

    // Create client_registration record with status = 'pending'
    await ClientRegistration.create({
      user_id: user.id,
      group_id: app_id,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Password set successfully. Please complete your profile.',
      data: {
        user_id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Set partner password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting password',
      error: error.message
    });
  }
};

/**
 * Generate partner identification code
 * Format: {country_code}{app_code}-{6-digit-number}
 * Example: INDMM-000001
 * The running number is unique per combination of country_code and app_code
 */
const generatePartnerIdentificationCode = async (countryId, stateId, appId) => {
  // Get country code
  let countryCode = '';
  if (countryId) {
    const country = await Country.findByPk(countryId);
    if (country && country.code) {
      countryCode = country.code.toUpperCase();
    }
  }

  // Get app code from group_create
  let appCode = '';
  const app = await GroupCreate.findByPk(appId);
  if (app && app.code) {
    appCode = app.code.toUpperCase();
  }

  // Get the next sequential number for this country_code + app_code combination
  // Find the last user with this pattern
  const lastUser = await User.findOne({
    where: {
      identification_code: {
        [Op.like]: `${countryCode}${appCode}-%`
      }
    },
    order: [['id', 'DESC']]
  });

  let sequenceNumber = 1;
  if (lastUser && lastUser.identification_code) {
    // Extract the last 6 digits (000001)
    const lastSequence = lastUser.identification_code.slice(-6);
    sequenceNumber = parseInt(lastSequence, 10) + 1;
  }

  // Build identification code: {country_code}{app_code}-{6-digit-number}
  // Format: INDMM-000001
  const identificationCode = `${countryCode}${appCode}-${String(sequenceNumber).padStart(6, '0')}`;

  return identificationCode;
};

/**
 * Step 4: Complete registration with custom form
 * POST /api/v1/auth/partner/register
 */
export const registerPartner = async (req, res) => {
  try {
    const { user_id, app_id, custom_form_data } = req.body;

    if (!user_id || !app_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID and App ID are required'
      });
    }

    // Find user
    const user = await User.findByPk(user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Extract country_id and state_id from custom_form_data
    let countryId = null;
    let stateId = null;

    if (custom_form_data) {
      // Check for country and state in custom form data
      for (const [key, value] of Object.entries(custom_form_data)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('country') && value) {
          countryId = parseInt(value) || null;
        }
        if (lowerKey.includes('state') && value) {
          stateId = parseInt(value) || null;
        }
      }
    }

    // Generate identification code
    const identificationCode = await generatePartnerIdentificationCode(countryId, stateId, app_id);

    // Update user with custom form data and identification code
    const updateData = {
      active: 1,
      identification_code: identificationCode
    };

    if (custom_form_data) {
      // Look for name/first_name in custom form data
      for (const [key, value] of Object.entries(custom_form_data)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('name') && !lowerKey.includes('last')) {
          updateData.first_name = value;
        }
        if (lowerKey.includes('last') && lowerKey.includes('name')) {
          updateData.last_name = value;
        }
        if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
          updateData.phone = value;
        }
      }
    }

    await user.update(updateData);

    // Find or create client_registration for this user and app (supports multi-app registration)
    const [clientReg, created] = await ClientRegistration.findOrCreate({
      where: {
        user_id: user_id,
        group_id: app_id
      },
      defaults: {
        status: 'pending',
        custom_form_data: custom_form_data || {}
      }
    });

    if (!created) {
      // Update existing record - keep status as 'pending' for admin approval
      await clientReg.update({
        status: 'pending',
        custom_form_data: custom_form_data || {}
      });
    }

    // Delete OTP record after successful registration
    await ClientRegisterOtp.destroy({
      where: { email_id: user.email }
    });

    // Get app name for welcome email
    let appName = 'My Group';
    const app = await GroupCreate.findByPk(app_id);
    if (app) {
      appName = app.name;
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.first_name, appName).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Include groups so frontend ProtectedRoute can allow partner dashboard access
    const partnerGroup = await Group.findOne({ where: { name: 'partner' } });
    const userWithGroups = {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      identification_code: identificationCode,
      groups: partnerGroup ? [{ id: partnerGroup.id, name: partnerGroup.name }] : [{ name: 'partner' }]
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome email sent.',
      data: {
        user: userWithGroups,
        ...tokens,
        dashboardRoute: '/dashboard/partner'
      }
    });
  } catch (error) {
    console.error('Register partner error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering partner',
      error: error.message
    });
  }
};

/**
 * Create partner account (Step 1 of two-step registration)
 * POST /api/v1/auth/partner/create-account
 */
export const createPartnerAccount = async (req, res) => {
  try {
    const { email, password, app_id } = req.body;

    if (!email || !password || !app_id) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and app_id are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if user already exists for THIS specific app
    const existingUser = await User.findOne({
      where: { email, group_id: app_id }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered for this app'
      });
    }

    // Get partner group
    const partnerGroup = await Group.findOne({
      where: { name: 'partner' }
    });

    if (!partnerGroup) {
      return res.status(500).json({
        success: false,
        message: 'Partner group not found. Please contact administrator.'
      });
    }

    // Create user with basic info - set as INACTIVE by default
    // Admin will need to activate the partner after reviewing their registration
    const user = await User.create({
      username: email, // Store full email as username
      email: email,
      password: password,
      first_name: email.split('@')[0],
      group_id: app_id, // Store app_id in group_id field
      created_on: Math.floor(Date.now() / 1000),
      active: 0 // Set inactive by default - requires admin approval
    });

    // Create user-group association (partner role)
    await UserGroup.create({
      user_id: user.id,
      group_id: partnerGroup.id
    });

    // Create client_registration entry with inactive status
    await ClientRegistration.create({
      user_id: user.id,
      group_id: app_id,
      status: 'inactive',
      custom_form_data: {}
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Your account is pending approval by the administrator.',
      data: {
        user_id: user.id,
        email: user.email,
        status: 'inactive'
      }
    });
  } catch (error) {
    console.error('Create partner account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: error.message
    });
  }
};

/**
 * Complete partner profile (Step 2 of two-step registration)
 * POST /api/v1/auth/partner/complete-profile
 */
export const completePartnerProfile = async (req, res) => {
  try {
    const { user_id, app_id, custom_form_data } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find user
    const user = await User.findByPk(user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user with custom form data
    // Extract common fields from custom_form_data
    const updateData = {};

    if (custom_form_data) {
      // Look for name/first_name in custom form data
      for (const [key, value] of Object.entries(custom_form_data)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('name') && !lowerKey.includes('last')) {
          updateData.first_name = value;
        }
        if (lowerKey.includes('last') && lowerKey.includes('name')) {
          updateData.last_name = value;
        }
        if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
          updateData.phone = value;
        }
      }
    }

    // Update user
    await user.update(updateData);

    // Get app name for welcome email
    let appName = 'My Group';
    if (app_id) {
      const app = await GroupCreate.findByPk(app_id);
      if (app) {
        appName = app.name;
      }
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.first_name, appName).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    // Generate tokens
    const tokens = generateTokens(user);

    res.json({
      success: true,
      message: 'Registration completed successfully!',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name
        },
        ...tokens,
        dashboardRoute: '/dashboard/partner'
      }
    });
  } catch (error) {
    console.error('Complete partner profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing profile',
      error: error.message
    });
  }
};

/**
 * ============================================
 * PARTNER FORGOT PASSWORD
 * ============================================
 */

/**
 * Send OTP for partner forgot password
 * POST /api/v1/auth/partner/forgot-password/send-otp
 */
export const sendPartnerForgotPasswordOtp = async (req, res) => {
  try {
    const { email, app_id } = req.body;

    if (!email || !app_id) {
      return res.status(400).json({
        success: false,
        message: 'Email and app_id are required'
      });
    }

    // Check if user exists with this email and app_id
    const user = await User.findOne({
      where: { email, group_id: app_id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    // Get app name for email template
    let appName = 'My Group';
    const app = await GroupCreate.findByPk(app_id);
    if (app) {
      appName = app.name;
    }

    // Generate OTP
    const otp = generateOTP();

    // Delete any existing OTP for this email
    await ClientRegisterOtp.destroy({
      where: { email_id: email }
    });

    // Store OTP in database
    await ClientRegisterOtp.create({
      email_id: email,
      otp: otp
    });

    // Send OTP via email
    try {
      await sendOtpEmail(email, otp, appName, 'password_reset');
      console.log(`Forgot Password OTP sent to ${email}: ${otp}`);

      res.json({
        success: true,
        message: 'OTP sent to your email',
        ...(process.env.NODE_ENV === 'development' && { otp })
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);

      // Even if email fails, we still have OTP in database for testing
      res.json({
        success: true,
        message: 'OTP generated. Check console for OTP (email service may be unavailable).',
        ...(process.env.NODE_ENV === 'development' && { otp })
      });
    }
  } catch (error) {
    console.error('Send forgot password OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending OTP',
      error: error.message
    });
  }
};

/**
 * Verify OTP for partner forgot password
 * POST /api/v1/auth/partner/forgot-password/verify-otp
 */
export const verifyPartnerForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find OTP record
    const otpRecord = await ClientRegisterOtp.findOne({
      where: { email_id: email, otp: otp }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // OTP is valid - keep it for password reset step
    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify forgot password OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

/**
 * Reset partner password
 * POST /api/v1/auth/partner/forgot-password/reset
 */
export const resetPartnerPassword = async (req, res) => {
  try {
    const { email, otp, password, app_id } = req.body;

    if (!email || !otp || !password || !app_id) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, password, and app_id are required'
      });
    }

    // Verify OTP (must match the latest OTP stored for this email)
    const otpRecord = await ClientRegisterOtp.findOne({
      where: { email_id: email, otp: otp }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Find user
    const user = await User.findOne({
      where: { email, group_id: app_id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    await user.update({ password });

    // Delete OTP record
    await ClientRegisterOtp.destroy({
      where: { email_id: email }
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset partner password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

