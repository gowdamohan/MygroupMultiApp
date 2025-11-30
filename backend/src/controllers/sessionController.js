import User from '../models/User.js';

/**
 * Get active sessions for current user
 */
export const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    // TODO: Implement session tracking in database
    // For now, return mock data
    const sessions = [
      {
        id: 1,
        device: 'Chrome on Windows',
        ip: req.ip,
        location: 'Unknown',
        lastActive: Math.floor(Date.now() / 1000),
        current: true
      }
    ];

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions',
      error: error.message
    });
  }
};

/**
 * Revoke a specific session
 */
export const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // TODO: Implement session revocation
    // This would involve invalidating the refresh token for that session

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking session',
      error: error.message
    });
  }
};

/**
 * Revoke all sessions except current
 */
export const revokeAllSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    // TODO: Implement revoking all sessions
    // This would involve invalidating all refresh tokens except the current one

    res.json({
      success: true,
      message: 'All other sessions revoked successfully'
    });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking sessions',
      error: error.message
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, phone } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields only
    const updates = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (phone !== undefined) updates.phone = phone;

    await user.update(updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

/**
 * Logout (invalidate current session)
 */
export const logout = async (req, res) => {
  try {
    // TODO: Implement token blacklisting or session invalidation
    // For now, just return success (client will remove tokens)

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};

