import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaOfflineMedia = sequelize.define('media_offline_media', {
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
  media_type: {
    type: DataTypes.ENUM('video', 'audio'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  media_file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  media_file_url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  thumbnail_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  thumbnail_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  is_default: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'media_offline_media',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default MediaOfflineMedia;

