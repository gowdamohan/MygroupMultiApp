import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email configuration from environment variables
// const SMTP_USER = process.env.SMTP_USER || 'noreply.mygroup@gmail.com';
// const SMTP_PASS = process.env.SMTP_PASS || 'rnkfmpxyiionhdmu'; // MUST be a Gmail App Password (16 characters, no spaces)
// const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'My Group';

const SMTP_USER = 'noreply.mygroup@gmail.com';
const SMTP_PASS = 'rnkfmpxyiionhdmu'; // MUST be a Gmail App Password (16 characters, no spaces)
const SMTP_FROM_NAME ='My Group';

// Create transporter with Gmail credentials
// IMPORTANT: For Gmail, you MUST use an App Password:
// 1. Go to Google Account > Security > 2-Step Verification (enable if not enabled)
// 2. Go to Google Account > Security > 2-Step Verification > App passwords
// 3. Generate a new app password for "Mail"
// 4. Use that 16-character password (without spaces) as SMTP_PASS in .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter connection on startup
transporter.verify((error, _success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    console.error('   Make sure you have set SMTP_USER and SMTP_PASS (Gmail App Password) in .env');
  } else {
    console.log('✅ Email transporter is ready to send emails');
  }
});

/**
 * Send OTP email
 */
export const sendOtpEmail = async (email, otp, appName = 'My Group') => {
  try {
    const mailOptions = {
      from: {
        name: SMTP_FROM_NAME,
        address: SMTP_USER
      },
      to: email,
      subject: `Your OTP for ${appName} Registration`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background: linear-gradient(135deg, #057284 0%, #0a9fb5 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .otp-box {
              background: #f0f8ff;
              border: 2px dashed #057284;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
              border-radius: 8px;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #057284;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Partner Registration</h1>
              <p>${appName}</p>
            </div>
            <div class="content">
              <h2>Email Verification</h2>
              <p>Hello,</p>
              <p>Thank you for registering as a partner with <strong>${appName}</strong>. To complete your registration, please use the following One-Time Password (OTP):</p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code</p>
                <div class="otp-code">${otp}</div>
              </div>

              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This OTP is valid for 10 minutes</li>
                  <li>Do not share this code with anyone</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>

              <p>If you have any questions or need assistance, please contact our support team.</p>
              
              <p>Best regards,<br><strong>My Group Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} My Group. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Your OTP for ${appName} Registration
        
        Hello,
        
        Thank you for registering as a partner with ${appName}.
        
        Your OTP Code: ${otp}
        
        This OTP is valid for 10 minutes.
        Do not share this code with anyone.
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        My Group Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send welcome email after successful registration
 */
export const sendWelcomeEmail = async (email, firstName, appName = 'My Group') => {
  try {
    const mailOptions = {
      from: {
        name: SMTP_FROM_NAME,
        address: SMTP_USER
      },
      to: email,
      subject: `Welcome to ${appName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background: linear-gradient(135deg, #057284 0%, #0a9fb5 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ${appName}!</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName},</h2>
              <p>Congratulations! Your partner account has been successfully created.</p>
              <p>You can now log in and start using all the features available to partners.</p>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br><strong>My Group Team</strong></p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email - it's not critical
    return { success: false, error: error.message };
  }
};

