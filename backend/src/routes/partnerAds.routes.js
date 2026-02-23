import express from 'express';
import multer from 'multer';
import { getPartnerAds, savePartnerAdRow, deletePartnerAd } from '../controllers/partnerAdsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image and video files are allowed'));
  }
});

router.get('/', authenticate, getPartnerAds);
router.post('/save-row', authenticate, (req, res, next) => {
  if (req.is('multipart/form-data')) {
    upload.single('image')(req, res, next);
  } else {
    next();
  }
}, savePartnerAdRow);
router.delete('/:id', authenticate, deletePartnerAd);

export default router;

