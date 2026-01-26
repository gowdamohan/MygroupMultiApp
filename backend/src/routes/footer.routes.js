import express from 'express';
import multer from 'multer';
import {
  getFooterPageByType,
  saveFooterPage,
  getFooterPagesByType,
  createFooterPageEntry,
  updateFooterPageEntry,
  deleteFooterPageEntry,
  getFooterPageImages,
  addFooterPageImage,
  deleteFooterPageImage,
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
  toggleFooterLinkStatus,
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq
} from '../controllers/footerController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Public route - no authentication required
router.get('/social-media', getSocialMediaLinks);

router.use(authenticate);

// Footer Page Routes
router.get('/page/:pageType', getFooterPageByType);
router.post('/page', upload.single('image'), saveFooterPage);

// Footer Page Multi-entry Routes
router.get('/pages', getFooterPagesByType);
router.post('/pages', upload.single('image'), createFooterPageEntry);
router.put('/pages/:id', upload.single('image'), updateFooterPageEntry);
router.delete('/pages/:id', deleteFooterPageEntry);

// Footer Page Images Routes
router.get('/page-images', getFooterPageImages);
router.post('/page-images', upload.single('image'), addFooterPageImage);
router.delete('/page-images/:id', deleteFooterPageImage);

// Social Media Links Routes (GET is public above; POST/DELETE require auth)
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
router.post('/gallery-images', upload.array('images', 20), addGalleryImage);
router.put('/gallery-images/:id', updateGalleryImage);
router.delete('/gallery-images/:id', deleteGalleryImage);

// Footer Links Routes
router.get('/links', getFooterLinks);
router.post('/links', createFooterLink);
router.put('/links/:id', updateFooterLink);
router.delete('/links/:id', deleteFooterLink);
router.patch('/links/:id/status', toggleFooterLinkStatus);

// FAQ Routes
router.get('/faq', getFaqs);
router.post('/faq', createFaq);
router.put('/faq/:id', updateFaq);
router.delete('/faq/:id', deleteFaq);

export default router;

