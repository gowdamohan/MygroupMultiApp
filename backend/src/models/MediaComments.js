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
    allowNull: true,
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
  rating: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '1-5 star rating'
  },
  reviewer_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Display name for anonymous reviewers'
  },
  reviewer_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Optional email for anonymous reviewers'
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
