import express from 'express';
import multer from 'multer';
import { getOfferAds, createOfferAds, deleteOfferAd } from '../controllers/franchiseOfferAdsController.js';
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
router.post('/', authenticate, upload.array('images', 20), createOfferAds);
router.delete('/:id', authenticate, deleteOfferAd);

export default router;
