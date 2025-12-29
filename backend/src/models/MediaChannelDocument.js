import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaChannelDocument = sequelize.define('media_channel_document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  media_channel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Reference to media_channel table'
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Reference to app_categories (upload_data type)'
  },
  document_year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Year of publication'
  },
  document_month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Month of publication (1-12)'
  },
  document_date: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Date of publication (1-31)'
  },
  document_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'File path in Wasabi S3'
  },
  document_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Public URL of the document'
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Original file name'
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'File size in bytes'
  },
  uploaded_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User ID who uploaded'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 1,
    comment: '1=Active, 0=Inactive'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'media_channel_document'
});

export default MediaChannelDocument;

