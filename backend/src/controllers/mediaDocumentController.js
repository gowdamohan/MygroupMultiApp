import { MediaChannelDocument, MediaChannel, AppCategory, User } from '../models/index.js';
import { uploadFile, deleteFile, getPresignedUrl, resolveStorageReadUrl } from '../services/wasabiService.js';
import {
  splitPdfToWasabiPages,
  imageBufferToWasabiPage,
  listPageKeys,
  parsePagesJson,
} from '../services/pdfPagesService.js';
import { Op } from 'sequelize';

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
 * Upload a document (PDF) — stores original PDF + splits every page to WebP.
 * Partner waits (loading) until all pages are processed. pages_json:
 *   {"1":"wasabi/.../page-1.webp","2":"..."}
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

    // Check if document already exists for this date
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

    // Upload original file to Wasabi (archive / download)
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

    // Split PDF (or normalize image) into per-page WebPs — blocking so upload spinner covers this
    let pagesMap = {};
    try {
      if (req.file.mimetype === 'application/pdf') {
        const split = await splitPdfToWasabiPages(req.file.buffer, `${folder}/doc_${Date.now()}`);
        pagesMap = split.pages;
      } else {
        const split = await imageBufferToWasabiPage(req.file.buffer, `${folder}/doc_${Date.now()}`);
        pagesMap = split.pages;
      }
    } catch (splitErr) {
      console.error('PDF page split failed:', splitErr);
      // Rollback original upload
      try { await deleteFile(result.fileName); } catch (_) { /* ignore */ }
      return res.status(500).json({
        success: false,
        message: 'Failed to process PDF pages. Please try again or use a smaller PDF.',
        error: splitErr.message
      });
    }

    const pagesJson = JSON.stringify(pagesMap);
    const pageCount = Object.keys(pagesMap).length;

    if (pageCount === 0) {
      try { await deleteFile(result.fileName); } catch (_) { /* ignore */ }
      return res.status(500).json({
        success: false,
        message: 'PDF produced no pages. Please check the file and try again.',
      });
    }

    // Save or update document record (one row; pages as JSON index map)
    const documentData = {
      media_channel_id: channelId,
      category_id: categoryId,
      document_year: parseInt(year),
      document_month: parseInt(month),
      document_date: parseInt(date),
      document_path: result.fileName,
      document_url: result.publicUrl,
      pages_json: pagesJson,
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

    // Verify pages_json persisted (guards against missing DB column on older schemas)
    await document.reload();
    const savedPages = parsePagesJson(document.pages_json);
    if (Object.keys(savedPages).length === 0) {
      console.error('pages_json was not saved — run database/migrations/add_pages_json_to_media_channel_document.sql');
      await deleteDocumentStorage(document);
      await document.destroy();
      return res.status(500).json({
        success: false,
        message: 'Server database is missing the pages_json column. Contact support or run the latest DB migration.',
      });
    }

    const responseDoc = document.toJSON();
    responseDoc.document_url = await resolveStorageReadUrl(result.fileName, 3600);
    responseDoc.page_count = Object.keys(pagesMap).length;
    responseDoc.pages = pagesMap;
    const page1Key = pagesMap['1'];
    responseDoc.thumbnail_url = page1Key
      ? await resolveStorageReadUrl(page1Key, 3600)
      : null;

    res.json({
      success: true,
      message: `Document uploaded successfully (${Object.keys(pagesMap).length} page${Object.keys(pagesMap).length !== 1 ? 's' : ''})`,
      data: responseDoc
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
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

