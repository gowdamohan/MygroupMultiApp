import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Wasabi S3 Configuration
const WASABI_ACCESS_KEY = 'A5HOIXWOUJUN7UYIB8KE';
const WASABI_SECRET_KEY = 'cFAHTLmoRFw0dXznADJpOHpzmIAUH7e6IPWVY181';
const WASABI_ENDPOINT = 'https://s3.us-west-1.wasabisys.com';
const WASABI_BUCKET = 'news-server';
const WASABI_BASE_URL = 'https://s3.us-west-1.wasabisys.com/news-server';

// Create S3 Client for Wasabi
const s3Client = new S3Client({
  endpoint: WASABI_ENDPOINT,
  region: 'us-west-1',
  credentials: {
    accessKeyId: WASABI_ACCESS_KEY,
    secretAccessKey: WASABI_SECRET_KEY,
  },
  forcePathStyle: true, // Required for Wasabi
});

export const WASABI_PUBLIC_BASE_URL = WASABI_BASE_URL;

/**
 * Upload file to Wasabi S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File mime type
 * @param {string} folder - Folder path (e.g., 'media_documents/channel_1/2024/01')
 * @returns {Object} - Upload result with path and public URL
 */
export const uploadFile = async (fileBuffer, fileName, mimeType, folder = '') => {
  try {
    const ext = fileName.split('.').pop();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const key = folder ? `${folder}/${uniqueName}` : uniqueName;

    const command = new PutObjectCommand({
      Bucket: WASABI_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    return {
      success: true,
      fileName: key,
      publicUrl: `${WASABI_BASE_URL}/${key}`,
    };
  } catch (error) {
    console.error('Wasabi upload error:', error);
    throw error;
  }
};

/**
 * Delete file from Wasabi S3
 * @param {string} filePath - File path/key to delete
 * @returns {Object} - Delete result
 */
export const deleteFile = async (filePath) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: WASABI_BUCKET,
      Key: filePath,
    });

    await s3Client.send(command);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  } catch (error) {
    console.error('Wasabi delete error:', error);
    throw error;
  }
};

/**
 * Get signed URL for file upload (presigned URL)
 * @param {string} fileName - Original file name
 * @param {string} fileType - File mime type
 * @param {string} folder - Folder path
 * @returns {Object} - Signed URL details
 */
export const getPresignedUrl = async (fileName, fileType, folder = '') => {
  try {
    const ext = fileName.split('.').pop();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const key = folder ? `${folder}/${uniqueName}` : uniqueName;

    const command = new PutObjectCommand({
      Bucket: WASABI_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 1200 }); // 20 minutes

    return {
      success: true,
      path: key,
      signedUrl,
      publicUrl: `${WASABI_BASE_URL}/${key}`,
    };
  } catch (error) {
    console.error('Wasabi presigned URL error:', error);
    throw error;
  }
};

/**
 * Get signed URL for reading/downloading file
 * @param {string} filePath - File path/key
 * @param {number} expiresIn - Expiration time in seconds (default 3600 = 1 hour)
 * @returns {Object} - Signed URL for reading
 */
export const getSignedReadUrl = async (filePath, expiresIn = 3600, options = {}) => {
  try {
    const commandParams = {
      Bucket: WASABI_BUCKET,
      Key: filePath,
    };

    if (options.inline) {
      const filename = (options.filename || filePath.split('/').pop() || 'document.pdf')
        .replace(/"/g, '');
      commandParams.ResponseContentDisposition = `inline; filename="${filename}"`;
      if (options.contentType) {
        commandParams.ResponseContentType = options.contentType;
      }
    }

    const command = new GetObjectCommand(commandParams);

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      success: true,
      signedUrl,
    };
  } catch (error) {
    console.error('Wasabi signed read URL error:', error);
    throw error;
  }
};

/**
 * Stream an object from Wasabi (for same-origin PDF proxy).
 */
export const getObjectStream = async (filePath) => {
  const command = new GetObjectCommand({
    Bucket: WASABI_BUCKET,
    Key: filePath,
  });
  return s3Client.send(command);
};

/**
 * Download a Wasabi object into a Buffer (for background PDF page splitting).
 */
export const getObjectBuffer = async (filePath) => {
  const response = await getObjectStream(filePath);
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

/** Extract Wasabi object key from a key string or full bucket URL. */
export const extractWasabiKey = (pathOrUrl) => {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return null;
  const trimmed = pathOrUrl.trim();
  if (!trimmed || trimmed.startsWith('/uploads/')) return null;

  const base = `${WASABI_BASE_URL}/`;
  if (trimmed.startsWith(base)) {
    return trimmed.slice(base.length).split('?')[0] || null;
  }

  if (/^https?:\/\//i.test(trimmed)) return null;

  return trimmed.replace(/^\/+/, '') || null;
};

/**
 * Resolve a stored path/key/URL to a browser-loadable URL.
 * Wasabi objects use signed URLs (this account disallows public object access).
 */
export const resolveStorageReadUrl = async (pathOrUrl, expiresIn = 3600) => {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return null;
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/uploads/')) return trimmed;

  const wasabiKey = extractWasabiKey(trimmed);
  if (wasabiKey) {
    try {
      const isPdf = /\.pdf($|\?)/i.test(wasabiKey) || wasabiKey.toLowerCase().includes('.pdf');
      const signOptions = isPdf
        ? { inline: true, contentType: 'application/pdf', filename: wasabiKey.split('/').pop() }
        : {};
      const { signedUrl } = await getSignedReadUrl(wasabiKey, expiresIn, signOptions);
      if (signedUrl) return signedUrl;
    } catch (error) {
      console.error('Wasabi signed read URL failed:', error.message);
    }
    return trimmed.startsWith('http') ? trimmed : `${WASABI_BASE_URL}/${wasabiKey}`;
  }

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed;
};

export default {
  uploadFile,
  deleteFile,
  getPresignedUrl,
  getSignedReadUrl,
  getObjectStream,
  getObjectBuffer,
  extractWasabiKey,
  resolveStorageReadUrl,
  WASABI_PUBLIC_BASE_URL,
};

