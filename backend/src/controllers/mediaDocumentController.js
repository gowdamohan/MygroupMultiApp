import { MediaChannelDocument, MediaChannel, AppCategory, User } from '../models/index.js';
import { uploadFile, deleteFile, getPresignedUrl, resolveStorageReadUrl } from '../services/wasabiService.js';
import {
  processDocumentPagesJob,
  getProcessingJob,
} from '../services/documentProcessingService.js';
import { listPageKeys, parsePagesJson } from '../services/pdfPagesService.js';

/**
 * Best-effort delete of PDF + all split page objects from Wasabi.
 */
async function deleteDocumentStorage(doc) {
  if (!doc) return;
  if (doc.document_path) {
    try { await deleteFile(doc.document_path); } catch (err) {
      console.error('Error deleting document_path from Wasabi:', err.message);
    }
  }
  for (const key of listPageKeys(doc.pages_json)) {
    try { await deleteFile(key); } catch (err) {
      console.error('Error deleting page from Wasabi:', key, err.message);
    }
  }
}

/**
 * Get upload categories (category_type = 'upload_data')
 */
export const getUploadCategories = async (req, res) => {
  try {
    const { channelId } = req.params;
    
    // Get the channel to find app_id
    const channel = await MediaChannel.findByPk(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    // Get categories where category_type = 'upload_data'
    const categories = await AppCategory.findAll({
      where: {
        app_id: channel.app_id,
        category_type: 'upload_data',
        status: 1
      },
      order: [['sort_order', 'ASC'], ['category_name', 'ASC']]
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching upload categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch upload categories' });
  }
};

/**
 * Get documents for a specific channel, category, year, and month
 */
export const getDocuments = async (req, res) => {
  try {
    const { channelId, categoryId, year, month } = req.params;

    const documents = await MediaChannelDocument.findAll({
      where: {
        media_channel_id: channelId,
        category_id: categoryId,
        document_year: parseInt(year),
        document_month: parseInt(month),
        status: 1
      },
      order: [['document_date', 'ASC']]
    });

    const data = await Promise.all(documents.map(async (doc) => {
      const json = doc.toJSON();
      json.document_url = await resolveStorageReadUrl(doc.document_path || doc.document_url, 3600);
      const pages = parsePagesJson(doc.pages_json);
      json.page_count = Object.keys(pages).length;
      const page1 = pages['1'];
      json.thumbnail_url = page1 ? await resolveStorageReadUrl(page1, 3600) : null;
      return json;
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};

/**
 * Upload a document — stores original PDF on Wasabi, then splits pages in the background
 * so the HTTP response returns quickly (avoids nginx 504 on large e-papers).
 */
export const uploadDocument = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { categoryId, year, month, date } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Only PDF or image files (JPG, PNG, WebP) are allowed'
      });
    }

    const existingDoc = await MediaChannelDocument.findOne({
      where: {
        media_channel_id: channelId,
        category_id: categoryId,
        document_year: parseInt(year),
        document_month: parseInt(month),
        document_date: parseInt(date)
      }
    });

    if (existingDoc) {
      await deleteDocumentStorage(existingDoc);
    }

    const folder = `media_documents/channel_${channelId}/${year}/${month}`;
    const result = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    if (!result.success) {
      return res.status(500).json({ success: false, message: 'Failed to upload file to storage' });
    }

    const documentData = {
      media_channel_id: channelId,
      category_id: categoryId,
      document_year: parseInt(year),
      document_month: parseInt(month),
      document_date: parseInt(date),
      document_path: result.fileName,
      document_url: result.publicUrl,
      pages_json: null,
      processing_status: 'processing',
      processing_error: null,
      file_name: req.file.originalname,
      file_size: req.file.size,
      uploaded_by: userId,
      status: 1
    };

    let document;
    if (existingDoc) {
      await existingDoc.update(documentData);
      document = existingDoc;
    } else {
      document = await MediaChannelDocument.create(documentData);
    }

    const fileBuffer = Buffer.from(req.file.buffer);
    setImmediate(() => {
      processDocumentPagesJob({
        documentId: document.id,
        fileBuffer,
        mimetype: req.file.mimetype,
        folder,
        originalFileKey: result.fileName,
      }).catch((err) => {
        console.error('Background page processing error:', err);
      });
    });

    const responseDoc = document.toJSON();
    responseDoc.document_url = await resolveStorageReadUrl(result.fileName, 3600);
    responseDoc.processing = true;
    responseDoc.page_count = 0;

    res.json({
      success: true,
      message: 'Document uploaded — processing pages in background',
      data: responseDoc
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

/**
 * Poll processing progress for a document (0–100%).
 */
export const getDocumentProcessingStatus = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await MediaChannelDocument.findByPk(documentId);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const job = getProcessingJob(document.id);
    if (job) {
      return res.json({
        success: true,
        data: {
          status: job.status,
          progress: job.progress ?? 0,
          page_count: job.pageCount ?? null,
          error: job.error ?? null,
        },
      });
    }

    const processingStatus = document.processing_status || 'ready';
    if (processingStatus === 'failed') {
      return res.json({
        success: true,
        data: {
          status: 'failed',
          progress: 0,
          error: document.processing_error || 'Page processing failed',
        },
      });
    }

    const pages = parsePagesJson(document.pages_json);
    const pageCount = Object.keys(pages).length;
    const isReady = processingStatus === 'ready' || pageCount > 0;

    res.json({
      success: true,
      data: {
        status: isReady ? 'ready' : 'processing',
        progress: isReady ? 100 : 0,
        page_count: pageCount || null,
      },
    });
  } catch (error) {
    console.error('Error fetching processing status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch processing status' });
  }
};

/**
 * Get the most recently uploaded document for a channel + category
 */
export const getLastUploadedDocument = async (req, res) => {
  try {
    const { channelId, categoryId } = req.params;

    const document = await MediaChannelDocument.findOne({
      where: {
        media_channel_id: channelId,
        category_id: categoryId,
        status: 1
      },
      order: [['created_at', 'DESC']]
    });

    if (!document) {
      return res.json({ success: true, data: null });
    }

    const json = document.toJSON();
    json.document_url = await resolveStorageReadUrl(document.document_path || document.document_url, 3600);
    const pages = parsePagesJson(document.pages_json);
    json.page_count = Object.keys(pages).length;
    const page1 = pages['1'];
    json.thumbnail_url = page1 ? await resolveStorageReadUrl(page1, 3600) : null;

    res.json({ success: true, data: json });
  } catch (error) {
    console.error('Error fetching last uploaded document:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch last uploaded document' });
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await MediaChannelDocument.findByPk(documentId);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Delete PDF + all split pages from Wasabi
    await deleteDocumentStorage(document);

    // Delete from database
    await document.destroy();

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};

/**
 * Get presigned URL for direct upload
 */
export const getUploadPresignedUrl = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { fileName, fileType, year, month } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ success: false, message: 'fileName and fileType are required' });
    }

    // Only allow PDF
    if (fileType !== 'application/pdf') {
      return res.status(400).json({ success: false, message: 'Only PDF files are allowed' });
    }

    const folder = `media_documents/channel_${channelId}/${year}/${month}`;
    const result = await getPresignedUrl(fileName, fileType, folder);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ success: false, message: 'Failed to generate upload URL' });
  }
};

