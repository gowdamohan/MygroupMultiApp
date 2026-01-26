import UserTermsConditions from '../models/UserTermsConditions.js';

export const getAllTerms = async (req, res) => {
  try {
    const terms = await UserTermsConditions.findAll({
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Error fetching user terms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user terms and conditions'
    });
  }
};

export const getTermsByType = async (req, res) => {
  try {
    const { type } = req.params;

    const terms = await UserTermsConditions.findOne({
      where: { type }
    });

    res.json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Error fetching user terms by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user terms and conditions'
    });
  }
};

export const createOrUpdateTerms = async (req, res) => {
  try {
    const { type, content } = req.body;

    if (!type || !content) {
      return res.status(400).json({
        success: false,
        message: 'Type and content are required'
      });
    }

    const existingTerms = await UserTermsConditions.findOne({
      where: { type }
    });

    let result;
    if (existingTerms) {
      await existingTerms.update({ content });
      result = existingTerms;
    } else {
      result = await UserTermsConditions.create({
        type,
        content
      });
    }

    res.json({
      success: true,
      message: existingTerms ? 'Terms updated successfully' : 'Terms created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating/updating user terms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save user terms and conditions'
    });
  }
};

export const deleteTerms = async (req, res) => {
  try {
    const { id } = req.params;

    const terms = await UserTermsConditions.findByPk(id);
    if (!terms) {
      return res.status(404).json({
        success: false,
        message: 'Terms not found'
      });
    }

    await terms.destroy();

    res.json({
      success: true,
      message: 'Terms deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user terms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user terms and conditions'
    });
  }
};
