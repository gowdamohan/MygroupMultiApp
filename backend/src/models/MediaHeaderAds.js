import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaHeaderAds = sequelize.define('MediaHeaderAds', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  media_channel_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'media_channel',
      key: 'id'
    }
  },
  file_path: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('header1', 'header2'),
    allowNull: false,
    defaultValue: 'header1'
  },
  file_type: {
    type: DataTypes.STRING(45),
    allowNull: true,
    defaultValue: 'image'
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'media_header_ads',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default MediaHeaderAds;

