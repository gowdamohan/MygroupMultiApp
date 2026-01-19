import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserActivity = sequelize.define('user_activity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  last_activity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: () => Math.floor(Date.now() / 1000),
    comment: 'Unix timestamp of last activity'
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '1 = active (within 15 days), 0 = inactive'
  },
  token_expires_at: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Unix timestamp when token should expire for inactive users (15 days from last activity)'
  }
}, {
  timestamps: false,
  tableName: 'user_activity',
  indexes: [
    {
      fields: ['user_id'],
      unique: true
    },
    {
      fields: ['last_activity']
    },
    {
      fields: ['is_active']
    }
  ]
});

export default UserActivity;
