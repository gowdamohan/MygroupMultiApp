import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaDocuments = sequelize.define('media_documents', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  media_channel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'media_channel',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  document_type: {
    type: DataTypes.ENUM('image', 'pdf'),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'media_documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default MediaDocuments;

