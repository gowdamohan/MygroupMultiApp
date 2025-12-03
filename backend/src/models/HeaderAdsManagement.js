import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HeaderAdsManagement = sequelize.define('header_ads_management', {
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
  app_category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'app_categories',
      key: 'id'
    }
  },
  file_path: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'header_ads_management'
});

export default HeaderAdsManagement;

