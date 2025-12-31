import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaGalleryImages = sequelize.define('media_gallery_images', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  album_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'media_gallery_albums',
      key: 'id'
    }
  },
  image_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  image_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  image_url: {
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
  tableName: 'media_gallery_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default MediaGalleryImages;

