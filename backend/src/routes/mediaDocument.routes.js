import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import {
  getUploadCategories,
  getDocuments,
  getLastUploadedDocument,
  uploadDocument,
  deleteDocument,
  getUploadPresignedUrl,
  getDocumentProcessingStatus,
} from '../controllers/mediaDocumentController.js';

const router = express.Router();

const MEDIA_DOCUMENT_MAX_SIZE = 200 * 1024 * 1024; // 200MB

const ALLOWED_DOCUMENT_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

// Configure multer for memory storage (for Wasabi upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MEDIA_DOCUMENT_MAX_SIZE
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_DOCUMENT_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF or image files (JPG, PNG, WebP) are allowed'));
    }
  }
});

const handleMediaDocumentMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File size exceeds 200MB limit'
    });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// Get upload categories (category_type = 'upload_data')
router.get('/upload-categories/:channelId', authenticateToken, getUploadCategories);

// Get documents for a specific channel, category, year, month
router.get('/documents/:channelId/:categoryId/:year/:month', authenticateToken, getDocuments);

// Get most recently uploaded document for a channel + category
router.get('/last-uploaded/:channelId/:categoryId', authenticateToken, getLastUploadedDocument);

// Upload a document
router.post(
  '/upload/:channelId',
  authenticateToken,
  (req, res, next) => {
    upload.single('document')(req, res, (err) => {
      if (err) return handleMediaDocumentMulterError(err, req, res, next);
      next();
    });
  },
  uploadDocument
);

// Get processing status (poll after upload)
router.get('/processing-status/:documentId', authenticateToken, getDocumentProcessingStatus);

// Delete a document
router.delete('/document/:documentId', authenticateToken, deleteDocument);

// Get presigned URL for direct upload
router.post('/presigned-url/:channelId', authenticateToken, getUploadPresignedUrl);

export default router;

