import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaGalleryAlbums = sequelize.define('media_gallery_albums', {
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
  album_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cover_image_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  cover_image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  images_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
  tableName: 'media_gallery_albums',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default MediaGalleryAlbums;

