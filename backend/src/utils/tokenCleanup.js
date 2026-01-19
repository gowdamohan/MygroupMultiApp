import UserActivity from '../models/UserActivity.js';
import User from '../models/User.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

const INACTIVE_THRESHOLD_SECONDS = 15 * 24 * 60 * 60; // 15 days in seconds

/**
 * Clean up expired tokens and mark inactive users
 * This function should be called periodically (e.g., daily)
 */
export const cleanupExpiredTokens = async () => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const inactiveThreshold = now - INACTIVE_THRESHOLD_SECONDS;

    console.log(`[Token Cleanup] Starting cleanup at ${new Date().toISOString()}`);

    // Find all user activities
    const activities = await UserActivity.findAll();

    let updatedCount = 0;
    let inactiveCount = 0;

    for (const activity of activities) {
      const timeSinceActivity = now - activity.last_activity;
      const isActive = timeSinceActivity < INACTIVE_THRESHOLD_SECONDS;

      // Update activity status
      if (activity.is_active !== (isActive ? 1 : 0)) {
        await activity.update({
          is_active: isActive ? 1 : 0,
          token_expires_at: isActive ? null : (activity.last_activity + INACTIVE_THRESHOLD_SECONDS)
        });
        updatedCount++;

        if (!isActive) {
          inactiveCount++;
        }
      }

      // Check if token should have expired for inactive users
      if (!isActive && activity.token_expires_at) {
        if (now >= activity.token_expires_at) {
          // Token has expired for this inactive user
          // Note: The actual token expiration is handled by JWT verification
          // This is just for tracking purposes
          console.log(`[Token Cleanup] Token expired for inactive user ${activity.user_id}`);
        }
      }
    }

    console.log(`[Token Cleanup] Completed: ${updatedCount} activities updated, ${inactiveCount} users marked inactive`);

    return {
      success: true,
      updated: updatedCount,
      inactive: inactiveCount,
      timestamp: now
    };
  } catch (error) {
    console.error('[Token Cleanup] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Mark users as inactive if they haven't been active for 15+ days
 */
export const markInactiveUsers = async () => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const inactiveThreshold = now - INACTIVE_THRESHOLD_SECONDS;

    // Update activities where last_activity is older than 15 days
    const result = await UserActivity.update(
      {
        is_active: 0,
        token_expires_at: sequelize.literal(`last_activity + ${INACTIVE_THRESHOLD_SECONDS}`)
      },
      {
        where: {
          last_activity: {
            [Op.lt]: inactiveThreshold
          },
          is_active: 1
        }
      }
    );

    console.log(`[Token Cleanup] Marked ${result[0]} users as inactive`);

    return {
      success: true,
      markedInactive: result[0]
    };
  } catch (error) {
    console.error('[Token Cleanup] Error marking inactive users:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get statistics about user activity
 */
export const getActivityStats = async () => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const inactiveThreshold = now - INACTIVE_THRESHOLD_SECONDS;

    const totalUsers = await UserActivity.count();
    const activeUsers = await UserActivity.count({
      where: {
        is_active: 1,
        last_activity: {
          [Op.gte]: inactiveThreshold
        }
      }
    });
    const inactiveUsers = totalUsers - activeUsers;

    return {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers
    };
  } catch (error) {
    console.error('[Token Cleanup] Error getting stats:', error);
    return null;
  }
};
