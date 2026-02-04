import MyGroupProfile from '../models/MyGroupProfile.js';

/**
 * GET /api/v1/admin/profile
 * Fetch the group profile (single record - first row or null)
 */
export const getProfile = async (req, res) => {
  try {
    const profile = await MyGroupProfile.findOne({
      order: [['id', 'ASC']]
    });

    if (!profile) {
      return res.json({
        success: true,
        data: null,
        message: 'No profile found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

/**
 * POST /api/v1/admin/profile
 * Create a new profile (with optional file uploads)
 */
export const createProfile = async (req, res) => {
  try {
    const { name, color_code } = req.body;

    const icon = req.files?.icon ? `/uploads/profile/${req.files.icon[0].filename}` : null;
    const logo = req.files?.logo ? `/uploads/profile/${req.files.logo[0].filename}` : null;
    const name_image = req.files?.name_image ? `/uploads/profile/${req.files.name_image[0].filename}` : null;

    const profile = await MyGroupProfile.create({
      name: name || null,
      icon,
      logo,
      name_image,
      color_code: color_code || null
    });

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: profile
    });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create profile',
      error: error.message
    });
  }
};

/**
 * PUT /api/v1/admin/profile/:id
 * Update existing profile (preserve existing file paths if no new file uploaded)
 */
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color_code } = req.body;

    const profile = await MyGroupProfile.findByPk(id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const icon = req.files?.icon
      ? `/uploads/profile/${req.files.icon[0].filename}`
      : profile.icon;
    const logo = req.files?.logo
      ? `/uploads/profile/${req.files.logo[0].filename}`
      : profile.logo;
    const name_image = req.files?.name_image
      ? `/uploads/profile/${req.files.name_image[0].filename}`
      : profile.name_image;

    // Optional: delete old files when replacing (uncomment if you want to remove old uploads)
    // if (req.files?.icon && profile.icon) deleteFile(profile.icon);
    // if (req.files?.logo && profile.logo) deleteFile(profile.logo);
    // if (req.files?.name_image && profile.name_image) deleteFile(profile.name_image);

    await profile.update({
      name: name !== undefined ? name : profile.name,
      icon,
      logo,
      name_image,
      color_code: color_code !== undefined ? color_code : profile.color_code
    });

    const updated = await MyGroupProfile.findByPk(id);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};
