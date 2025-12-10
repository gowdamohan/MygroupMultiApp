import {
  User,
  Group,
  UserGroup,
  GroupCreate,
  CreateDetails,
  ClientRegisterOtp
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Get app name for email template
    let appName = 'My Group';
    if (app_id) {
      const app = await GroupCreate.findByPk(app_id);
      if (app) {
        appName = app.name;
      }
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
        // Remove this in production - only for development
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
 * Register partner
 * POST /api/v1/auth/partner/register
 */
export const registerPartner = async (req, res) => {
  try {
    const { email, password, app_id, app_name, custom_form_data } = req.body;

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

    // Extract first_name from custom_form_data or use email prefix
    const first_name = custom_form_data?.first_name || custom_form_data?.name || username;

    // Create user
    const user = await User.create({
      username: username,
      email: email,
      password: password,
      first_name: first_name,
      last_name: custom_form_data?.last_name || '',
      phone: custom_form_data?.phone || '',
      group_id: app_id, // Store app_id in group_id field
      created_on: Math.floor(Date.now() / 1000),
      active: 1
    });

    // Create user-group association (partner role)
    await UserGroup.create({
      user_id: user.id,
      group_id: partnerGroup.id
    });

    // Delete OTP record after successful registration
    await ClientRegisterOtp.destroy({
      where: { email_id: email }
    });

    // Get app name for welcome email
    let appName = 'My Group';
    if (app_id) {
      const app = await GroupCreate.findByPk(app_id);
      if (app) {
        appName = app.name;
      }
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, first_name, appName).catch(err => {
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
          first_name: user.first_name
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

