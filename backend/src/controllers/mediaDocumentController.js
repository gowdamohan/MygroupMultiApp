import { MediaChannelDocument, MediaChannel, AppCategory, User } from '../models/index.js';
import { uploadFile, deleteFile, getPresignedUrl } from '../services/wasabiService.js';
import { Op } from 'sequelize';

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

    res.json({ success: true, data: documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};

/**
 * Upload a document (PDF)
 */
export const uploadDocument = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { categoryId, year, month, date } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Validate file type (PDF only)
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, message: 'Only PDF files are allowed' });
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
      // Delete old file from Wasabi
      try {
        await deleteFile(existingDoc.document_path);
      } catch (err) {
        console.error('Error deleting old file:', err);
      }
    }

    // Upload to Wasabi
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

    // Save or update document record
    const documentData = {
      media_channel_id: channelId,
      category_id: categoryId,
      document_year: parseInt(year),
      document_month: parseInt(month),
      document_date: parseInt(date),
      document_path: result.fileName,
      document_url: result.publicUrl,
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

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
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
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Delete from Wasabi
    try {
      await deleteFile(document.document_path);
    } catch (err) {
      console.error('Error deleting file from Wasabi:', err);
    }

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

