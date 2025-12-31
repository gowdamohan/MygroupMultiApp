import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaTeam = sequelize.define('media_team', {
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  designation: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  id_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  photo_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  photo_url: {
    type: DataTypes.STRING(500),
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
  tableName: 'media_team',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default MediaTeam;

