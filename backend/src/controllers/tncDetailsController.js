import TncDetails from '../models/TncDetails.js';
import GroupCreate from '../models/GroupCreate.js';

// Get all apps
export const getAllApps = async (req, res) => {
  try {
    const apps = await GroupCreate.findAll({
      attributes: ['id', 'name', 'apps_name'],
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      data: apps
    });
  } catch (error) {
    console.error('Error fetching apps:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch apps'
    });
  }
};

// Get all TNC details
export const getAllTnc = async (req, res) => {
  try {
    const tncList = await TncDetails.findAll({
      include: [
        {
          model: GroupCreate,
          as: 'group',
          attributes: ['id', 'name', 'apps_name']
        }
      ],
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      data: tncList
    });
  } catch (error) {
    console.error('Error fetching TNC details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch TNC details'
    });
  }
};

// Get TNC by group_id
export const getTncByGroupId = async (req, res) => {
  try {
    const { group_id } = req.params;

    const tnc = await TncDetails.findOne({
      where: { group_id },
      include: [
        {
          model: GroupCreate,
          as: 'group',
          attributes: ['id', 'name', 'apps_name']
        }
      ]
    });

    res.json({
      success: true,
      data: tnc
    });
  } catch (error) {
    console.error('Error fetching TNC by group_id:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch TNC details'
    });
  }
};

// Create or update TNC
export const createOrUpdateTnc = async (req, res) => {
  try {
    const { group_id, tnc_content } = req.body;

    if (!group_id || !tnc_content) {
      return res.status(400).json({
        success: false,
        message: 'Group ID and content are required'
      });
    }

    // Check if TNC already exists for this group
    const existingTnc = await TncDetails.findOne({
      where: { group_id }
    });

    let result;
    if (existingTnc) {
      // Update existing
      await existingTnc.update({ tnc_content });
      result = await TncDetails.findByPk(existingTnc.id, {
        include: [
          {
            model: GroupCreate,
            as: 'group',
            attributes: ['id', 'name', 'apps_name']
          }
        ]
      });
    } else {
      // Create new
      const newTnc = await TncDetails.create({
        group_id,
        tnc_content
      });
      result = await TncDetails.findByPk(newTnc.id, {
        include: [
          {
            model: GroupCreate,
            as: 'group',
            attributes: ['id', 'name', 'apps_name']
          }
        ]
      });
    }

    res.json({
      success: true,
      message: existingTnc ? 'TNC updated successfully' : 'TNC created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating/updating TNC:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save TNC details'
    });
  }
};

// Delete TNC
export const deleteTnc = async (req, res) => {
  try {
    const { id } = req.params;

    const tnc = await TncDetails.findByPk(id);
    if (!tnc) {
      return res.status(404).json({
        success: false,
        message: 'TNC not found'
      });
    }

    await tnc.destroy();

    res.json({
      success: true,
      message: 'TNC deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting TNC:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete TNC'
    });
  }
};

