import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SupportChatGroup = sequelize.define('support_chat_groups', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  app_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'support_chat_groups'
});

export default SupportChatGroup;
