import FranchiseTermsConditions from '../models/FranchiseTermsConditions.js';

// Get all terms and conditions
export const getAllTerms = async (req, res) => {
  try {
    const terms = await FranchiseTermsConditions.findAll({
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch terms and conditions'
    });
  }
};

// Get terms by type
export const getTermsByType = async (req, res) => {
  try {
    const { type } = req.params;

    const terms = await FranchiseTermsConditions.findOne({
      where: { type }
    });

    res.json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Error fetching terms by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch terms and conditions'
    });
  }
};

// Create or update terms
export const createOrUpdateTerms = async (req, res) => {
  try {
    const { type, content } = req.body;

    if (!type || !content) {
      return res.status(400).json({
        success: false,
        message: 'Type and content are required'
      });
    }

    // Check if terms already exist for this type
    const existingTerms = await FranchiseTermsConditions.findOne({
      where: { type }
    });

    let result;
    if (existingTerms) {
      // Update existing
      await existingTerms.update({ content });
      result = existingTerms;
    } else {
      // Create new
      result = await FranchiseTermsConditions.create({
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
    console.error('Error creating/updating terms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save terms and conditions'
    });
  }
};

// Delete terms
export const deleteTerms = async (req, res) => {
  try {
    const { id } = req.params;

    const terms = await FranchiseTermsConditions.findByPk(id);
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
    console.error('Error deleting terms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete terms and conditions'
    });
  }
};

