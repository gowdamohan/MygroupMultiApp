import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SupportMessage = sequelize.define('support_messages', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conversation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'support_conversations', key: 'id' }
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  sender_type: {
    type: DataTypes.ENUM('partner', 'admin', 'accounts', 'technical', 'system'),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true
  },
  is_read: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_deleted: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'support_messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default SupportMessage;

