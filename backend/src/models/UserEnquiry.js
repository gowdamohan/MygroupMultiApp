import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserEnquiry = sequelize.define('user_enquiry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  subject: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('new', 'read', 'replied', 'closed'),
    defaultValue: 'new',
  },
  group_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'corporate',
  },
}, {
  tableName: 'user_enquiry',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default UserEnquiry;
