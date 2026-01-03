import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaComments = sequelize.define('media_comments', {
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
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'media_comments',
      key: 'id'
    },
    comment: 'For replies to comments'
  },
  comment_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  }
}, {
  tableName: 'media_comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default MediaComments;

