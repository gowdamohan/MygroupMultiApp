import { Country, State, District, Education, Profession } from '../models/index.js';

/**
 * Get all countries
 */
export const getCountries = async (req, res) => {
  try {
    const countries = await Country.findAll({
      attributes: ['id', 'country', 'code', 'country_flag', 'phone_code'],
      order: [['country', 'ASC']]
    });

    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching countries',
      error: error.message
    });
  }
};

/**
 * Get states by country
 */
export const getStatesByCountry = async (req, res) => {
  try {
    const { countryId } = req.params;

    const states = await State.findAll({
      where: { country_id: countryId },
      attributes: ['id', 'state', 'code'],
      order: [['state', 'ASC']]
    });

    res.json({
      success: true,
      data: states
    });
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching states',
      error: error.message
    });
  }
};

/**
 * Get districts by state
 */
export const getDistrictsByState = async (req, res) => {
  try {
    const { stateId } = req.params;

    const districts = await District.findAll({
      where: { state_id: stateId },
      attributes: ['id', 'district', 'code'],
      order: [['district', 'ASC']]
    });

    res.json({
      success: true,
      data: districts
    });
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching districts',
      error: error.message
    });
  }
};

/**
 * Get all education options
 */
export const getEducation = async (req, res) => {
  try {
    const education = await Education.findAll({
      attributes: ['id', 'education'],
      order: [['education', 'ASC']]
    });

    res.json({
      success: true,
      data: education
    });
  } catch (error) {
    console.error('Get education error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching education options',
      error: error.message
    });
  }
};

/**
 * Get all professions
 */
export const getProfessions = async (req, res) => {
  try {
    const professions = await Profession.findAll({
      attributes: ['id', 'profession'],
      order: [['profession', 'ASC']]
    });

    res.json({
      success: true,
      data: professions
    });
  } catch (error) {
    console.error('Get professions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professions',
      error: error.message
    });
  }
};

