import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MediaScheduleSlot = sequelize.define('MediaScheduleSlot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  media_schedules_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  is_recurring: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '1=recurring weekly, 0=one-time'
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
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
  tableName: 'media_schedules_slot',
  timestamps: false
});

export default MediaScheduleSlot;

