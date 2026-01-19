import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Activity-based expiration constants
const INACTIVE_EXPIRY_DAYS = 15; // 15 days for inactive users
const ACTIVE_TOKEN_EXPIRY = '30m'; // 30 minutes for active users (will be refreshed)
const INACTIVE_TOKEN_EXPIRY_DAYS = 15; // 15 days for inactive users

/**
 * Calculate token expiration based on user activity
 * @param {boolean} isActive - Whether user is active (activity within 15 days)
 * @param {number} lastActivity - Unix timestamp of last activity
 * @returns {string|number} - Expiration time as string (e.g., '30m') or Unix timestamp
 */
export const calculateTokenExpiration = (isActive, lastActivity = null) => {
  if (isActive) {
    // Active users: tokens expire in 30 minutes (will be auto-refreshed)
    return ACTIVE_TOKEN_EXPIRY;
  } else {
    // Inactive users: tokens expire 15 days from last activity
    if (lastActivity) {
      const expirationTimestamp = lastActivity + (INACTIVE_EXPIRY_DAYS * 24 * 60 * 60);
      const now = Math.floor(Date.now() / 1000);
      const secondsUntilExpiry = expirationTimestamp - now;
      
      // If already expired, return a short expiry
      if (secondsUntilExpiry <= 0) {
        return '1m';
      }
      
      // Return as seconds (JWT accepts number of seconds)
      return secondsUntilExpiry;
    }
    // Fallback: 15 days from now
    return INACTIVE_EXPIRY_DAYS * 24 * 60 * 60; // seconds
  }
};

/**
 * Generate access token with dynamic expiration
 * @param {Object} payload - Token payload
 * @param {boolean} isActive - Whether user is active
 * @param {number} lastActivity - Unix timestamp of last activity (optional)
 */
export const generateAccessToken = (payload, isActive = true, lastActivity = null) => {
  const expiresIn = calculateTokenExpiration(isActive, lastActivity);
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn
  });
};

/**
 * Generate refresh token with dynamic expiration
 * @param {Object} payload - Token payload
 * @param {boolean} isActive - Whether user is active
 * @param {number} lastActivity - Unix timestamp of last activity (optional)
 */
export const generateRefreshToken = (payload, isActive = true, lastActivity = null) => {
  const expiresIn = calculateTokenExpiration(isActive, lastActivity);
  
  // Refresh tokens should have longer expiry than access tokens
  // For active users: 7 days (will be refreshed)
  // For inactive users: 15 days from last activity
  if (isActive) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN // 7 days for active users
    });
  } else {
    const refreshExpiry = lastActivity 
      ? lastActivity + (INACTIVE_EXPIRY_DAYS * 24 * 60 * 60)
      : Math.floor(Date.now() / 1000) + (INACTIVE_EXPIRY_DAYS * 24 * 60 * 60);
    const now = Math.floor(Date.now() / 1000);
    const secondsUntilExpiry = refreshExpiry - now;
    
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: secondsUntilExpiry > 0 ? secondsUntilExpiry : 60 // minimum 1 minute
    });
  }
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Generate both tokens with activity-based expiration
 * @param {Object} user - User object
 * @param {Object} activityData - Activity data with isActive and lastActivity (optional)
 */
export const generateTokens = (user, activityData = null) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    group_id: user.group_id
  };

  // Determine activity status
  let isActive = true;
  let lastActivity = null;

  if (activityData) {
    isActive = activityData.isActive !== undefined ? activityData.isActive : true;
    lastActivity = activityData.lastActivity || null;
  } else if (user.activity) {
    // If user has activity relationship loaded
    isActive = user.activity.is_active === 1;
    lastActivity = user.activity.last_activity;
  } else {
    // Default: assume active if no activity data provided
    isActive = true;
  }

  const accessToken = generateAccessToken(payload, isActive, lastActivity);
  const refreshToken = generateRefreshToken(payload, isActive, lastActivity);

  // Calculate expiration info for response
  const expiresIn = calculateTokenExpiration(isActive, lastActivity);
  const expiresInString = typeof expiresIn === 'string' ? expiresIn : `${Math.floor(expiresIn / 60)}m`;

  return {
    accessToken,
    refreshToken,
    expiresIn: expiresInString,
    isActive,
    lastActivity
  };
};

