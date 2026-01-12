import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SupportConversation = sequelize.define('support_conversations', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  channel_type: {
    type: DataTypes.ENUM('admin', 'accounts', 'technical'),
    allowNull: false,
    defaultValue: 'admin'
  },
  app_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'group_create', key: 'id' }
  },
  partner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  status: {
    type: DataTypes.ENUM('open', 'pending', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  last_message_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'support_conversations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default SupportConversation;

