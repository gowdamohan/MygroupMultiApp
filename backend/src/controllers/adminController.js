import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import {
  Continent,
  Country,
  State,
  District,
  Language,
  Education,
  Profession,
  GroupCreate,
  CreateDetails,
  Group,
  AppCategory,
  AppCategoryCustomForm,
  User,
  UserGroup,
  ClientRegistration
} from '../models/index.js';

/**
 * ============================================
 * CONTINENT MANAGEMENT
 * ============================================
 */

// Get all continents
export const getContinents = async (req, res) => {
  try {
    const continents = await Continent.findAll({
      order: [['order', 'ASC'], ['continent', 'ASC']]
    });

    res.json({
      success: true,
      data: continents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch continents',
      error: error.message
    });
  }
};

// Create continent
export const createContinent = async (req, res) => {
  try {
    const { continent, order, status, code } = req.body;

    const continents = await Continent.create({
      continent,
      order: order || 0,
      status: status !== undefined ? status : 1,
      code
    });

    res.status(201).json({
      success: true,
      message: 'Continent created successfully',
      data: continents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create continent',
      error: error.message
    });
  }
};

// Update continent
export const updateContinent = async (req, res) => {
  try {
    const { id } = req.params;
    const { continent, order, status, code } = req.body;

    const continentRecord = await Continent.findByPk(id);
    if (!continentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Continent not found'
      });
    }

    await continentRecord.update({
      continent,
      order,
      status,
      code
    });

    res.json({
      success: true,
      message: 'Continent updated successfully',
      data: continentRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update continent',
      error: error.message
    });
  }
};

// Delete continent
export const deleteContinent = async (req, res) => {
  try {
    const { id } = req.params;

    const continent = await Continent.findByPk(id);
    if (!continent) {
      return res.status(404).json({
        success: false,
        message: 'Continent not found'
      });
    }

    await continent.destroy();

    res.json({
      success: true,
      message: 'Continent deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete continent',
      error: error.message
    });
  }
};

/**
 * ============================================
 * COUNTRY MANAGEMENT
 * ============================================
 */

// Get all countries
export const getCountries = async (req, res) => {
  try {
    const { continentId } = req.query;
    const where = continentId ? { continent_id: continentId } : {};

    const countries = await Country.findAll({
      where,
      include: [{ model: Continent, as: 'continent' }],
      order: [['order', 'ASC'], ['country', 'ASC']]
    });

    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch countries',
      error: error.message
    });
  }
};

// Create country
export const createCountry = async (req, res) => {
  try {
    const { continent_id, country, code, currency, currency_name, phone_code, nationality, order, status, country_flag: countryFlagPath, currency_icon: currencyIconPath } = req.body;

    // Get uploaded file paths (new uploads) or use existing paths from body
    const country_flag = req.files?.country_flag 
      ? `/uploads/geo/${req.files.country_flag[0].filename}` 
      : (countryFlagPath || null);
    const currency_icon = req.files?.currency_icon 
      ? `/uploads/geo/${req.files.currency_icon[0].filename}` 
      : (currencyIconPath || null);

    const newCountry = await Country.create({
      continent_id,
      country,
      code,
      country_flag,
      currency,
      currency_name,
      currency_icon,
      phone_code,
      nationality,
      order: order || 0,
      status: status !== undefined ? status : 1
    });

    res.status(201).json({
      success: true,
      message: 'Country created successfully',
      data: newCountry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create country',
      error: error.message
    });
  }
};

// Update country
export const updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const { continent_id, country, code, currency, currency_name, phone_code, nationality, order, status, country_flag: countryFlagPath, currency_icon: currencyIconPath } = req.body;

    const countryRecord = await Country.findByPk(id);
    if (!countryRecord) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    // Get uploaded file paths (new uploads), or use paths from body, or keep existing ones
    const country_flag = req.files?.country_flag
      ? `/uploads/geo/${req.files.country_flag[0].filename}`
      : (countryFlagPath || countryRecord.country_flag || null);
    const currency_icon = req.files?.currency_icon
      ? `/uploads/geo/${req.files.currency_icon[0].filename}`
      : (currencyIconPath || countryRecord.currency_icon || null);

    await countryRecord.update({
      continent_id,
      country,
      code,
      country_flag,
      currency,
      currency_name,
      currency_icon,
      phone_code,
      nationality,
      order,
      status
    });

    res.json({
      success: true,
      message: 'Country updated successfully',
      data: countryRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update country',
      error: error.message
    });
  }
};

// Delete country
export const deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;

    const country = await Country.findByPk(id);
    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    await country.destroy();

    res.json({
      success: true,
      message: 'Country deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete country',
      error: error.message
    });
  }
};

/**
 * ============================================
 * COUNTRY LOCKING MANAGEMENT
 * ============================================
 */

// Update country locking settings
export const updateCountryLocking = async (req, res) => {
  try {
    const { id } = req.params;
    const { lockStates, lockDistricts } = req.body;

    const country = await Country.findByPk(id);
    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    await country.update({
      locking_json: { lockStates, lockDistricts }
    });

    res.json({
      success: true,
      message: 'Country locking settings updated successfully',
      data: country
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update country locking settings',
      error: error.message
    });
  }
};

/**
 * ============================================
 * STATE MANAGEMENT
 * ============================================
 */

// Get all states
export const getStates = async (req, res) => {
  try {
    const { countryId } = req.query;
    const where = countryId ? { country_id: countryId } : {};

    const states = await State.findAll({
      where,
      include: [
        { model: Country, as: 'country', include: [{ model: Continent, as: 'continent' }] }
      ],
      order: [['order', 'ASC'], ['state', 'ASC']]
    });

    res.json({
      success: true,
      data: states
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch states',
      error: error.message
    });
  }
};

// Create state
export const createState = async (req, res) => {
  try {
    const { country_id, state, code, order, status } = req.body;

    const newState = await State.create({
      country_id,
      state,
      code,
      order: order || 0,
      status: status !== undefined ? status : 1
    });

    res.status(201).json({
      success: true,
      message: 'State created successfully',
      data: newState
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create state',
      error: error.message
    });
  }
};

// Update state
export const updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const { country_id, state, code, order, status } = req.body;

    const stateRecord = await State.findByPk(id);
    if (!stateRecord) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    await stateRecord.update({
      country_id,
      state,
      code,
      order,
      status
    });

    res.json({
      success: true,
      message: 'State updated successfully',
      data: stateRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update state',
      error: error.message
    });
  }
};

// Delete state
export const deleteState = async (req, res) => {
  try {
    const { id } = req.params;

    const state = await State.findByPk(id);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    await state.destroy();

    res.json({
      success: true,
      message: 'State deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete state',
      error: error.message
    });
  }
};

/**
 * ============================================
 * DISTRICT MANAGEMENT
 * ============================================
 */

// Get all districts
export const getDistricts = async (req, res) => {
  try {
    const { stateId } = req.query;
    const where = stateId ? { state_id: stateId } : {};

    const districts = await District.findAll({
      where,
      include: [
        {
          model: State,
          as: 'state',
          include: [
            {
              model: Country,
              as: 'country',
              include: [{ model: Continent, as: 'continent' }]
            }
          ]
        }
      ],
      order: [['order', 'ASC'], ['district', 'ASC']]
    });

    res.json({
      success: true,
      data: districts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch districts',
      error: error.message
    });
  }
};

// Create district
export const createDistrict = async (req, res) => {
  try {
    const { state_id, district, code, order, status } = req.body;

    const newDistrict = await District.create({
      state_id,
      district,
      code,
      order: order || 0,
      status: status !== undefined ? status : 1
    });

    res.status(201).json({
      success: true,
      message: 'District created successfully',
      data: newDistrict
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create district',
      error: error.message
    });
  }
};

// Update district
export const updateDistrict = async (req, res) => {
  try {
    const { id } = req.params;
    const { state_id, district, code, order, status } = req.body;

    const districtRecord = await District.findByPk(id);
    if (!districtRecord) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }

    await districtRecord.update({
      state_id,
      district,
      code,
      order,
      status
    });

    res.json({
      success: true,
      message: 'District updated successfully',
      data: districtRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update district',
      error: error.message
    });
  }
};

// Delete district
export const deleteDistrict = async (req, res) => {
  try {
    const { id } = req.params;

    const district = await District.findByPk(id);
    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }

    await district.destroy();

    res.json({
      success: true,
      message: 'District deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete district',
      error: error.message
    });
  }
};

/**
 * ============================================
 * LANGUAGE MANAGEMENT
 * ============================================
 */

// Get all languages
export const getLanguages = async (req, res) => {
  try {
    const languages = await Language.findAll({
      include: [{
        model: Country,
        as: 'country',
        attributes: ['country']
      }],
      order: [['id', 'DESC']]
    });

    // Format response to include country name
    const formattedLanguages = languages.map(lang => ({
      id: lang.id,
      country_id: lang.country_id,
      country: lang.country?.country || null,
      lang_1: lang.lang_1,
      lang_2: lang.lang_2
    }));

    res.json({
      success: true,
      data: formattedLanguages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch languages',
      error: error.message
    });
  }
};

// Create language
export const createLanguage = async (req, res) => {
  try {
    const { country_id, lang_1, lang_2 } = req.body;

    const language = await Language.create({
      lang_1,
      lang_2,
      country_id
    });

    res.status(201).json({
      success: true,
      message: 'Language created successfully',
      data: language
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create language',
      error: error.message
    });
  }
};

// Update language
export const updateLanguage = async (req, res) => {
  try {
    const { id } = req.params;
    const { country_id, lang_1, lang_2 } = req.body;

    const language = await Language.findByPk(id);
    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found'
      });
    }

    await language.update({country_id, lang_1, lang_2 });

    res.json({
      success: true,
      message: 'Language updated successfully',
      data: language
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update language',
      error: error.message
    });
  }
};

// Delete language
export const deleteLanguage = async (req, res) => {
  try {
    const { id } = req.params;

    const language = await Language.findByPk(id);
    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found'
      });
    }

    await language.destroy();

    res.json({
      success: true,
      message: 'Language deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete language',
      error: error.message
    });
  }
};

/**
 * ============================================
 * EDUCATION MANAGEMENT
 * ============================================
 */

// Get all education
export const getEducation = async (req, res) => {
  try {
    const education = await Education.findAll({
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      data: education
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch education',
      error: error.message
    });
  }
};

// Create education
export const createEducation = async (req, res) => {
  try {
    const { education, group_id } = req.body;

    const newEducation = await Education.create({
      education,
      group_id
    });

    res.status(201).json({
      success: true,
      message: 'Education created successfully',
      data: newEducation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create education',
      error: error.message
    });
  }
};

// Update education
export const updateEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const { education, group_id } = req.body;

    const educationRecord = await Education.findByPk(id);
    if (!educationRecord) {
      return res.status(404).json({
        success: false,
        message: 'Education not found'
      });
    }

    await educationRecord.update({ education, group_id });

    res.json({
      success: true,
      message: 'Education updated successfully',
      data: educationRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update education',
      error: error.message
    });
  }
};

// Delete education
export const deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;

    const education = await Education.findByPk(id);
    if (!education) {
      return res.status(404).json({
        success: false,
        message: 'Education not found'
      });
    }

    await education.destroy();

    res.json({
      success: true,
      message: 'Education deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete education',
      error: error.message
    });
  }
};

/**
 * ============================================
 * PROFESSION MANAGEMENT
 * ============================================
 */

// Get all professions
export const getProfessions = async (req, res) => {
  try {
    const professions = await Profession.findAll({
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      data: professions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch professions',
      error: error.message
    });
  }
};

// Create profession
export const createProfession = async (req, res) => {
  try {
    const { profession, group_id } = req.body;

    const newProfession = await Profession.create({
      profession,
      group_id
    });

    res.status(201).json({
      success: true,
      message: 'Profession created successfully',
      data: newProfession
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create profession',
      error: error.message
    });
  }
};

// Update profession
export const updateProfession = async (req, res) => {
  try {
    const { id } = req.params;
    const { profession, group_id } = req.body;

    const professionRecord = await Profession.findByPk(id);
    if (!professionRecord) {
      return res.status(404).json({
        success: false,
        message: 'Profession not found'
      });
    }

    await professionRecord.update({ profession, group_id });

    res.json({
      success: true,
      message: 'Profession updated successfully',
      data: professionRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profession',
      error: error.message
    });
  }
};

// Delete profession
export const deleteProfession = async (req, res) => {
  try {
    const { id } = req.params;

    const profession = await Profession.findByPk(id);
    if (!profession) {
      return res.status(404).json({
        success: false,
        message: 'Profession not found'
      });
    }

    await profession.destroy();

    res.json({
      success: true,
      message: 'Profession deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete profession',
      error: error.message
    });
  }
};

/**
 * ============================================
 * CREATE APPS MANAGEMENT
 * ============================================
 */

// Get all created apps
export const getCreatedApps = async (req, res) => {
  try {
    const apps = await GroupCreate.findAll({
      include: [{ model: CreateDetails, as: 'details' }],
      order: [['order_by', 'ASC'], ['id', 'ASC']]
    });

    res.json({
      success: true,
      data: apps
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch created apps',
      error: error.message
    });
  }
};

// Create new app
export const createApp = async (req, res) => {
  try {
    const { name, apps_name, order_by, code, background_color, url } = req.body;

    // Get uploaded file paths
    const icon = req.files?.icon ? `/uploads/apps/${req.files.icon[0].filename}` : null;
    const logo = req.files?.logo ? `/uploads/apps/${req.files.logo[0].filename}` : null;
    const name_image = req.files?.name_image ? `/uploads/apps/${req.files.name_image[0].filename}` : null;

    // Create group_create entry
    const app = await GroupCreate.create({
      name,
      apps_name,
      order_by: order_by || 0,
      code
    });

    // Create create_details entry if any details provided
    if (icon || logo || name_image || background_color || url) {
      await CreateDetails.create({
        create_id: app.id,
        icon,
        logo,
        name_image,
        background_color: background_color || '#ffffff',
        url
      });
    }

    // Fetch the created app with details
    const createdApp = await GroupCreate.findByPk(app.id, {
      include: [{ model: CreateDetails, as: 'details' }]
    });

    res.status(201).json({
      success: true,
      message: 'App created successfully',
      data: createdApp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create app',
      error: error.message
    });
  }
};

// Update app
export const updateApp = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, apps_name, order_by, code, background_color, url } = req.body;

    const app = await GroupCreate.findByPk(id);
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'App not found'
      });
    }

    // Update group_create
    await app.update({
      name,
      apps_name,
      order_by,
      code
    });

    // Get existing details to preserve old file paths if no new files uploaded
    const existingDetails = await CreateDetails.findOne({ where: { create_id: id } });

    // Get uploaded file paths or keep existing ones
    const icon = req.files?.icon
      ? `/uploads/apps/${req.files.icon[0].filename}`
      : (existingDetails?.icon || null);
    const logo = req.files?.logo
      ? `/uploads/apps/${req.files.logo[0].filename}`
      : (existingDetails?.logo || null);
    const name_image = req.files?.name_image
      ? `/uploads/apps/${req.files.name_image[0].filename}`
      : (existingDetails?.name_image || null);

    // Update or create create_details
    if (existingDetails) {
      await existingDetails.update({
        icon,
        logo,
        name_image,
        background_color: background_color || existingDetails.background_color,
        url: url || existingDetails.url
      });
    } else if (icon || logo || name_image || background_color || url) {
      await CreateDetails.create({
        create_id: id,
        icon,
        logo,
        name_image,
        background_color: background_color || '#ffffff',
        url
      });
    }

    // Fetch updated app with details
    const updatedApp = await GroupCreate.findByPk(id, {
      include: [{ model: CreateDetails, as: 'details' }]
    });

    res.json({
      success: true,
      message: 'App updated successfully',
      data: updatedApp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update app',
      error: error.message
    });
  }
};

// Delete app
export const deleteApp = async (req, res) => {
  try {
    const { id } = req.params;

    const app = await GroupCreate.findByPk(id);
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'App not found'
      });
    }

    // Delete create_details first (if exists)
    await CreateDetails.destroy({ where: { create_id: id } });

    // Delete group_create
    await app.destroy();

    res.json({
      success: true,
      message: 'App deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete app',
      error: error.message
    });
  }
};

/**
 * ============================================
 * APP LOCKING MANAGEMENT
 * ============================================
 */

// Get app locking settings
export const getAppLocking = async (req, res) => {
  try {
    const { id } = req.params;

    const app = await GroupCreate.findByPk(id);
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'App not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: app.id,
        name: app.name,
        locking_json: app.locking_json || {
          lockCategory: false,
          lockSubCategory: false,
          lockChildCategory: false,
          customFormConfig: {}
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch app locking settings',
      error: error.message
    });
  }
};

// Update app locking settings
export const updateAppLocking = async (req, res) => {
  try {
    const { id } = req.params;
    const { lockCategory, lockSubCategory, lockChildCategory, customFormConfig } = req.body;

    const app = await GroupCreate.findByPk(id);
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'App not found'
      });
    }

    // Only allow locking for "My Apps" type
    if (app.apps_name !== 'My Apps') {
      return res.status(400).json({
        success: false,
        message: 'Locking is only available for "My Apps" type applications'
      });
    }

    await app.update({
      locking_json: {
        lockCategory: lockCategory || false,
        lockSubCategory: lockSubCategory || false,
        lockChildCategory: lockChildCategory || false,
        customFormConfig: customFormConfig || {}
      }
    });

    res.json({
      success: true,
      message: 'App locking settings updated successfully',
      data: app
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update app locking settings',
      error: error.message
    });
  }
};

/**
 * ============================================
 * APP CATEGORIES MANAGEMENT
 * ============================================
 */

// Get categories for a specific app (with hierarchy)
export const getAppCategories = async (req, res) => {
  try {
    const { appId } = req.params;

    const categories = await AppCategory.findAll({
      where: { app_id: appId },
      include: [
        { model: AppCategory, as: 'parent' },
        { model: AppCategory, as: 'children' }
      ],
      order: [['sort_order', 'ASC'], ['category_name', 'ASC']]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { app_id, parent_id, category_name, category_type, category_image, sort_order, status } = req.body;

    const category = await AppCategory.create({
      app_id,
      parent_id: parent_id || null,
      category_name,
      category_type,
      category_image,
      sort_order: sort_order || 0,
      status: status !== undefined ? status : 1
    });

    // Fetch created category with relations
    const createdCategory = await AppCategory.findByPk(category.id, {
      include: [
        { model: AppCategory, as: 'parent' },
        { model: AppCategory, as: 'children' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: createdCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { parent_id, category_name, category_type, category_image, sort_order, status } = req.body;

    const category = await AppCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    await category.update({
      parent_id: parent_id || null,
      category_name,
      category_type,
      category_image,
      sort_order,
      status
    });

    // Fetch updated category with relations
    const updatedCategory = await AppCategory.findByPk(id, {
      include: [
        { model: AppCategory, as: 'parent' },
        { model: AppCategory, as: 'children' }
      ]
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await AppCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has children
    const childCount = await AppCategory.count({ where: { parent_id: id } });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Please delete subcategories first.'
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

/**
 * ============================================
 * CATEGORY CUSTOM FORMS MANAGEMENT
 * ============================================
 */

// Save or update custom form for a category
export const saveCategoryCustomForm = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { form_schema } = req.body;

    const category = await AppCategory.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if app has locking enabled
    const app = await GroupCreate.findByPk(category.app_id);
    if (!app || app.apps_name !== 'My Apps') {
      return res.status(400).json({
        success: false,
        message: 'Custom forms are only available for "My Apps" type applications'
      });
    }

    // Find or create custom form
    let customForm = await AppCategoryCustomForm.findOne({
      where: { category_id: categoryId }
    });

    if (customForm) {
      await customForm.update({ form_schema });
    } else {
      customForm = await AppCategoryCustomForm.create({
        app_id: category.app_id,
        category_id: categoryId,
        form_schema
      });
    }

    res.json({
      success: true,
      message: 'Custom form saved successfully',
      data: customForm
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save custom form',
      error: error.message
    });
  }
};

// Get custom form for a category
export const getCategoryCustomForm = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const customForm = await AppCategoryCustomForm.findOne({
      where: { category_id: categoryId },
      include: [
        { model: AppCategory, as: 'category' },
        { model: GroupCreate, as: 'app' }
      ]
    });

    if (!customForm) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: customForm
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch custom form',
      error: error.message
    });
  }
};

/**
 * ============================================
 * CORPORATE LOGIN MANAGEMENT
 * ============================================
 */

// Get corporate user (only one should exist)
export const getCorporateUser = async (req, res) => {
  try {
    // First, get or create the 'corporate' group
    let corporateGroup = await Group.findOne({ where: { name: 'corporate' } });

    if (!corporateGroup) {
      corporateGroup = await Group.create({
        name: 'corporate',
        description: 'Corporate admin group'
      });
    }

    // Find user associated with corporate group
    const userGroup = await UserGroup.findOne({
      where: { group_id: corporateGroup.id },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    res.json({
      success: true,
      data: userGroup ? userGroup.user : null,
      corporateGroupId: corporateGroup.id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch corporate user',
      error: error.message
    });
  }
};

// Create corporate user (one-time only)
export const createCorporateUser = async (req, res) => {
  try {
    const { first_name, email, username, password } = req.body;

    // Get or create corporate group
    let corporateGroup = await Group.findOne({ where: { name: 'corporate' } });

    if (!corporateGroup) {
      corporateGroup = await Group.create({
        name: 'corporate',
        description: 'Corporate admin group'
      });
    }

    // Check if corporate user already exists
    const existingUserGroup = await UserGroup.findOne({
      where: { group_id: corporateGroup.id }
    });

    if (existingUserGroup) {
      return res.status(400).json({
        success: false,
        message: 'Corporate user already exists. Use edit or reset password instead.'
      });
    }

    // Create user
    const user = await User.create({
      first_name,
      email,
      username,
      password,
      active: 1
    });

    // Create user-group association
    await UserGroup.create({
      user_id: user.id,
      group_id: corporateGroup.id
    });

    // Fetch created user without password
    const createdUser = await User.findByPk(user.id);

    res.status(201).json({
      success: true,
      message: 'Corporate user created successfully',
      data: createdUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create corporate user',
      error: error.message
    });
  }
};

// Update corporate user
export const updateCorporateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, email, username } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({
      first_name,
      email,
      username
    });

    const updatedUser = await User.findByPk(id);

    res.json({
      success: true,
      message: 'Corporate user updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update corporate user',
      error: error.message
    });
  }
};

// Reset corporate user password
export const resetCorporatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ password });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

/**
 * ============================================
 * CREATE APP USER (CLIENT)
 * ============================================
 */
export const createAppUser = async (req, res) => {
  try {
    const { id } = req.params; // app id (group_create.id)

    // Get app details
    const app = await GroupCreate.findByPk(id);
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'App not found'
      });
    }

    // Find 'client' group
    const clientGroup = await Group.findOne({
      where: { name: 'client' }
    });

    if (!clientGroup) {
      return res.status(500).json({
        success: false,
        message: 'Client group not found. Please contact administrator.'
      });
    }

    // Generate username from app name (lowercase, no spaces)
    const username = app.name.toLowerCase().replace(/\s+/g, '');

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { username: username }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `User with username "${username}" already exists`
      });
    }

    // Get client IP address from request
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    // Clean IPv6 prefix if present
    const cleanIp = ipAddress.replace(/^::ffff:/, '');

    // Create user with password '123456'
    // users table: id, ip_address, username, password, email, active, group_id
    const user = await User.create({
      ip_address: cleanIp,
      username: username,
      password: '123456', // Will be hashed by User model hook
      email: `${username}@client.com`,
      active: 1,
      group_id: app.id, // Set group_id to app.id (group_create.id)
      created_on: Math.floor(Date.now() / 1000)
    });

    // Create user-group association in users_groups table
    await UserGroup.create({
      user_id: user.id,
      group_id: clientGroup.id // Link to 'client' group
    });

    res.status(201).json({
      success: true,
      message: 'Client user created successfully',
      data: {
        user_id: user.id,
        ip_address: cleanIp,
        username: username,
        password: '123456',
        email: `${username}@client.com`,
        active: 1,
        group_id: app.id,
        app_name: app.name
      }
    });

  } catch (error) {
    console.error('Error creating app user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

/**
 * ============================================
 * CUSTOM FORM BUILDER
 * ============================================
 */
export const saveCustomForm = async (req, res) => {
  try {
    const { id } = req.params; // app id
    const { form_name, fields } = req.body;

    // Validate
    if (!form_name || !fields || fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Form name and fields are required'
      });
    }

    // Store form configuration as JSON in database
    // You can create a new table 'app_custom_forms' or store in create_details
    // For now, let's store in create_details as a JSON field

    const app = await GroupCreate.findByPk(id);
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'App not found'
      });
    }

    // Get or create create_details
    let details = await CreateDetails.findOne({ where: { create_id: id } });

    if (!details) {
      details = await CreateDetails.create({
        create_id: id,
        custom_form: JSON.stringify({ form_name, fields })
      });
    } else {
      await details.update({
        custom_form: JSON.stringify({ form_name, fields })
      });
    }

    res.json({
      success: true,
      message: 'Custom form saved successfully',
      data: {
        form_name,
        fields_count: fields.length
      }
    });

  } catch (error) {
    console.error('Error saving custom form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save custom form',
      error: error.message
    });
  }
};

export const getCustomForm = async (req, res) => {
  try {
    const { id } = req.params; // app id

    const details = await CreateDetails.findOne({ where: { create_id: id } });

    if (!details || !details.custom_form) {
      return res.json({
        success: true,
        data: null
      });
    }

    const formData = JSON.parse(details.custom_form);

    res.json({
      success: true,
      data: formData
    });

  } catch (error) {
    console.error('Error getting custom form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get custom form',
      error: error.message
    });
  }
};

/**
 * ============================================
 * APP LOGIN ENDPOINTS
 * ============================================
 */

// Get apps for login page (public endpoint)
export const getAppsForLogin = async (req, res) => {
  try {
    // Get all apps with their details
    const apps = await GroupCreate.findAll({
      include: [{
        model: CreateDetails,
        as: 'details',
        attributes: ['logo']
      }],
      order: [['order_by', 'ASC'], ['name', 'ASC']]
    });

    const appsData = apps.map(app => ({
      id: app.id,
      name: app.name,
      logo: app.details?.logo || null
    }));

    res.json({
      success: true,
      data: appsData
    });

  } catch (error) {
    console.error('Error getting apps for login:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get apps',
      error: error.message
    });
  }
};

// Get apps for admin login page - only apps that have users (public endpoint)
export const getAppsForAdminLogin = async (req, res) => {
  try {
    // Get all apps with their details and check if they have users
    const apps = await GroupCreate.findAll({
      include: [{
        model: CreateDetails,
        as: 'details',
        attributes: ['logo']
      }],
      order: [['order_by', 'ASC'], ['name', 'ASC']]
    });

    // Filter apps that have users (where users.group_id = app.id)
    const appsWithUsers = [];

    for (const app of apps) {
      const userCount = await User.count({
        where: { group_id: app.id }
      });

      if (userCount > 0) {
        appsWithUsers.push({
          id: app.id,
          name: app.name,
          logo: app.details?.logo || null,
          user_count: userCount
        });
      }
    }

    res.json({
      success: true,
      data: appsWithUsers
    });

  } catch (error) {
    console.error('Error getting apps for admin login:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get apps',
      error: error.message
    });
  }
};

// App login endpoint
export const appLogin = async (req, res) => {
  try {
    const { app_id, username, password } = req.body;

    console.log('App Login Request:', { app_id, username, password_length: password?.length });

    // Validate input
    if (!app_id || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'App ID, username, and password are required'
      });
    }

    // Find user by username with groups
    const user = await User.findOne({
      where: { username: username },
      include: [{
        model: Group,
        as: 'groups',
        through: { attributes: [] }
      }]
    });

    console.log('User found:', user ? { id: user.id, username: user.username, group_id: user.group_id, active: user.active } : 'No user found');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Verify password first
    console.log('Verifying password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check user roles
    const userRoles = user.groups ? user.groups.map(g => g.name) : [];
    const isPartner = userRoles.includes('partner');

    // Get app details
    const app = await GroupCreate.findByPk(app_id);

    // If user is a partner, check if they belong to this app and redirect to partner dashboard
    if (isPartner) {
      // Partners should have group_id matching the app_id
      if (user.group_id !== parseInt(app_id)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this app'
        });
      }

      // Check if partner account is active (active can be 0 for pending)
      // Partners with active=0 can still login but see pending message

      // Generate JWT tokens for partner
      const accessToken = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          group_id: user.group_id,
          appId: app_id,
          appName: app?.name,
          role: 'partner'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        { expiresIn: '7d' }
      );

      // Update last login
      await user.update({
        last_login: Math.floor(Date.now() / 1000)
      });

      // Store selected app for partner
      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            app_id: app_id,
            app_name: app?.name,
            active: user.active,
            role: 'partner'
          },
          selectedApp: {
            id: app?.id,
            name: app?.name
          },
          dashboardRoute: '/dashboard/partner',
          isPartner: true
        }
      });
    }

    // For non-partner users (app admins), check if user is active
    if (user.active !== 1) {
      console.log('User is inactive:', user.active);
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact administrator.'
      });
    }

    // Check if user belongs to this app (group_id should match app_id)
    console.log('Checking group_id:', { user_group_id: user.group_id, app_id: parseInt(app_id), match: user.group_id === parseInt(app_id) });
    if (user.group_id !== parseInt(app_id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this app'
      });
    }

    // Generate JWT tokens for app admin
    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        group_id: user.group_id,
        appId: app_id,
        appName: app?.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' }
    );

    // Update last login
    await user.update({
      last_login: Math.floor(Date.now() / 1000)
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          app_id: app_id,
          app_name: app?.name
        },
        dashboardRoute: `/app/${app_id}/dashboard`
      }
    });

  } catch (error) {
    console.error('Error in app login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * ============================================
 * PARTNERS MANAGEMENT
 * ============================================
 */

// Get app info by ID
export const getAppById = async (req, res) => {
  try {
    const { appId } = req.params;

    const app = await GroupCreate.findByPk(appId, {
      include: [{ model: CreateDetails, as: 'details' }]
    });

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'App not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: app.id,
        name: app.name,
        logo: app.details?.logo || null
      }
    });
  } catch (error) {
    console.error('Error fetching app:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch app',
      error: error.message
    });
  }
};

// Get partners for an app
export const getAppPartners = async (req, res) => {
  try {
    const { appId } = req.params;

    // Fetch the form definition from create_details
    const appDetails = await CreateDetails.findOne({
      where: { create_id: appId }
    });

    let formDefinition = null;
    if (appDetails?.custom_form) {
      try {
        formDefinition = typeof appDetails.custom_form === 'string'
          ? JSON.parse(appDetails.custom_form)
          : appDetails.custom_form;
      } catch (e) {
        console.error('Error parsing custom_form:', e);
      }
    }

    // Query ClientRegistration as the primary source and include User data
    const clientRegistrations = await ClientRegistration.findAll({
      where: { group_id: appId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'identification_code', 'email', 'active', 'created_on', 'first_name', 'last_name', 'phone']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Collect all unique IDs for mapped fields to resolve them in bulk
    const countryIds = new Set();
    const stateIds = new Set();
    const districtIds = new Set();

    // Parse custom_form_data and collect mapped field IDs
    const registrationsWithParsedData = clientRegistrations
      .filter(reg => reg.user)
      .map(reg => {
        let customFormData = reg.custom_form_data || {};

        // Parse if it's a string
        if (typeof customFormData === 'string') {
          try {
            customFormData = JSON.parse(customFormData);
          } catch (e) {
            customFormData = {};
          }
        }

        // Collect mapped field IDs for resolution
        if (formDefinition?.fields) {
          formDefinition.fields.forEach(field => {
            const value = customFormData[field.id];
            if (value && field.mapping) {
              const numericValue = parseInt(value, 10);
              if (!isNaN(numericValue)) {
                if (field.mapping === 'country') countryIds.add(numericValue);
                if (field.mapping === 'state') stateIds.add(numericValue);
                if (field.mapping === 'district') districtIds.add(numericValue);
              }
            }
          });
        }

        return { reg, customFormData };
      });

    // Fetch mapped values in bulk
    const [countries, states, districts] = await Promise.all([
      countryIds.size > 0 ? Country.findAll({ where: { id: Array.from(countryIds) } }) : [],
      stateIds.size > 0 ? State.findAll({ where: { id: Array.from(stateIds) } }) : [],
      districtIds.size > 0 ? District.findAll({ where: { id: Array.from(districtIds) } }) : []
    ]);

    // Create lookup maps
    const countryMap = new Map(countries.map(c => [c.id, c.country]));
    const stateMap = new Map(states.map(s => [s.id, s.state]));
    const districtMap = new Map(districts.map(d => [d.id, d.district]));

    // Build partner data with resolved values
    const partnersData = registrationsWithParsedData.map(({ reg, customFormData }) => {
      // Create resolved custom_form_data with both raw and resolved values
      const resolvedFormData = {};

      if (formDefinition?.fields) {
        formDefinition.fields.forEach(field => {
          const rawValue = customFormData[field.id];
          let resolvedValue = rawValue;

          if (rawValue && field.mapping) {
            const numericValue = parseInt(rawValue, 10);
            if (!isNaN(numericValue)) {
              if (field.mapping === 'country') resolvedValue = countryMap.get(numericValue) || rawValue;
              if (field.mapping === 'state') resolvedValue = stateMap.get(numericValue) || rawValue;
              if (field.mapping === 'district') resolvedValue = districtMap.get(numericValue) || rawValue;
            }
          }

          resolvedFormData[field.id] = {
            raw: rawValue,
            resolved: resolvedValue,
            label: field.placeholder || field.label || field.id,
            fieldType: field.field_type,
            mapping: field.mapping || null,
            options: field.options || null,
            order: field.order
          };
        });
      } else {
        // No form definition, just return raw data
        Object.entries(customFormData).forEach(([key, value]) => {
          resolvedFormData[key] = {
            raw: value,
            resolved: value,
            label: key,
            fieldType: 'text',
            mapping: null,
            options: null,
            order: 0
          };
        });
      }

      return {
        id: reg.user.id,
        identification_code: reg.user.identification_code,
        email: reg.user.email,
        active: reg.user.active,
        created_on: reg.user.created_on,
        first_name: reg.user.first_name,
        last_name: reg.user.last_name,
        phone: reg.user.phone,
        client_registration: {
          id: reg.id,
          status: reg.status,
          custom_form_data: customFormData,
          resolved_form_data: resolvedFormData
        }
      };
    });

    res.json({
      success: true,
      data: partnersData,
      form_definition: formDefinition
    });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partners',
      error: error.message
    });
  }
};

// Update partner status
export const updatePartnerStatus = async (req, res) => {
  try {
    const { appId, partnerId } = req.params;
    const { active } = req.body;

    // Find the partner
    const partner = await User.findOne({
      where: { id: partnerId, group_id: appId }
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Update user active status
    await partner.update({ active });

    // Update client_registration status
    const newStatus = active === 1 ? 'active' : 'inactive';
    await ClientRegistration.update(
      { status: newStatus },
      { where: { user_id: partnerId, group_id: appId } }
    );

    res.json({
      success: true,
      message: `Partner ${active === 1 ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: partner.id,
        active: active
      }
    });
  } catch (error) {
    console.error('Error updating partner status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update partner status',
      error: error.message
    });
  }
};

// Update partner details (custom_form_data and user info)
export const updatePartnerDetails = async (req, res) => {
  try {
    const { appId, partnerId } = req.params;
    const { email, custom_form_data } = req.body;

    // Find the partner user
    const partner = await User.findOne({
      where: { id: partnerId, group_id: appId }
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Update user email if provided
    if (email && email !== partner.email) {
      // Check if email is already in use by another user
      const existingUser = await User.findOne({
        where: { email, id: { [Op.ne]: partnerId } }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another user'
        });
      }
      await partner.update({ email });
    }

    // Update custom_form_data in client_registration
    if (custom_form_data) {
      const clientReg = await ClientRegistration.findOne({
        where: { user_id: partnerId, group_id: appId }
      });

      if (clientReg) {
        await clientReg.update({
          custom_form_data,
          updated_at: new Date()
        });
      } else {
        // Create client_registration if it doesn't exist
        await ClientRegistration.create({
          user_id: partnerId,
          group_id: appId,
          custom_form_data,
          status: partner.active === 1 ? 'active' : 'inactive'
        });
      }
    }

    // Fetch updated data
    const updatedPartner = await User.findOne({
      where: { id: partnerId, group_id: appId },
      include: [{
        model: ClientRegistration,
        as: 'clientRegistration',
        where: { group_id: appId },
        required: false
      }]
    });

    res.json({
      success: true,
      message: 'Partner details updated successfully',
      data: {
        id: updatedPartner.id,
        identification_code: updatedPartner.identification_code,
        email: updatedPartner.email,
        active: updatedPartner.active,
        created_on: updatedPartner.created_on,
        client_registration: updatedPartner.clientRegistration ? {
          id: updatedPartner.clientRegistration.id,
          status: updatedPartner.clientRegistration.status,
          custom_form_data: updatedPartner.clientRegistration.custom_form_data || {}
        } : null
      }
    });
  } catch (error) {
    console.error('Error updating partner details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update partner details',
      error: error.message
    });
  }
};

/**
 * ============================================
 * PARTNER PORTAL ACCESS
 * ============================================
 */

// Generate access token for admin to access partner portal
export const generatePartnerPortalAccess = async (req, res) => {
  try {
    const { partner_id, app_id } = req.body;

    if (!partner_id || !app_id) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID and App ID are required'
      });
    }

    // Find the partner user
    const partner = await User.findByPk(partner_id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Generate tokens for the partner
    const accessToken = jwt.sign(
      { userId: partner.id, groupId: app_id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: partner.id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Partner portal access granted',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: partner.id,
          username: partner.username,
          email: partner.email,
          first_name: partner.first_name,
          identification_code: partner.identification_code
        }
      }
    });
  } catch (error) {
    console.error('Error generating partner portal access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate partner portal access',
      error: error.message
    });
  }
};

/**
 * ============================================
 * MEDIA CHANNEL MANAGEMENT
 * ============================================
 */

// Get media channels by app_id and category_id
export const getMediaChannels = async (req, res) => {
  try {
    const { app_id, category_id } = req.query;

    if (!app_id || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'app_id and category_id are required'
      });
    }

    const { MediaChannel, Language, Country, State, District } = await import('../models/index.js');

    const channels = await MediaChannel.findAll({
      where: {
        app_id: app_id,
        category_id: category_id
      },
      include: [
        {
          model: Language,
          as: 'language',
          attributes: ['id', 'lang_1', 'lang_2'],
          required: false
        },
        {
          model: Country,
          as: 'country',
          attributes: ['id', 'country'],
          required: false
        },
        {
          model: State,
          as: 'state',
          attributes: ['id', 'state'],
          required: false
        },
        {
          model: District,
          as: 'district',
          attributes: ['id', 'district'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: channels
    });
  } catch (error) {
    console.error('Error fetching media channels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media channels',
      error: error.message
    });
  }
};

// Update media channel status
export const updateMediaChannelStatus = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const { MediaChannel } = await import('../models/index.js');

    const channel = await MediaChannel.findByPk(channelId);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Media channel not found'
      });
    }

    await channel.update({ status });

    res.json({
      success: true,
      message: 'Media channel status updated successfully',
      data: channel
    });
  } catch (error) {
    console.error('Error updating media channel status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update media channel status',
      error: error.message
    });
  }
};

// Update media channel is_active
export const updateMediaChannelActive = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { is_active } = req.body;

    if (![0, 1].includes(is_active)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid is_active value'
      });
    }

    const { MediaChannel } = await import('../models/index.js');

    const channel = await MediaChannel.findByPk(channelId);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Media channel not found'
      });
    }

    await channel.update({ is_active });

    res.json({
      success: true,
      message: 'Media channel active status updated successfully',
      data: channel
    });
  } catch (error) {
    console.error('Error updating media channel active status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update media channel active status',
      error: error.message
    });
  }
};

