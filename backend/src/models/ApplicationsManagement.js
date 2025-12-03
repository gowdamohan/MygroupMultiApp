import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ApplicationsManagement = sequelize.define('applications_management', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  app_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'group_create',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  file_path: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'applications_management'
});

export default ApplicationsManagement;

