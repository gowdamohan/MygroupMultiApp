import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaSocialLinks = sequelize.define('media_social_links', {
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
  platform: {
    type: DataTypes.ENUM('website', 'youtube', 'facebook', 'instagram', 'twitter', 'linkedin', 'blog'),
    allowNull: false
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'media_social_links',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default MediaSocialLinks;

