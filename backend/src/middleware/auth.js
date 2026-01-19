import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.js';
import UserActivity from '../models/UserActivity.js';

// Constants for activity tracking
const INACTIVE_THRESHOLD_DAYS = 15;
const INACTIVE_THRESHOLD_SECONDS = INACTIVE_THRESHOLD_DAYS * 24 * 60 * 60;

/**
 * Update user activity timestamp
 * This function is called on every authenticated request
 */
const updateUserActivity = async (userId) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    // Find or create user activity record
    let userActivity = await UserActivity.findOne({
      where: { user_id: userId }
    });

    if (!userActivity) {
      // Create new activity record
      userActivity = await UserActivity.create({
        user_id: userId,
        last_activity: now,
        is_active: 1,
        token_expires_at: now + INACTIVE_THRESHOLD_SECONDS
      });
    } else {
      // Update activity timestamp
      const lastActivity = userActivity.last_activity;
      const timeSinceLastActivity = now - lastActivity;
      
      // Update last activity
      await userActivity.update({
        last_activity: now
      });

      // Check if user should be marked as active
      // User is active if last activity was within 15 days
      const isActive = timeSinceLastActivity < INACTIVE_THRESHOLD_SECONDS;
      
      // Update active status and token expiration
      await userActivity.update({
        is_active: isActive ? 1 : 0,
        token_expires_at: isActive ? null : (now + INACTIVE_THRESHOLD_SECONDS)
      });
    }

    return userActivity;
  } catch (error) {
    console.error('Error updating user activity:', error);
    // Don't throw error - activity tracking shouldn't break authentication
    return null;
  }
};

/**
 * Authenticate user middleware with activity tracking
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Find user with activity data
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: UserActivity,
        as: 'activity',
        required: false
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Update user activity (track this request as activity)
    await updateUserActivity(user.id);

    // Reload user with updated activity
    await user.reload({
      include: [{
        model: UserActivity,
        as: 'activity',
        required: false
      }]
    });

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

export const authenticateToken = authenticate;

/**
 * Check if user has specific role
 */
export const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }

      // TODO: Implement role checking with users_groups table
      // For now, just pass through
      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: error.message
      });
    }
  };
};

