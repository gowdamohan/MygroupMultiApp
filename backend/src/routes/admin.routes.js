import express from 'express';
import {
  getContinents,
  createContinent,
  updateContinent,
  deleteContinent,
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  updateCountryLocking,
  getStates,
  createState,
  updateState,
  deleteState,
  getDistricts,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  getLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  getEducation,
  createEducation,
  updateEducation,
  deleteEducation,
  getProfessions,
  createProfession,
  updateProfession,
  deleteProfession,
  getCreatedApps,
  createApp,
  updateApp,
  deleteApp,
  getAppCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCorporateUser,
  createCorporateUser,
  updateCorporateUser,
  resetCorporatePassword,
  createAppUser,
  saveCustomForm,
  getCustomForm,
  getAppsForLogin,
  getAppsForAdminLogin,
  appLogin,
  getAppById,
  getAppPartners,
  updatePartnerStatus,
  updatePartnerDetails,
  generatePartnerPortalAccess,
  getMediaChannels,
  updateMediaChannelStatus,
  updateMediaChannelActive
} from '../controllers/adminController.js';
import {
  getAccountsUsers,
  createAccountsUser,
  updateAccountsUser,
  resetAccountsUserPassword,
  toggleAccountsUserStatus
} from '../controllers/accountsUserController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadAppImages } from '../middleware/upload.js';

const router = express.Router();

/**
 * ============================================
 * PUBLIC ROUTES (No authentication required)
 * ============================================
 */
// Get apps for login page
router.get('/apps-login', getAppsForLogin);

// Get apps for admin login page (only apps with users)
router.get('/apps-admin-login', getAppsForAdminLogin);

// App login
router.post('/app-login', appLogin);

/**
 * ============================================
 * PROTECTED ROUTES (Authentication required)
 * ============================================
 */
// All routes below require authentication
router.use(authenticate);

/**
 * ============================================
 * CONTINENT ROUTES
 * ============================================
 */
router.get('/continents', getContinents);
router.post('/continents', createContinent);
router.put('/continents/:id', updateContinent);
router.delete('/continents/:id', deleteContinent);

/**
 * ============================================
 * COUNTRY ROUTES
 * ============================================
 */
router.get('/countries', getCountries);
router.post('/countries', createCountry);
router.put('/countries/:id', updateCountry);
router.delete('/countries/:id', deleteCountry);
router.put('/countries/:id/locking', updateCountryLocking);

/**
 * ============================================
 * STATE ROUTES
 * ============================================
 */
router.get('/states', getStates);
router.post('/states', createState);
router.put('/states/:id', updateState);
router.delete('/states/:id', deleteState);

/**
 * ============================================
 * DISTRICT ROUTES
 * ============================================
 */
router.get('/districts', getDistricts);
router.post('/districts', createDistrict);
router.put('/districts/:id', updateDistrict);
router.delete('/districts/:id', deleteDistrict);

/**
 * ============================================
 * LANGUAGE ROUTES
 * ============================================
 */
router.get('/languages', getLanguages);
router.post('/languages', createLanguage);
router.put('/languages/:id', updateLanguage);
router.delete('/languages/:id', deleteLanguage);

/**
 * ============================================
 * EDUCATION ROUTES
 * ============================================
 */
router.get('/education', getEducation);
router.post('/education', createEducation);
router.put('/education/:id', updateEducation);
router.delete('/education/:id', deleteEducation);

/**
 * ============================================
 * PROFESSION ROUTES
 * ============================================
 */
router.get('/professions', getProfessions);
router.post('/professions', createProfession);
router.put('/professions/:id', updateProfession);
router.delete('/professions/:id', deleteProfession);

/**
 * ============================================
 * CREATE APPS ROUTES
 * ============================================
 */
router.get('/apps', getCreatedApps);
router.post('/apps', uploadAppImages, createApp);
router.put('/apps/:id', uploadAppImages, updateApp);
router.delete('/apps/:id', deleteApp);

// Create app user (client)
router.post('/apps/:id/create-user', createAppUser);

// Custom form builder
router.post('/apps/:id/custom-form', saveCustomForm);
router.get('/apps/:id/custom-form', getCustomForm);

/**
 * ============================================
 * APP CATEGORIES ROUTES
 * ============================================
 */
router.get('/apps/:appId/categories', getAppCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

/**
 * ============================================
 * CORPORATE LOGIN ROUTES
 * ============================================
 */
router.get('/corporate-user', getCorporateUser);
router.post('/corporate-user', createCorporateUser);
router.put('/corporate-user/:id', updateCorporateUser);
router.post('/corporate-user/:id/reset-password', resetCorporatePassword);

/**
 * ============================================
 * PARTNERS ROUTES
 * ============================================
 */
router.get('/apps/:appId', getAppById);
router.get('/apps/:appId/partners', getAppPartners);
router.patch('/apps/:appId/partners/:partnerId/status', updatePartnerStatus);
router.put('/apps/:appId/partners/:partnerId', updatePartnerDetails);

// Partner portal access
router.post('/partner-portal-access', generatePartnerPortalAccess);

/**
 * ============================================
 * MEDIA CHANNEL ROUTES
 * ============================================
 */
router.get('/media-channels', getMediaChannels);
router.put('/media-channels/:channelId/status', updateMediaChannelStatus);
router.put('/media-channels/:channelId/active', updateMediaChannelActive);

/**
 * ============================================
 * ACCOUNTS USER ROUTES
 * ============================================
 */
router.get('/accounts-users', getAccountsUsers);
router.post('/accounts-users', createAccountsUser);
router.put('/accounts-users/:id', updateAccountsUser);
router.post('/accounts-users/:id/reset-password', resetAccountsUserPassword);
router.patch('/accounts-users/:id/status', toggleAccountsUserStatus);

export default router;
