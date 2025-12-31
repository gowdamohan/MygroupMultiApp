import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaSwitcher = sequelize.define('media_switcher', {
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
  active_source: {
    type: DataTypes.ENUM('live', 'mymedia', 'offline'),
    defaultValue: 'offline'
  },
  live_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  mymedia_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  offline_media_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'media_offline_media',
      key: 'id'
    }
  }
}, {
  tableName: 'media_switcher',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default MediaSwitcher;

