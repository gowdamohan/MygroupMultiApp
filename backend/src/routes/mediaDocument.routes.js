import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import {
  getUploadCategories,
  getDocuments,
  uploadDocument,
  deleteDocument,
  getUploadPresignedUrl
} from '../controllers/mediaDocumentController.js';

const router = express.Router();

// Configure multer for memory storage (for Wasabi upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size for PDFs
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Get upload categories (category_type = 'upload_data')
router.get('/upload-categories/:channelId', authenticateToken, getUploadCategories);

// Get documents for a specific channel, category, year, month
router.get('/documents/:channelId/:categoryId/:year/:month', authenticateToken, getDocuments);

// Upload a document
router.post('/upload/:channelId', authenticateToken, upload.single('document'), uploadDocument);

// Delete a document
router.delete('/document/:documentId', authenticateToken, deleteDocument);

// Get presigned URL for direct upload
router.post('/presigned-url/:channelId', authenticateToken, getUploadPresignedUrl);

export default router;

