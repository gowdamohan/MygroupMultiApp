import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaInteractions = sequelize.define('media_interactions', {
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
  likes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  dislikes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  followers_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  shortlist_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  comments_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  views_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'media_interactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default MediaInteractions;

