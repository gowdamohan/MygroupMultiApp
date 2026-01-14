import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HeaderAdsManagement = sequelize.define('header_ads', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  app_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'group_create',
      key: 'id'
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'app_categories',
      key: 'id'
    }
  },
  franchise_holder_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'franchise_holder',
      key: 'id'
    }
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  link_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'inactive', 'expired', 'rejected'),
    defaultValue: 'pending'
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
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
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'header_ads'
});

export default HeaderAdsManagement;

