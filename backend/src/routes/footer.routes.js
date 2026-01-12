import express from 'express';
import {
  getFooterPageByType,
  saveFooterPage,
  getSocialMediaLinks,
  saveSocialMediaLink,
  deleteSocialMediaLink,
  getGalleries,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGallery,
  getGalleryImages,
  addGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  getFooterLinks,
  createFooterLink,
  updateFooterLink,
  deleteFooterLink,
  toggleFooterLinkStatus
} from '../controllers/footerController.js';

const router = express.Router();

// Footer Page Routes
router.get('/page/:pageType', getFooterPageByType);
router.post('/page', saveFooterPage);

// Social Media Links Routes
router.get('/social-media', getSocialMediaLinks);
router.post('/social-media', saveSocialMediaLink);
router.delete('/social-media/:id', deleteSocialMediaLink);

// Gallery Routes
router.get('/galleries', getGalleries);
router.get('/galleries/:id', getGalleryById);
router.post('/galleries', createGallery);
router.put('/galleries/:id', updateGallery);
router.delete('/galleries/:id', deleteGallery);

// Gallery Images Routes
router.get('/galleries/:galleryId/images', getGalleryImages);
router.post('/gallery-images', addGalleryImage);
router.put('/gallery-images/:id', updateGalleryImage);
router.delete('/gallery-images/:id', deleteGalleryImage);

// Footer Links Routes
router.get('/links', getFooterLinks);
router.post('/links', createFooterLink);
router.put('/links/:id', updateFooterLink);
router.delete('/links/:id', deleteFooterLink);
router.patch('/links/:id/status', toggleFooterLinkStatus);

export default router;

