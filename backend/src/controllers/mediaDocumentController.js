import { MediaChannelDocument, MediaChannel, AppCategory, User } from '../models/index.js';
import { deleteFile, getPresignedUrl, resolveStorageReadUrl, WASABI_PUBLIC_BASE_URL } from '../services/wasabiService.js';
import { processDocumentPagesJob, getProcessingJob } from '../services/documentProcessingService.js';
import { listPageKeys, parsePagesJson } from '../services/pdfPagesService.js';

/** True when document_path points to a legacy full-PDF upload (not a page WebP). */
function isLegacyPdfPath(path) {
  return Boolean(path && /\.pdf$/i.test(path));
}


/**
 * Delete all page images from Wasabi. Legacy rows may also have a separate full PDF.
 */
async function deleteDocumentStorage(doc) {
  if (!doc) return;
  const pageKeys = listPageKeys(doc.pages_json);
  const pageKeySet = new Set(pageKeys);

  if (doc.document_path && !pageKeySet.has(doc.document_path) && isLegacyPdfPath(doc.document_path)) {
    try { await deleteFile(doc.document_path); } catch (err) {
      console.error('Error deleting legacy PDF from Wasabi:', err.message);
    }
  }

  for (const key of pageKeys) {
    try { await deleteFile(key); } catch (err) {
      console.error('Error deleting page from Wasabi:', key, err.message);
    }
  }
}

/** Build API response object with signed page-1 URL as the display document. */
async function formatDocumentJson(doc) {
  const json = doc.toJSON();
  const pages = parsePagesJson(doc.pages_json);
  const page1Key = pages['1'];
  json.page_count = Object.keys(pages).length;
  json.thumbnail_url = page1Key ? await resolveStorageReadUrl(page1Key, 3600) : null;
  const displayKey = page1Key || (isLegacyPdfPath(doc.document_path) ? doc.document_path : null);
  json.document_url = displayKey
    ? await resolveStorageReadUrl(displayKey, 3600)
    : null;
  return json;
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

    const data = await Promise.all(documents.map((doc) => formatDocumentJson(doc)));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};

/**
 * Upload a document — returns immediately; splits PDF into page WebPs in background.
 * Original PDF is NOT stored on Wasabi — only per-page images in pages_json.
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
    const placeholderPath = `${folder}/_processing_${Date.now()}`;

    const documentData = {
      media_channel_id: channelId,
      category_id: categoryId,
      document_year: parseInt(year),
      document_month: parseInt(month),
      document_date: parseInt(date),
      document_path: placeholderPath,
      document_url: `${WASABI_PUBLIC_BASE_URL}/${placeholderPath}`,
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
      await existingDoc.update(documentData, { fields: Object.keys(documentData) });
      document = existingDoc;
    } else {
      document = await MediaChannelDocument.create(documentData);
    }

    // Copy buffer before response — split pages in background (no full PDF on Wasabi)
    const fileBufferCopy = Buffer.from(req.file.buffer);

    processDocumentPagesJob({
      documentId: document.id,
      fileBuffer: fileBufferCopy,
      mimetype: req.file.mimetype,
      folder,
    }).catch((jobErr) => {
      console.error(`Failed to start page processing for document ${document.id}:`, jobErr);
    });

    const responseDoc = document.toJSON();
    responseDoc.processing = true;
    responseDoc.page_count = 0;
    responseDoc.document_url = null;
    responseDoc.thumbnail_url = null;

    res.json({
      success: true,
      message: 'Document uploaded — processing pages',
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

    const json = await formatDocumentJson(document);

    res.json({ success: true, data: json });
  } catch (error) {
    console.error('Error fetching last uploaded document:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch last uploaded document' });
  }
};

/**
 * Re-run page splitting for legacy documents that still have a full PDF on Wasabi.
 */
export const reprocessDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await MediaChannelDocument.findByPk(documentId);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    if (!document.document_path || !isLegacyPdfPath(document.document_path)) {
      return res.status(400).json({
        success: false,
        message: 'Original PDF is not stored for this document. Please re-upload the file.',
      });
    }

    const { processDocumentPagesJob } = await import('../services/documentProcessingService.js');

    for (const key of listPageKeys(document.pages_json)) {
      try { await deleteFile(key); } catch (_) { /* ignore */ }
    }

    const folderMatch = document.document_path.match(/^(media_documents\/channel_\d+\/\d+\/\d+)/);
    const folder = folderMatch?.[1] || `media_documents/channel_${document.media_channel_id}/${document.document_year}/${document.document_month}`;

    await document.update({
      pages_json: null,
      processing_status: 'processing',
      processing_error: null,
    });

    processDocumentPagesJob({
      documentId: document.id,
      mimetype: 'application/pdf',
      folder,
      originalFileKey: document.document_path,
    }).catch((jobErr) => {
      console.error(`Failed to reprocess document ${document.id}:`, jobErr);
    });

    res.json({
      success: true,
      message: 'Page reprocessing started',
      data: { id: document.id, processing: true },
    });
  } catch (error) {
    console.error('Error reprocessing document:', error);
    res.status(500).json({ success: false, message: 'Failed to reprocess document' });
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
      return res.status(404).json({
        success: false,
        message: 'Document not found. It may have been deleted already, or the ID belongs to a different section (media-dashboard documents use /media-dashboard/documents/:id).',
      });
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

