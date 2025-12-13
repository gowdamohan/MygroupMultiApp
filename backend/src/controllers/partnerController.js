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

    // Check if email already exists in users table
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      // Check if user is registering for this specific app (group_id = app_id)
      if (existingUser.group_id === parseInt(app_id)) {
        // Check client_registration table for this user and app
        const clientReg = await ClientRegistration.findOne({
          where: {
            user_id: existingUser.id,
            group_id: app_id
          }
        });

        if (clientReg) {
          // Registration record exists
          if (clientReg.status === 'active') {
            // Registration completed - redirect to login
            return res.status(400).json({
              success: false,
              message: 'Email already registered. Please login.',
              code: 'ALREADY_REGISTERED',
              redirect: 'login'
            });
          } else {
            // Registration not completed - redirect to Step 4 (custom form)
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
        } else {
          // User exists but no client_registration record
          // Check if user.active = 0 (password step completed, needs custom form)
          if (existingUser.active === 0) {
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
          } else {
            // User is active - fully registered
            return res.status(400).json({
              success: false,
              message: 'Email already registered. Please login.',
              code: 'ALREADY_REGISTERED',
              redirect: 'login'
            });
          }
        }
      } else {
        // User exists but for a different app - allow registration for this app
        // But we can't create duplicate email, so reject
        return res.status(400).json({
          success: false,
          message: 'Email already registered with another application.',
          code: 'EMAIL_EXISTS_OTHER_APP'
        });
      }
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

    // Check if user already exists
    let user = await User.findOne({
      where: { email }
    });

    if (user) {
      // User exists - check if password step already completed
      if (user.active === 0) {
        // Password already set, return user_id for next step
        return res.json({
          success: true,
          message: 'Password already set. Continue to next step.',
          data: {
            user_id: user.id,
            email: user.email
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
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
 * Format: CountryCode + StateCode + - + GroupCreateCode + 5 digits
 * Example: INKA-MM00001
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

  // Get state code
  let stateCode = '';
  if (stateId) {
    const state = await State.findByPk(stateId);
    if (state && state.code) {
      stateCode = state.code.toUpperCase();
    }
  }

  // Get app code from group_create
  let appCode = '';
  const app = await GroupCreate.findByPk(appId);
  if (app && app.code) {
    appCode = app.code.toUpperCase();
  }

  // Get the next sequential number for this app
  // Count existing partners for this app and add 1
  const partnerCount = await User.count({
    where: { group_id: appId }
  });
  const sequentialNumber = String(partnerCount + 1).padStart(5, '0');

  // Build identification code: CountryCode + StateCode + - + AppCode + 5digits
  const identificationCode = `${countryCode}${stateCode}-${appCode}${sequentialNumber}`;

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

    // Update client_registration to active
    await ClientRegistration.update(
      {
        status: 'active',
        custom_form_data: custom_form_data || {}
      },
      {
        where: {
          user_id: user_id,
          group_id: app_id
        }
      }
    );

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

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome email sent.',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          identification_code: identificationCode
        },
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

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
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

    // Create username from email
    const username = email.split('@')[0];

    // Create user with basic info
    const user = await User.create({
      username: username,
      email: email,
      password: password,
      first_name: username,
      group_id: app_id, // Store app_id in group_id field
      created_on: Math.floor(Date.now() / 1000),
      active: 1
    });

    // Create user-group association (partner role)
    await UserGroup.create({
      user_id: user.id,
      group_id: partnerGroup.id
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user_id: user.id,
        email: user.email
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
    await sendOtpEmail(email, otp, appName);
    console.log(`Forgot Password OTP sent to ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent to your email'
    });
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
        message: 'Please verify OTP first'
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

