import express from 'express';
import multer from 'multer';
import { getOfferAds, createOfferAds, createOfferAdsByUrl, saveOfferAdRow, deleteOfferAd } from '../controllers/franchiseOfferAdsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

router.get('/', authenticate, getOfferAds);
router.post('/by-url', authenticate, createOfferAdsByUrl);
router.post('/', authenticate, upload.array('images', 20), createOfferAds);
// Save one row (upsert): JSON body with image_url, or multipart with image file
router.post('/save-row', authenticate, (req, res, next) => {
  if (req.is('multipart/form-data')) {
    upload.single('image')(req, res, next);
  } else {
    next();
  }
}, saveOfferAdRow);
router.delete('/:id', authenticate, deleteOfferAd);

export default router;
