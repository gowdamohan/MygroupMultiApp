import express from 'express';
import multer from 'multer';
import { getMainAds, saveMainAd, saveSideAd } from '../controllers/mainAdsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
});

const optionalUpload = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    upload.single('image')(req, res, next);
  } else {
    next();
  }
};

router.get('/', authenticate, getMainAds);
router.post('/save-main', authenticate, optionalUpload, saveMainAd);
router.post('/save-side/:slot', authenticate, optionalUpload, saveSideAd);

export default router;
