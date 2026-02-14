import { Op } from 'sequelize';
import { GroupCreate, CreateDetails, User } from '../models/index.js';

/**
 * Get all groups/applications.
 * Query param: has_custom_form=1 - return only groups whose create_details has custom_form IS NOT NULL (for partner login).
 */
export const getAllGroups = async (req, res) => {
  try {
    const { has_custom_form: hasCustomForm } = req.query;
    const includeDetails = {
      model: CreateDetails,
      as: 'details'
    };
    if (hasCustomForm === '1' || hasCustomForm === 'true') {
      includeDetails.required = true;
      includeDetails.where = { custom_form: { [Op.ne]: null } };
    }
    const groups = await GroupCreate.findAll({
      include: [includeDetails],
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching groups',
      error: error.message
    });
  }
};

/**
 * Get group by ID
 */
export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await GroupCreate.findByPk(id, {
      include: [
        {
          model: CreateDetails,
          as: 'details'
        }
      ]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group',
      error: error.message
    });
  }
};

/**
 * Get group by name
 */
export const getGroupByName = async (req, res) => {
  try {
    const { name } = req.params;

    const group = await GroupCreate.findOne({
      where: { name },
      include: [
        {
          model: CreateDetails,
          as: 'details'
        }
      ]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group',
      error: error.message
    });
  }
};

/**
 * Create new group (Admin only)
 */
export const createGroup = async (req, res) => {
  try {
    const { name, apps_name, db_name, icon, logo, background_color, banner, url } = req.body;

    const group = await GroupCreate.create({
      name,
      apps_name,
      db_name
    });

    if (icon || logo || background_color || banner || url) {
      await CreateDetails.create({
        create_id: group.id,
        icon,
        logo,
        background_color,
        banner,
        url
      });
    }

    const createdGroup = await GroupCreate.findByPk(group.id, {
      include: [{ model: CreateDetails, as: 'details' }]
    });

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: createdGroup
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating group',
      error: error.message
    });
  }
};

/**
 * Update group (Admin only)
 */
export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, apps_name, db_name, icon, logo, background_color, banner, url } = req.body;

    const group = await GroupCreate.findByPk(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Update group basic info
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (apps_name !== undefined) updates.apps_name = apps_name;
    if (db_name !== undefined) updates.db_name = db_name;

    await group.update(updates);

    // Update or create details
    if (icon !== undefined || logo !== undefined || background_color !== undefined || banner !== undefined || url !== undefined) {
      const details = await CreateDetails.findOne({ where: { create_id: id } });

      const detailsData = {
        create_id: id,
        ...(icon !== undefined && { icon }),
        ...(logo !== undefined && { logo }),
        ...(background_color !== undefined && { background_color }),
        ...(banner !== undefined && { banner }),
        ...(url !== undefined && { url })
      };

      if (details) {
        await details.update(detailsData);
      } else {
        await CreateDetails.create(detailsData);
      }
    }

    // Fetch updated group
    const updatedGroup = await GroupCreate.findByPk(id, {
      include: [{ model: CreateDetails, as: 'details' }]
    });

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: updatedGroup
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating group',
      error: error.message
    });
  }
};

/**
 * Delete group (Admin only)
 */
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await GroupCreate.findByPk(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Delete associated details first
    await CreateDetails.destroy({ where: { create_id: id } });

    // Delete group
    await group.destroy();

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting group',
      error: error.message
    });
  }
};
