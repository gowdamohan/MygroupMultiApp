import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaSchedule = sequelize.define('MediaSchedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  media_channel_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  media_file: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  schedule_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  day_of_week: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '0=Sunday, 1=Monday, ... 6=Saturday'
  },
  original_schedule_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Reference to original recurring schedule'
  },
  is_edited: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '1=edited from original recurring'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'media_schedules',
  timestamps: false
});

export default MediaSchedule;

