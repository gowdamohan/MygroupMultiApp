import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsRoot = path.join(__dirname, '../../public/uploads');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};
ensureDir(uploadsRoot);

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, svg, webp)'));
};

const createStorage = (subfolder = 'apps') => {
  const dir = path.join(uploadsRoot, subfolder);
  ensureDir(dir);
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });
};

const createUploader = (fields, subfolder) => multer({
  storage: createStorage(subfolder),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter
}).fields(fields);

// Middleware for uploading app images (icon, logo, name_image)
export const uploadAppImages = createUploader([
  { name: 'icon', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'name_image', maxCount: 1 }
], 'apps');

// Middleware for uploading country assets (flag, currency icon)
export const uploadCountryAssets = createUploader([
  { name: 'country_flag', maxCount: 1 },
  { name: 'currency_icon', maxCount: 1 }
], 'geo');

// Helper function to delete old files
export const deleteFile = (filePath) => {
  if (!filePath) return;

  const cleanedPath = filePath.replace(/^\/+/, '');
  const normalizedPath = (cleanedPath.startsWith('uploads'))
    ? path.join(__dirname, '../../public', cleanedPath)
    : filePath;

  if (fs.existsSync(normalizedPath)) {
    fs.unlinkSync(normalizedPath);
  }
};

// Default export kept for compatibility (uses apps folder)
const upload = multer({
  storage: createStorage('apps'),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter
});

export default upload;

