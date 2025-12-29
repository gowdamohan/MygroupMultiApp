import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AppCategory = sequelize.define('app_categories', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  app_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  category_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  category_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  category_image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 1
  },
  registration_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
    comment: 'Maximum number of registrations allowed for this category'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'app_categories'
});

export default AppCategory;

